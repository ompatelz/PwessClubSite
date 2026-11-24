# Edition page images

Entelechy editions can open as a scrolling column of page images. Readers get the first page straight away, the mouse wheel and touch scrolling behave normally, phones can pinch-zoom, and phones download smaller images than desktops. An Entelechy edition without page images still opens in the PDF reader.

**NNN is email-only. Never upload NNN pages or PDFs to this public bucket.** Keep NNN PDFs in the private `NNN` bucket and distribute them through the DAU email request flow.

## One-time setup

Run `supabase/migrations/20261105090000_edition_pages_bucket.sql` in the Supabase project. It creates a new public bucket called `edition-pages` that accepts only WebP images and JSON, up to 5 MB per file. The existing `Entelechy` and `NNN` PDF buckets are not changed. The public can read files in the new bucket but cannot upload, change or delete them.

## For each edition

1. Find the edition's row **id** in the `Entelechy` table (not the edition number).
2. Make the images on any computer with the repository installed:

   ```bash
   npm run edition:pages -- path/to/edition.pdf edition-pages-output
   ```

   This writes two WebP images per page (800 px wide for phones, 1400 px for larger screens) and a `manifest.json` that lists them. A 40-page magazine takes well under a minute.
3. In the Supabase dashboard, open **Storage → edition-pages** and create the folder `Entelechy/<id>`. Upload every file from the output folder into it, including `manifest.json`.
4. Open the edition on the site. Within five minutes it switches from the PDF reader to the page images. "Open original PDF" stays available for anyone who wants the file itself.

To replace the images, upload the new files over the old ones. To go back to the PDF reader, delete `manifest.json` from the edition's folder.

## Notes

- Text in page images cannot be selected or searched; the original PDF link covers that.
- If the manifest is missing or malformed, the site uses the PDF reader instead of showing broken pages.
- Pages can be linked directly with `#page-<number>`, for example `/Entelechy/4#page-12`.
