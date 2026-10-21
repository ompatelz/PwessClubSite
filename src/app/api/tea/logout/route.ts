import { NextResponse } from "next/server";
import { reviewerCookie } from "@/lib/tea-auth";
import { sameOrigin, teaJson } from "@/lib/tea";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return teaJson("Request rejected.", 403);
  const response = NextResponse.json({ message: "Signed out." }, {
    headers: { "Cache-Control": "no-store" },
  });
  response.cookies.delete(reviewerCookie);
  return response;
}
