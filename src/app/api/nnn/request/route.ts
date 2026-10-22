import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getTeaDb } from "../../../../lib/tea.ts";
import { consumeRateLimit, readJsonBody } from "../../../../lib/request-security.ts";

export const runtime = "nodejs";

const issuePath = join(process.cwd(), "issues", "nnn", "august-2026-part-1.pdf");

const maxRequestBytes = 1024;

function json(message: string, status: number, code?: string) {
  return Response.json(
    { message, ...(code ? { code } : {}) },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (process.env.NNN_EMAIL_ENABLED !== "true") {
    return json("Email delivery is not available yet.", 503, "email_disabled");
  }

  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return json("Request rejected.", 403);
  }

  const parsed = await readJsonBody(request, maxRequestBytes);
  if (!parsed.ok && parsed.reason === "too_large") return json("Request too large.", 413);
  if (!parsed.ok) {
    return json("Enter a DAU email address.", 400);
  }
  const submitted = parsed.value;

  const email =
    typeof submitted === "object" && submitted !== null && "email" in submitted &&
    typeof submitted.email === "string"
      ? submitted.email.trim().toLowerCase()
      : "";

  if (email.length > 254 || !/^[a-z0-9._%+-]+@dau\.ac\.in$/.test(email)) {
    return json("Enter your @dau.ac.in email address.", 400);
  }

  const db = getTeaDb();
  if (!db) return json("Email delivery is temporarily unavailable.", 503, "delivery_unavailable");
  const rateLimit = await consumeRateLimit(db, request, `nnn-email:${email}`, 1, 5 * 60);
  if (rateLimit === "unavailable") {
    return json("Email delivery is temporarily unavailable.", 503, "delivery_unavailable");
  }
  if (rateLimit === "limited") {
    return json("An issue was recently requested. Please wait and try again.", 429);
  }

  const gatewayUrl = process.env.NNN_GMAIL_SCRIPT_URL;
  const gatewaySecret = process.env.NNN_GMAIL_SCRIPT_SECRET;
  if (!gatewayUrl || !gatewaySecret) {
    console.error("NNN email: Gmail script URL or secret is missing");
    return json("Email delivery is being set up. Please try again later.", 503);
  }

  let destination: URL;
  try {
    destination = new URL(gatewayUrl);
  } catch {
    return json("Email delivery is being set up. Please try again later.", 503);
  }
  if (destination.protocol !== "https:" || destination.hostname !== "script.google.com") {
    return json("Email delivery is being set up. Please try again later.", 503);
  }

  try {
    const pdf = await readFile(issuePath);
    const response = await fetch(destination, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        secret: gatewaySecret,
        email,
        pdfBase64: pdf.toString("base64"),
      }),
      signal: AbortSignal.timeout(30000),
    });

    const result = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;
    if (!response.ok || result?.ok !== true) {
      console.error("NNN Gmail script returned", response.status, result?.error);
      return json(
        "We couldn't send the issue right now. Please try again later.",
        502,
        "delivery_failed",
      );
    }
    return json("The August issue is on its way to your DAU inbox.", 200);
  } catch (error) {
    console.error("NNN email send failed", error);
    return json("We couldn't send the issue right now. Please try again later.", 502, "gateway_request_failed");
  }
}
