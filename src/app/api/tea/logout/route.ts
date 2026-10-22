import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeReviewerSession, reviewerCookie } from "@/lib/tea-auth";
import { getTeaDb, sameOrigin, teaJson } from "@/lib/tea";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return teaJson("Request rejected.", 403);
  const token = (await cookies()).get(reviewerCookie)?.value;
  const db = getTeaDb();
  if (token && (!db || !await revokeReviewerSession(db, token))) {
    return teaJson("Sign-out is temporarily unavailable. Please try again.", 503);
  }
  const response = NextResponse.json({ message: "Signed out." }, {
    headers: { "Cache-Control": "no-store" },
  });
  response.cookies.delete(reviewerCookie);
  return response;
}
