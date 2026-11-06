import { cache } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { parseEditionPagesManifest } from "@/lib/edition-pages-manifest";

export type { EditionPage } from "@/lib/edition-pages-manifest";

// Page images live in the public `edition-pages` bucket as <Entelechy|NNN>/<row id>/.
export const EDITION_PAGES_BUCKET = "edition-pages";

// Loads an edition's page images, or null when none have been uploaded yet.
// The result is cached for 5 minutes, like the archive pages.
export const getEditionPages = cache(async (kind: "Entelechy" | "NNN", id: number) => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const folder = `${kind}/${id}`;
  const manifestUrl = supabase.storage.from(EDITION_PAGES_BUCKET).getPublicUrl(`${folder}/manifest.json`).data.publicUrl;
  const baseUrl = manifestUrl.slice(0, manifestUrl.lastIndexOf("/") + 1);

  try {
    const response = await fetch(manifestUrl, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    return parseEditionPagesManifest(await response.json(), baseUrl);
  } catch {
    return null;
  }
});
