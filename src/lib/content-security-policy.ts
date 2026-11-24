export function configuredSupabaseOrigin(value = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return "";
    return url.origin;
  } catch { return ""; }
}

export function contentSecurityPolicy(nonce: string, origin: string, development = false) {
  // The nonce comes from server-generated random bytes, never request headers.
  if (!/^[A-Za-z0-9+/=_-]{20,}$/.test(nonce)) throw new Error("Invalid CSP nonce");
  const source = configuredSupabaseOrigin(origin);
  return [
    "default-src 'self'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${development ? " 'unsafe-eval'" : ""}`,
    // React PDF and existing components use style attributes. Inline JavaScript
    // remains forbidden; restricting inline styles is a separate migration.
    "style-src 'self' 'unsafe-inline'", `img-src 'self' data: blob: ${source}`.trim(),
    "font-src 'self' data:", `connect-src 'self' ${source}${development ? " ws: wss:" : ""}`.trim(),
    "worker-src 'self' blob:", "report-uri /api/security/csp-report", "report-to csp",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
