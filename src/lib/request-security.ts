import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "invalid" | "too_large" | "wrong_type" };

export async function readJsonBody(request: Request, maximumBytes: number, allowedTypes = ["application/json"]): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (!contentType || !allowedTypes.includes(contentType)) return { ok: false, reason: "wrong_type" };

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    return { ok: false, reason: "too_large" };
  }

  try {
    const reader = request.body?.getReader();
    if (!reader) return { ok: false, reason: "invalid" };
    const decoder = new TextDecoder();
    let bytes = 0;
    let body = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maximumBytes) {
        await reader.cancel();
        return { ok: false, reason: "too_large" };
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
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
  return consumeIdentityRateLimit(db, `${action}\0${requestAddress(request)}`, limit, windowSeconds);
}

// For limits that must follow a recipient across IPs and issue IDs. The raw
// identity is never stored in the limiter table or logs.
export async function consumeIdentityRateLimit(db: SupabaseClient, identity: string, limit: number, windowSeconds: number): Promise<"allowed" | "limited" | "unavailable"> {
  const key = createHash("sha256")
    .update(identity)
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
