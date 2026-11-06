import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getTeaDb as getServiceDb } from "../../../../lib/tea.ts";
import { consumeRateLimit, readJsonBody } from "../../../../lib/request-security.ts";
import { nnnEditionTitle } from "../../../../lib/nnn-title.ts";

export const runtime = "nodejs";

// NNN is for the DAU community only. Issues are never public: the PDF lives in a
// private storage bucket and reaches a reader only as an email attachment sent to
// a @dau.ac.in address.

const maxRequestBytes = 1024;
// Brevo accepts messages up to about 20 MB including the base64-encoded attachment.
const maxAttachmentBytes = 12 * 1024 * 1024;
const dauEmail = /^[a-z0-9._%+-]+@dau\.ac\.in$/;

function json(message: string, status: number, code?: string) {
  return Response.json(
    { message, ...(code ? { code } : {}) },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

type Delivery = { to: string; subject: string; text: string; filename: string; pdf: Buffer; tag: string };

// Local trial only: with TRIAL_MAIL_DIR set and no Brevo key, the email is written
// to that folder instead of being sent. Never set TRIAL_MAIL_DIR on the live site.
async function saveTrialEmail(directory: string, delivery: Delivery) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = join(directory, `${stamp}-${delivery.to.replace(/[^a-z0-9]/g, "_")}`);
  await mkdir(directory, { recursive: true });
  await writeFile(`${base}.json`, JSON.stringify({ to: delivery.to, subject: delivery.subject, text: delivery.text, attachment: delivery.filename, bytes: delivery.pdf.length }, null, 2));
  await writeFile(`${base}-${delivery.filename}`, delivery.pdf);
}

async function sendWithBrevo(delivery: Delivery, apiKey: string, senderEmail: string) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: { name: "The Press Club", email: senderEmail },
      replyTo: { name: "The Press Club", email: senderEmail },
      to: [{ email: delivery.to }],
      subject: delivery.subject,
      textContent: delivery.text,
      attachment: [{ name: delivery.filename, content: delivery.pdf.toString("base64") }],
      tags: [delivery.tag],
    }),
    signal: AbortSignal.timeout(30000),
  });
  const result = (await response.json().catch(() => null)) as { messageId?: string; code?: string } | null;
  if (!response.ok || !result?.messageId) {
    console.error("NNN Brevo API returned", response.status, result?.code);
    return false;
  }
  return true;
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
  if (!parsed.ok || typeof parsed.value !== "object" || parsed.value === null) {
    return json("Enter a DAU email address.", 400);
  }
  const submitted = parsed.value as { email?: unknown; editionId?: unknown };

  const email = typeof submitted.email === "string" ? submitted.email.trim().toLowerCase() : "";
  if (email.length > 254 || !dauEmail.test(email)) {
    return json("Enter your @dau.ac.in email address.", 400);
  }

  const editionId = Number(submitted.editionId);
  if (!Number.isInteger(editionId) || editionId < 1) {
    return json("Choose an NNN issue.", 400);
  }

  const db = getServiceDb();
  if (!db) return json("Email delivery is temporarily unavailable.", 503, "delivery_unavailable");

  const rateLimit = await consumeRateLimit(db, request, `nnn-email:${editionId}:${email}`, 1, 5 * 60);
  if (rateLimit === "unavailable") return json("Email delivery is temporarily unavailable.", 503, "delivery_unavailable");
  if (rateLimit === "limited") return json("This issue was just sent to that address. Check your inbox, or try again in a few minutes.", 429);

  const { data: edition, error } = await db
    .from("NNN")
    .select("id,Month,Year,Pdf_url")
    .eq("id", editionId)
    .maybeSingle();
  if (error || !edition) return json("That NNN issue could not be found.", 404);

  const title = nnnEditionTitle(edition);
  const download = await db.storage.from("NNN").download(String(edition.Pdf_url));
  if (download.error || !download.data) {
    console.error("NNN email: could not read the issue file", download.error?.message);
    return json("We couldn't send the issue right now. Please try again later.", 502, "file_unavailable");
  }
  const pdf = Buffer.from(await download.data.arrayBuffer());
  if (pdf.length > maxAttachmentBytes) {
    console.error("NNN email: issue file is too large to attach", pdf.length);
    return json("This issue is too large to email. Please contact the Press Club.", 502, "file_too_large");
  }

  const delivery: Delivery = {
    to: email,
    subject: `News and Nonsense, ${title}`,
    text: `Here is your copy of News and Nonsense, ${title}.\n\nNNN is shared with the DAU community only. Please don't post it publicly.\n\nThe Press Club at DAU`,
    filename: `NNN-${title.replace(/\s+/g, "-")}.pdf`,
    pdf,
    tag: `nnn-${edition.Year}-${String(edition.Month).padStart(2, "0")}`,
  };

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim().toLowerCase();
  const trialMailDir = process.env.TRIAL_MAIL_DIR;

  try {
    if (apiKey && senderEmail && dauEmail.test(senderEmail)) {
      if (!await sendWithBrevo(delivery, apiKey, senderEmail)) {
        return json("We couldn't send the issue right now. Please try again later.", 502, "delivery_failed");
      }
    } else if (trialMailDir) {
      await saveTrialEmail(trialMailDir, delivery);
    } else {
      console.error("NNN email: Brevo API key or DAU sender is missing");
      return json("Email delivery is being set up. Please try again later.", 503);
    }
  } catch (sendError) {
    console.error("NNN email failed", sendError instanceof Error ? sendError.name : "request_error");
    return json("We couldn't send the issue right now. Please try again later.", 502, "gateway_request_failed");
  }

  return json(`${title} is on its way to your DAU inbox.`, 200);
}
