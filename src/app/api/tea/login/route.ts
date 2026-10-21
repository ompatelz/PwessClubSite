import { NextResponse } from "next/server";
import { createReviewerSession, passwordMatches, reviewerCookie, reviewerSessionSeconds } from "@/lib/tea-auth";
import { getTeaDb, sameOrigin, teaEnabled, teaJson } from "@/lib/tea";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!teaEnabled() || !getTeaDb()) return teaJson("The review desk is not open yet.", 503);
  if (!sameOrigin(request)) return teaJson("Request rejected.", 403);
  if (Number(request.headers.get("content-length") ?? 0) > 256) return teaJson("Request rejected.", 413);

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return teaJson("Enter the Press Club password.", 400);
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
