import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

// Signs the member out of the staff desk. POST only, from the site itself.
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) {
    return new NextResponse("Request rejected.", { status: 403 });
  }

  const supabase = await getServerSupabase();
  await supabase?.auth.signOut();
  return NextResponse.redirect(new URL("/press-club", origin), { status: 303 });
}
