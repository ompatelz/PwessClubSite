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
