import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "invalid" | "too_large" | "wrong_type" };

export async function readJsonBody(request: Request, maximumBytes: number): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") return { ok: false, reason: "wrong_type" };

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    return { ok: false, reason: "too_large" };
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maximumBytes) {
    return { ok: false, reason: "too_large" };
  }

  try {
    return { ok: true, value: JSON.parse(body) };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

function requestAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",", 1)[0].trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

export async function consumeRateLimit(
  db: SupabaseClient,
  request: Request,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<"allowed" | "limited" | "unavailable"> {
  const key = createHash("sha256")
    .update(`${action}\0${requestAddress(request)}`)
    .digest("hex");
  const { data, error } = await db.rpc("consume_request_rate_limit", {
    rate_key: key,
    request_limit: limit,
    window_seconds: windowSeconds,
  });

  if (error) {
    console.error("Rate limit check failed", error.code);
    return "unavailable";
  }
  return data === true ? "allowed" : "limited";
}
