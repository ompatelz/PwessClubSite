#!/usr/bin/env node
// Turns an edition PDF into page images and a manifest for the page-image reader.
//
//   npm run edition:pages -- <edition.pdf> <output-folder> [--widths=800,1400]
//
// Text-heavy documents read better with sharper pages, e.g. --widths=1000,2000.
// Writes, for every page, a phone-sized and a screen-sized WebP plus manifest.json.
// Upload the whole output folder to the `edition-pages` storage bucket as
// `Entelechy/<row id>/` or `NNN/<row id>/` (see docs/edition-pages.md).

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const PAGE_WIDTHS = [800, 1400];
const WEBP_QUALITY = 82;

// pdf.js needs its bundled font and character-map data to draw PDFs that rely on
// standard fonts (Helvetica, Times) or non-Latin encodings. Paths must end in "/".
const pdfjsRoot = dirname(createRequire(import.meta.url).resolve("pdfjs-dist/package.json"));
const STANDARD_FONTS = `${join(pdfjsRoot, "standard_fonts")}/`;
const CMAPS = `${join(pdfjsRoot, "cmaps")}/`;

export async function renderEditionPages(pdfPath, outDir, { log = console.log, widths = PAGE_WIDTHS } = {}) {
  const data = new Uint8Array(await readFile(pdfPath));
  const task = getDocument({
    data,
    standardFontDataUrl: STANDARD_FONTS,
    cMapUrl: CMAPS,
    cMapPacked: true,
  });
  const pdf = await task.promise;

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const pages = [];
  for (let number = 1; number <= pdf.numPages; number += 1) {
    const page = await pdf.getPage(number);
    const base = page.getViewport({ scale: 1 });
    const files = {};
    let size = null;

    for (const width of widths) {
      const viewport = page.getViewport({ scale: width / base.width });
      const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;

      const name = `page-${String(number).padStart(3, "0")}-${width}.webp`;
      await writeFile(join(outDir, name), await canvas.encode("webp", WEBP_QUALITY));
      files[width] = name;
      size = { width: canvas.width, height: canvas.height };
    }

    pages.push({ ...size, files });
    page.cleanup();
    log(`page ${number}/${pdf.numPages}`);
  }

  const manifest = { version: 1, pageCount: pdf.numPages, widths, pages };
  await writeFile(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await task.destroy();
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const [pdfArg, outArg] = args.filter((arg) => !arg.startsWith("--"));
  const widthsArg = args.find((arg) => arg.startsWith("--widths="));
  const widths = widthsArg
    ? widthsArg.slice("--widths=".length).split(",").map(Number).filter((n) => Number.isInteger(n) && n >= 200 && n <= 4000)
    : PAGE_WIDTHS;
  if (!pdfArg || !outArg || widths.length === 0) {
    console.error("Usage: npm run edition:pages -- <edition.pdf> <output-folder> [--widths=800,1400]");
    process.exit(1);
  }
  const manifest = await renderEditionPages(resolve(pdfArg), resolve(outArg), { widths });
  console.log(`Wrote ${manifest.pageCount} pages and manifest.json to ${resolve(outArg)}`);
}
