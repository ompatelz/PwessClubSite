import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("the front page shows what is out and refreshes without a redeploy", async () => {
  const [page, data] = await Promise.all([read("../src/app/page.tsx"), read("../src/lib/front-page.ts")]);

  assert.match(page, /export const revalidate = \d+;/);
  assert.match(page, /await getFrontPage\(\)/);
  assert.match(page, /href=\{`\/Entelechy\/\$\{entelechy\.id\}`\}/);
  assert.match(page, /href=\{`\/NNN\/\$\{latestNNN\.id\}`\}/);
  assert.match(page, /href=\{`\/Blog\/\$\{post\.slug\}`\}/);
  assert.match(data, /\.eq\("status", "published"\)/);
  assert.match(data, /\.lte\("published_at"/);
  assert.match(data, /timeZone: "Asia\/Kolkata"/);
});

test("Campus Tea only appears when the feature is switched on", async () => {
  for (const path of ["../src/app/page.tsx", "../src/Components/Navbar.tsx", "../src/app/Blog/page.tsx"]) {
    const source = await read(path);
    const teaLinks = source.match(/href="\/Tea"/g) ?? [];
    const guarded = source.match(/(tea|teaEnabled\(\)) &&[^\n]*href="\/Tea"|\{tea && \(/g) ?? [];
    assert.ok(teaLinks.length === 0 || guarded.length > 0, `${path} should guard its Campus Tea links`);
  }
});

test("each format prints in its own ink, in the masthead and on the front page", async () => {
  const [tokens, styles, navbar] = await Promise.all([
    read("../tokens.css"),
    read("../src/app/front-page.css"),
    read("../src/Components/Navbar.tsx"),
  ]);

  for (const format of ["entelechy", "nnn", "blog", "tea"]) {
    assert.match(tokens, new RegExp(`--ink-${format}:`));
    assert.match(styles, new RegExp(`\\.masthead__link--${format}`));
  }
  assert.match(navbar, /masthead__link--entelechy/);
  assert.match(navbar, /masthead__link--nnn/);
  assert.doesNotMatch(navbar, /site-rail/);
});

test("the redesign stylesheet loads after the base styles so it can override them", async () => {
  const layout = await read("../src/app/layout.tsx");

  assert.ok(layout.indexOf('import "./globals.css"') < layout.indexOf('import "./front-page.css"'));
});

test("stylesheets have no unclosed comments that would swallow the rules after them", async () => {
  for (const path of ["../src/app/globals.css", "../src/app/front-page.css", "../tokens.css"]) {
    const css = await read(path);
    let index = 0;
    while ((index = css.indexOf("/*", index)) !== -1) {
      const close = css.indexOf("*/", index + 2);
      const nextOpen = css.indexOf("/*", index + 2);
      const line = css.slice(0, index).split("\n").length;
      assert.ok(close !== -1 && (nextOpen === -1 || close < nextOpen), `${path} has an unclosed comment at line ${line}`);
      index = close + 2;
    }
  }
});

test("retired wording from the copy review does not come back", async () => {
  const { readdir } = await import("node:fs/promises");
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(new URL(dir, import.meta.url), { withFileTypes: true })) {
      const path = `${dir}${entry.name}`;
      if (entry.isDirectory()) { if (entry.name !== "content") await walk(`${path}/`); }
      else if (/\.(tsx?|css)$/.test(entry.name)) files.push(path);
    }
  }
  await walk("../src/");
  const retired = [
    /monthly newspaper/i, /month by month/i, /month-by-month/i, /Kept in print/, /two speeds/,
    /digital reading copy/, /original-PDF fallback/, /Fit width · active/, /hit a snag/,
    /No private error details/, /make the campus record/, /reading copy explains/, /Campus tea\./,
  ];
  for (const path of files) {
    const source = await read(path);
    for (const phrase of retired) assert.doesNotMatch(source, phrase, `${path} still says ${phrase}`);
  }
});

test("How we publish only describes Campus Tea when it is switched on", async () => {
  const page = await read("../src/app/Editorial/page.tsx");
  assert.match(page, /\{tea && \(\s*<section>\s*<h2>Campus Tea<\/h2>/);
  assert.match(page, /\{tea \? "Four" : "Three"\} formats/);
});
