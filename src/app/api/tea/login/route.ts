import { NextResponse } from "next/server";
import { createReviewerSession, passwordMatches, reviewerCookie, reviewerSessionSeconds } from "@/lib/tea-auth";
import { getTeaDb, sameOrigin, teaEnabled, teaJson } from "@/lib/tea";
import { consumeRateLimit, readJsonBody } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!teaEnabled()) return teaJson("The review desk is not open yet.", 503);
  if (!sameOrigin(request)) return teaJson("Request rejected.", 403);
  const parsed = await readJsonBody(request, 256);
  if (!parsed.ok && parsed.reason === "too_large") return teaJson("Request rejected.", 413);
  if (!parsed.ok) {
    return teaJson("Enter the Press Club password.", 400);
  }
  const input = parsed.value;
  const db = getTeaDb();
  if (!db) return teaJson("The review desk is not configured yet.", 503);
  const rateLimit = await consumeRateLimit(db, request, "tea-login", 5, 15 * 60);
  if (rateLimit === "unavailable") return teaJson("The review desk is temporarily unavailable.", 503);
  if (rateLimit === "limited") {
    return teaJson("Too many sign-in attempts. Please wait and try again.", 429);
  }
  const password = typeof input === "object" && input !== null && "password" in input
    ? input.password : null;
  if (typeof password !== "string" || !passwordMatches(password)) {
    return teaJson("That password didn't match.", 401);
  }
  const session = createReviewerSession();
  if (!session) return teaJson("The review desk is not configured yet.", 503);

  const response = NextResponse.json({ message: "Signed in." }, {
    headers: { "Cache-Control": "no-store" },
  });
  response.cookies.set(reviewerCookie, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: reviewerSessionSeconds,
  });
  return response;
}
