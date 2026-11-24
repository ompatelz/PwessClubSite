import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy, configuredSupabaseOrigin } from "@/lib/content-security-policy";

// Fresh script nonces for HTML, with session refresh restricted to staff/auth.
// Public HTML renders per request; public data queries retain their own caches.
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("base64");
  const policy = contentSecurityPolicy(nonce, configuredSupabaseOrigin(), process.env.NODE_ENV === "development");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const next = () => NextResponse.next({ request: { headers } });
  let response = next();
  const secureResponse = () => {
    response.headers.set("Content-Security-Policy", policy);
    response.headers.set("Reporting-Endpoints", `csp="${request.nextUrl.origin}/api/security/csp-report"`);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  const staffPath = request.nextUrl.pathname === "/press-club" || request.nextUrl.pathname.startsWith("/press-club/") || request.nextUrl.pathname.startsWith("/auth/");
  if (!staffPath) return secureResponse();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return secureResponse();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        headers.set("cookie", request.cookies.toString());
        response = next();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Verifies the sign-in token and refreshes it when it is close to expiring.
  await supabase.auth.getClaims();
  return secureResponse();
}

export const config = {
  // APIs and binary/static files never render framework inline scripts.
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|woff|woff2|pdf|txt|xml)$).*)"],
};
