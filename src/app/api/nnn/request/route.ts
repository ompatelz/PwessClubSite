import { readFile } from "node:fs/promises";

export const runtime = "nodejs";

const issue = {
  path: "issues/nnn/august-2026-part-1.pdf",
};

const cooldown = new Map<string, number>();
const cooldownMs = 5 * 60 * 1000;

function json(message: string, status: number, code?: string) {
  return Response.json(
    { message, ...(code ? { code } : {}) },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json("Request rejected.", 403);
  }

  if (Number(request.headers.get("content-length") ?? 0) > 1024) {
    return json("Request too large.", 413);
  }

  let submitted: unknown;
  try {
    submitted = await request.json();
  } catch {
    return json("Enter a DAU email address.", 400);
  }

  const email =
    typeof submitted === "object" && submitted !== null && "email" in submitted &&
    typeof submitted.email === "string"
      ? submitted.email.trim().toLowerCase()
      : "";

  if (email.length > 254 || !/^[a-z0-9._%+-]+@dau\.ac\.in$/.test(email)) {
    return json("Enter your @dau.ac.in email address.", 400);
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

  const now = Date.now();
  if ((cooldown.get(email) ?? 0) > now) {
    return json("An issue was recently requested for this address. Please check your inbox.", 429);
  }
  cooldown.set(email, now + cooldownMs);

  try {
    const pdf = await readFile(issue.path);
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
      cooldown.delete(email);
      return json(
        "We couldn't send the issue right now. Please try again later.",
        502,
        result?.error ?? `gateway_http_${response.status}`,
      );
    }
    return json("The August issue is on its way to your DAU inbox.", 200);
  } catch (error) {
    console.error("NNN email send failed", error);
    cooldown.delete(email);
    return json("We couldn't send the issue right now. Please try again later.", 502, "gateway_request_failed");
  }
}
