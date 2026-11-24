import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-origin";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/press-club", "/auth/", "/api/"] }, sitemap: `${siteOrigin()}/sitemap.xml` };
}
