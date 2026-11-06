import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { parseEditionPagesManifest } from "../src/lib/edition-pages-manifest.ts";
import { renderEditionPages } from "../scripts/edition-pages.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const base = "https://example.supabase.co/storage/v1/object/public/edition-pages/Entelechy/4/";

const validManifest = {
  version: 1,
  pages: [
    { width: 1400, height: 1981, files: { 800: "page-001-800.webp", 1400: "page-001-1400.webp" } },
    { width: 1400, height: 1981, files: { 1400: "page-002-1400.webp", 800: "page-002-800.webp" } },
  ],
};

// A two-page PDF built by hand, so the test needs no fixture files.
function tinyPdf(pageCount) {
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>"];
  const kids = Array.from({ length: pageCount }, (_, i) => `${3 + i * 2} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`);
  for (let i = 0; i < pageCount; i += 1) {
    const stream = `0.2 0.4 0.7 rg 0 600 595 242 re f BT /F1 40 Tf 48 700 Td (Test page ${i + 1}) Tj ET`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${3 + pageCount * 2} 0 R >> >> /Contents ${4 + i * 2} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let body = "%PDF-1.4\n";
  const offsets = objects.map((object, index) => {
    const offset = body.length;
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return body;
}

test("a valid manifest becomes absolute image URLs with a phone-to-desktop srcset", () => {
  const pages = parseEditionPagesManifest(validManifest, base);

  assert.equal(pages.length, 2);
  assert.deepEqual(pages[0], {
    number: 1,
    width: 1400,
    height: 1981,
    src: `${base}page-001-1400.webp`,
    srcSet: `${base}page-001-800.webp 800w, ${base}page-001-1400.webp 1400w`,
  });
  assert.equal(pages[1].src, `${base}page-002-1400.webp`);
});

test("a broken or unsafe manifest falls back to the PDF reader", () => {
  assert.equal(parseEditionPagesManifest(null, base), null);
  assert.equal(parseEditionPagesManifest({ ...validManifest, version: 2 }, base), null);
  assert.equal(parseEditionPagesManifest({ version: 1, pages: [] }, base), null);
  assert.equal(parseEditionPagesManifest({ version: 1, pages: [{ width: 1400, height: 1981, files: {} }] }, base), null);
  assert.equal(parseEditionPagesManifest({ version: 1, pages: [{ width: 0, height: 1981, files: { 800: "a.webp" } }] }, base), null);
  assert.equal(
    parseEditionPagesManifest({ version: 1, pages: [{ width: 1400, height: 1981, files: { 800: "../../NNN/secret.webp" } }] }, base),
    null,
  );
  assert.equal(
    parseEditionPagesManifest({ version: 1, pages: [{ width: 1400, height: 1981, files: { 800: "page.png" } }] }, base),
    null,
  );
});

test("the generator writes WebP pages at both widths and a matching manifest", async () => {
  const dir = await mkdtemp(join(tmpdir(), "edition-pages-"));
  try {
    const pdfPath = join(dir, "edition.pdf");
    await writeFile(pdfPath, tinyPdf(2), "latin1");
    const outDir = join(dir, "out");

    const manifest = await renderEditionPages(pdfPath, outDir, { log: () => {} });
    const files = (await readdir(outDir)).sort();

    assert.equal(manifest.pageCount, 2);
    assert.deepEqual(files, [
      "manifest.json",
      "page-001-1400.webp",
      "page-001-800.webp",
      "page-002-1400.webp",
      "page-002-800.webp",
    ]);
    const webp = await readFile(join(outDir, "page-001-800.webp"));
    assert.equal(webp.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(webp.subarray(8, 12).toString("ascii"), "WEBP");

    const written = JSON.parse(await readFile(join(outDir, "manifest.json"), "utf8"));
    const parsed = parseEditionPagesManifest(written, base);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].width, 1400);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Entelechy pages use page images when present and keep the PDF reader otherwise", async () => {
  const page = await read("../src/app/Entelechy/[id]/page.tsx");
  assert.match(page, /getEditionPages\("Entelechy", edition\.id\)/);
  assert.match(page, /<PageImageReader /);
  assert.match(page, /<PDFWrapper url=\{documentUrl\} \/>/);
});

test("NNN pages never show the issue; they offer it by email", async () => {
  const page = await read("../src/app/NNN/[id]/page.tsx");
  assert.match(page, /<NNNEmailRequest editionId=\{edition\.id\}/);
  assert.doesNotMatch(page, /PDFWrapper|PageImageReader|getEditionPages|publicPdfUrl|Pdf_url/);
});

test("page images get their own bucket and the PDF buckets stay PDF-only", async () => {
  const [migration, archives, config] = await Promise.all([
    read("../supabase/migrations/20261105090000_edition_pages_bucket.sql"),
    read("../supabase/migrations/20261022044134_publication_archives.sql"),
    read("../next.config.ts"),
  ]);

  assert.match(migration, /'edition-pages', 'edition-pages', true/);
  assert.match(migration, /array\['image\/webp', 'application\/json'\]/);
  assert.doesNotMatch(migration, /'(NNN|Entelechy)'/);
  assert.match(archives, /\('NNN', 'NNN', true, 52428800, array\['application\/pdf'\]/);
  assert.match(config, /img-src 'self' data: blob: \$\{supabaseSources\}/);
});

test("the PDF reader never sends readers back to page 1 on its own", async () => {
  const viewer = await read("../src/Components/PDFviewer.tsx");

  assert.doesNotMatch(viewer, /setPageNumber\(1\)/);
  assert.match(viewer, /useTransition/);
  assert.match(viewer, /setPageNumber\(\(current\) =>/);
});

test("the media consent agreement reads as page images, with the PDF as fallback", async () => {
  const [page, manifestText] = await Promise.all([
    read("../src/app/Media-Consent/pages/page.tsx"),
    read("../public/documents/media-consent-agreement-pages/manifest.json"),
  ]);
  const pages = parseEditionPagesManifest(JSON.parse(manifestText), "/documents/media-consent-agreement-pages/");

  assert.match(page, /<PageImageReader /);
  assert.match(page, /<PDFWrapper url=\{documentUrl\} \/>/);
  assert.equal(pages.length, 5);
  for (const entry of pages) {
    for (const source of entry.srcSet.split(", ")) {
      const file = source.split(" ")[0];
      await readFile(new URL(`../public${file}`, import.meta.url));
    }
  }
});

test("editors can make page images for an edition that has none, keeping its link", async () => {
  const { readFile } = await import("node:fs/promises");
  const read = async (path) => (await readFile(new URL(path, import.meta.url), "utf8")).replace(/\r\n/g, "\n");
  const [manager, page] = await Promise.all([
    read("../src/Components/staff/EditionsManager.tsx"),
    read("../src/app/press-club/editions/page.tsx"),
  ]);
  // One shared routine makes and uploads images for new and existing editions.
  assert.match(manager, /async function uploadPageImages\(/);
  assert.match(manager, /await uploadPageImages\(supabase, row\.data\.id, file, setProgress\)/);
  assert.match(manager, /await uploadPageImages\(supabase, edition\.id, pdf, setProgress\)/);
  // The button only appears for editors and only on editions without images.
  assert.match(manager, /canEdit && edition\.hasPages === false && \(/);
  assert.match(page, /\.list\(`Entelechy\/\$\{edition\.id\}`/);
  assert.match(page, /item\.name === "manifest\.json"/);
});
