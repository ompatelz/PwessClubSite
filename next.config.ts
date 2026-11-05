import type { NextConfig } from "next";

// Supabase hosts edition PDFs and page images. Production projects live on
// *.supabase.co; the configured origin is added too, for local stand-ins.
function configuredSupabaseOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
}
const supabaseSources = ["https://*.supabase.co", configuredSupabaseOrigin()]
  .filter((source, index, all) => source && all.indexOf(source) === index)
  .join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseSources}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseSources}`,
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Share images read their fonts from disk at request time.
  outputFileTracingIncludes: {
    "/**/opengraph-image*": ["./assets/og-fonts/*.woff"],
  },
  turbopack: {
    root: process.cwd(),
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
      ],
    }];
  },
};

export default nextConfig;
