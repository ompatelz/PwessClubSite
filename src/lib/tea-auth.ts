import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const reviewerCookie = "press_club_review";
export const reviewerSessionSeconds = 4 * 60 * 60;

function authKey() {
  const secret = process.env.TEA_SESSION_SECRET;
  const password = process.env.TEA_REVIEW_PASSWORD;
  if (!secret || !password) return null;
  return createHash("sha256").update(secret).update("\0").update(password).digest();
}

export function reviewerConfigured() {
  return Boolean(authKey());
}

export function passwordMatches(input: string) {
  const configured = process.env.TEA_REVIEW_PASSWORD;
  if (!configured || !authKey()) return false;
  const suppliedDigest = createHash("sha256").update(input).digest();
  const configuredDigest = createHash("sha256").update(configured).digest();
  return timingSafeEqual(suppliedDigest, configuredDigest);
}

export function createReviewerSession() {
  const key = authKey();
  if (!key) return null;
  const expiry = Math.floor(Date.now() / 1000) + reviewerSessionSeconds;
  const payload = `${expiry}.${randomBytes(24).toString("base64url")}`;
  const signature = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function validReviewerSession(token: string | undefined) {
  const key = authKey();
  if (!key || !token) return false;
  const [expiryText, nonce, signature, extra] = token.split(".");
  const expiry = Number(expiryText);
  if (extra || !nonce || !signature || !Number.isSafeInteger(expiry)) return false;
  if (expiry <= Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac("sha256", key)
    .update(`${expiryText}.${nonce}`)
    .digest();
  let supplied: Buffer;
  try {
    supplied = Buffer.from(signature, "base64url");
  } catch {
    return false;
  }
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function sessionRecord(token: string) {
  const [expiryText] = token.split(".");
  return {
    session_hash: createHash("sha256").update(token).digest("hex"),
    expires_at: new Date(Number(expiryText) * 1000).toISOString(),
  };
}

export async function reviewerSessionRevoked(db: SupabaseClient, token: string) {
  try {
    const { data, error } = await db
      .from("revoked_reviewer_sessions")
      .select("session_hash")
      .eq("session_hash", sessionRecord(token).session_hash)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  } catch (error) {
    console.error("Reviewer session check failed", error instanceof Error ? error.name : "database_error");
    return true;
  }
}

export async function revokeReviewerSession(db: SupabaseClient, token: string) {
  if (!validReviewerSession(token)) return true;
  try {
    const { error } = await db.from("revoked_reviewer_sessions").upsert(sessionRecord(token));
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Reviewer session revocation failed", error instanceof Error ? error.name : "database_error");
    return false;
  }
}
