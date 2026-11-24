import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-origin";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/Entelechy", "/NNN", "/Blog", "/Past-members", "/Editorial", "/Media-Consent", "/Contact"];
  if (process.env.TEA_ENABLED === "true") routes.push("/Tea");
  return routes.map(path => ({ url: `${siteOrigin()}${path}` }));
}
