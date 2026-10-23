import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getTeaDb } from "../../../../lib/tea.ts";
import { consumeRateLimit, readJsonBody } from "../../../../lib/request-security.ts";
import { NNN_EMAIL_ISSUE } from "../../../../lib/nnn-email-issue.ts";

export const runtime = "nodejs";

const issuePath = join(process.cwd(), ...NNN_EMAIL_ISSUE.relativePath);

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

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim().toLowerCase();
  if (!apiKey || !senderEmail || !/^[a-z0-9._%+-]+@dau\.ac\.in$/.test(senderEmail)) {
    console.error("NNN email: Brevo API key or DAU sender is missing");
    return json("Email delivery is being set up. Please try again later.", 503);
  }

  try {
    const pdf = await readFile(issuePath);
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: "The Press Club", email: senderEmail },
        replyTo: { name: "The Press Club", email: senderEmail },
        to: [{ email }],
        subject: NNN_EMAIL_ISSUE.subject,
        textContent: `Here is your copy of News and Nonsense, ${NNN_EMAIL_ISSUE.label}.\n\nThe Press Club at DAU`,
        attachment: [{
          name: NNN_EMAIL_ISSUE.filename,
          content: pdf.toString("base64"),
        }],
        tags: [NNN_EMAIL_ISSUE.tag],
      }),
      signal: AbortSignal.timeout(30000),
    });

    const result = (await response.json().catch(() => null)) as
      | { messageId?: string; code?: string }
      | null;
    if (!response.ok || !result?.messageId) {
      console.error("NNN Brevo API returned", response.status, result?.code);
      return json(
        "We couldn't send the issue right now. Please try again later.",
        502,
        "delivery_failed",
      );
    }
    return json(`${NNN_EMAIL_ISSUE.label} is on its way to your DAU inbox.`, 200);
  } catch (error) {
    console.error("NNN Brevo request failed", error instanceof Error ? error.name : "request_error");
    return json("We couldn't send the issue right now. Please try again later.", 502, "gateway_request_failed");
  }
}
