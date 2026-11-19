"use client";

import { buildManifest, pageFileName, renderPdfPages } from "@/lib/edition-pages-browser";
import type { getBrowserSupabase } from "@/lib/supabase/browser";

type DeskSupabase = ReturnType<typeof getBrowserSupabase>;

// Where an Entelechy edition's published PDF can be downloaded.
export function entelechyPdfUrl(supabase: DeskSupabase, pdfPath: string) {
  return /^https?:/.test(pdfPath) ? pdfPath : supabase.storage.from("Entelechy").getPublicUrl(pdfPath).data.publicUrl;
}

// Draws a PDF's pages in the browser and uploads them as the edition's page images,
// replacing any already there. The manifest goes last, so the site only switches to
// the page-image reader once every page is in place. Returns the page count.
export async function uploadPageImages(
  supabase: DeskSupabase,
  editionId: number,
  pdf: Blob,
  report: (message: string) => void,
) {
  const pages = await renderPdfPages(pdf, (done, total) => report(`making page ${Math.min(done + 1, total)} of ${total}`));
  const folder = `Entelechy/${editionId}`;
  for (const page of pages) {
    report(`uploading page ${page.number} of ${pages.length}`);
    for (const [width, blob] of Object.entries(page.blobs)) {
      const put = await supabase.storage.from("edition-pages")
        .upload(`${folder}/${pageFileName(page.number, Number(width))}`, blob, { contentType: "image/webp", upsert: true });
      if (put.error) throw new Error("upload");
    }
  }
  const manifest = new Blob([JSON.stringify(buildManifest(pages), null, 2)], { type: "application/json" });
  const put = await supabase.storage.from("edition-pages").upload(`${folder}/manifest.json`, manifest, { contentType: "application/json", upsert: true });
  if (put.error) throw new Error("upload");
  return pages.length;
}

// Downloads an existing edition's PDF and makes its page images.
export async function makeImagesForEdition(
  supabase: DeskSupabase,
  edition: { id: number; pdf_url: string },
  report: (message: string) => void,
) {
  report("downloading the PDF");
  const response = await fetch(entelechyPdfUrl(supabase, edition.pdf_url));
  if (!response.ok) throw new Error("download");
  return uploadPageImages(supabase, edition.id, await response.blob(), report);
}
