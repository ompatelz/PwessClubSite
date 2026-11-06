import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

// Google sends the member back here after they choose their account. The code
// is exchanged for a session cookie, then they land on the staff desk.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/press-club";
  // Only ever return to a staff desk page on this site.
  const destination = /^\/press-club(\/[\w-]*)*$/.test(next) ? next : "/press-club";

  if (code) {
    const supabase = await getServerSupabase();
    const { error } = supabase ? await supabase.auth.exchangeCodeForSession(code) : { error: true };
    if (!error) return NextResponse.redirect(new URL(destination, url.origin));
  }

  return NextResponse.redirect(new URL("/press-club?signin=failed", url.origin));
}
