import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const viewerUrl = new URL("../src/Components/PDFviewer.tsx", import.meta.url);
const editionUrl = new URL("../src/app/Entelechy/[id]/page.tsx", import.meta.url);
const mediaConsentUrl = new URL("../src/app/Media-Consent/page.tsx", import.meta.url);

test("Entelechy renders one responsive PDF page at a time", async () => {
  const viewer = await readFile(viewerUrl, "utf8");

  assert.match(viewer, /pageNumber=\{pageNumber\}/);
  assert.doesNotMatch(viewer, /Array\.from\(\{ length: numPages \}/);
  assert.match(viewer, /new ResizeObserver/);
  assert.match(viewer, /Page \$\{pageNumber\} of \$\{numPages\}/);
});

test("the PDF reader has bounded controls and a direct fallback", async () => {
  const viewer = await readFile(viewerUrl, "utf8");
  const edition = await readFile(editionUrl, "utf8");

  assert.match(viewer, /const minZoom = 0\.75/);
  assert.match(viewer, /const maxZoom = 1\.75/);
  assert.match(viewer, /Open original PDF/);
  assert.match(viewer, /role="alert"/);
  assert.match(edition, /<PDFWrapper url=\{documentUrl\}/);
});

test("the media consent agreement has a dedicated reader page", async () => {
  const page = await readFile(mediaConsentUrl, "utf8");

  assert.match(page, /title: "Media Consent & Editorial Independence Agreement"/);
  assert.match(page, /const documentUrl = "\/documents\/media-consent-agreement\.pdf"/);
  assert.match(page, /<PDFWrapper url=\{documentUrl\}/);
});
