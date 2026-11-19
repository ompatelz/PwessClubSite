import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Files edited on Windows may use CRLF line endings; compare as LF.
const read = async (path) => (await readFile(new URL(path, import.meta.url), "utf8")).replace(/\r\n/g, "\n");

test("the polish layer loads last and every movement respects reduced motion", async () => {
  const [layout, css] = await Promise.all([read("../src/app/layout.tsx"), read("../src/app/polish.css")]);
  assert.match(layout, /import "\.\/club-pages\.css";\s*import "\.\/polish\.css";/);
  // Animations are only declared inside the no-preference block (keyframes may sit outside).
  const outside = css.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}\n/, "");
  assert.doesNotMatch(outside.replace(/@keyframes[\s\S]*?\n\}\n/g, ""), /animation:/);
  // Entrance animations never hold a transform afterwards (sticky toolbars stay sticky).
  assert.doesNotMatch(css, /polish-(rise|reveal)[^;]*\bboth\b/);
});

test("small details: arrows spaced, NNN in its own colours, drop cap, progress bar", async () => {
  const css = await read("../src/app/polish.css");
  assert.match(css, /\.studio-link,[\s\S]*?gap: 0\.45em;/);
  assert.match(css, /\.nnn-email \{\s*background: var\(--paper-nnn\);/);
  assert.match(css, /\.story-reader__body > p:first-child::first-letter/);
  const [blog, edition] = await Promise.all([read("../src/app/Blog/[slug]/page.tsx"), read("../src/app/Entelechy/[id]/page.tsx")]);
  assert.match(blog, /className="read-progress read-progress--blog" aria-hidden="true"/);
  assert.match(edition, /<div className="read-progress" aria-hidden="true" \/>\s*<header className="reader-header">/);
});

test("phone scrolling stays light in the edition reader", async () => {
  const [css, reader] = await Promise.all([read("../src/app/polish.css"), read("../src/Components/PageImageReader.tsx")]);
  // No paint-heavy work while scrolling: a pre-made grain tile, no endless shimmer.
  assert.match(css, /background-image: url\("\/paper-grain\.png"\);/);
  assert.doesNotMatch(css, /feTurbulence|polish-shimmer/);
  // Off-screen pages are skipped, with their height reserved from their shape.
  assert.match(css, /\.page-reader__page \{\s*content-visibility: auto;[\s\S]*?contain-intrinsic-block-size: auto [^;]*var\(--page-ratio/);
  // An intrinsic width would widen the reader column on tablets.
  assert.doesNotMatch(css, /contain-intrinsic-size:/);
  assert.match(css, /\.page-reader__page\[data-loaded\]::before \{\s*content: none;/);
  // The page counter is worked out on page crossings and once scrolling settles,
  // never on every scroll frame.
  assert.match(reader, /new IntersectionObserver\(update/);
  assert.match(reader, /settle = window\.setTimeout\(update, 120\)/);
  assert.doesNotMatch(reader, /requestAnimationFrame/);
});
