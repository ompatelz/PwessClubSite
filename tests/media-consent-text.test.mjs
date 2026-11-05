import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import {
  AGREEMENT_INTRO,
  AGREEMENT_PUBLISHER,
  AGREEMENT_SECTIONS,
  AGREEMENT_TITLE,
} from "../src/content/media-consent-agreement.ts";

const require = createRequire(import.meta.url);
const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
const pdfjsRoot = dirname(require.resolve("pdfjs-dist/package.json"));

// Whitespace and bullet glyphs differ between a PDF's line layout and HTML, so
// both sides are compared with them removed. Every other character must match.
const squash = (text) => text.replace(/\*\*/g, "").replace(/[\s​•]/g, "");

async function pdfText() {
  const data = new Uint8Array(await readFile(new URL("../public/documents/media-consent-agreement.pdf", import.meta.url)));
  const task = getDocument({ data, isEvalSupported: false, standardFontDataUrl: `${join(pdfjsRoot, "standard_fonts")}/` });
  const pdf = await task.promise;
  let text = "";
  for (let number = 1; number <= pdf.numPages; number += 1) {
    const content = await (await pdf.getPage(number)).getTextContent();
    text += content.items.map((item) => item.str ?? "").join("");
  }
  await task.destroy();
  return text;
}

function webText() {
  const parts = [AGREEMENT_TITLE, AGREEMENT_PUBLISHER, AGREEMENT_INTRO];
  for (const section of AGREEMENT_SECTIONS) {
    parts.push(`${section.number}. ${section.title}`);
    for (const block of section.blocks) {
      if (block.type === "ul") parts.push(...block.items);
      else parts.push(block.text);
    }
  }
  return parts.join("");
}

test("the web text of the media consent agreement matches the PDF word for word", async () => {
  const fromPdf = squash(await pdfText());
  const fromWeb = squash(webText());

  if (fromPdf !== fromWeb) {
    let at = 0;
    while (at < fromPdf.length && fromPdf[at] === fromWeb[at]) at += 1;
    assert.fail(`Texts differ at character ${at}:\n  PDF: …${fromPdf.slice(Math.max(0, at - 40), at + 60)}\n  web: …${fromWeb.slice(Math.max(0, at - 40), at + 60)}`);
  }
});

test("every section and sub-section has a unique anchor for linking", () => {
  const ids = AGREEMENT_SECTIONS.flatMap((section) => [
    section.id,
    ...section.blocks.filter((block) => block.type === "h3").map((block) => block.id),
  ]);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
});
