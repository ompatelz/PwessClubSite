import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const reviewerCookie = "press_club_review";
export const reviewerSessionSeconds = 12 * 60 * 60;

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
