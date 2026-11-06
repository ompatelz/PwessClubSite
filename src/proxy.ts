import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Keeps a staff member's sign-in fresh. Runs only on the staff desk and auth
// routes, so public pages are untouched and stay cached. This only refreshes the
// session; each page and every database rule still checks who is signed in.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Verifies the sign-in token and refreshes it when it is close to expiring.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/press-club/:path*", "/auth/:path*"],
};
