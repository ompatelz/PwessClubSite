export function siteOrigin() {
  const value = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://pwess-club-site.vercel.app");
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || (process.env.NODE_ENV === "development" && url.protocol === "http:")) return url.origin;
  } catch { /* Fall back to the verified public domain. */ }
  return "https://pwess-club-site.vercel.app";
}
