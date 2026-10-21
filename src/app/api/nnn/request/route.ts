import { readFile } from "node:fs/promises";

export const runtime = "nodejs";

const issue = {
  subject: "News and Nonsense — August 2026, Part 1",
  filename: "NNN-August-2026-Part-1.pdf",
  path: "issues/nnn/august-2026-part-1.pdf",
};

const cooldown = new Map<string, number>();
const cooldownMs = 5 * 60 * 1000;

function json(message: string, status: number) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
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

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NNN_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error("NNN email: RESEND_API_KEY or NNN_FROM_EMAIL is missing");
    return json("Email delivery is being set up. Please try again later.", 503);
  }

  const now = Date.now();
  if ((cooldown.get(email) ?? 0) > now) {
    return json("An issue was recently requested for this address. Please check your inbox.", 429);
  }
  cooldown.set(email, now + cooldownMs);

  try {
    const pdf = await readFile(issue.path);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: issue.subject,
        text: "Here is your copy of News and Nonsense, August 2026 Part 1. — The Press Club at DAU",
        attachments: [{ filename: issue.filename, content: pdf.toString("base64") }],
      }),
    });

    if (!response.ok) {
      console.error("NNN email provider returned", response.status);
      cooldown.delete(email);
      return json("We couldn't send the issue right now. Please try again later.", 502);
    }
    return json("The August issue is on its way to your DAU inbox.", 200);
  } catch (error) {
    console.error("NNN email send failed", error);
    cooldown.delete(email);
    return json("We couldn't send the issue right now. Please try again later.", 502);
  }
}
