import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("archive and edition pages refresh, so new editions appear without a redeploy", async () => {
  for (const path of [
    "../src/app/Entelechy/page.tsx",
    "../src/app/NNN/page.tsx",
    "../src/app/Entelechy/[id]/page.tsx",
    "../src/app/NNN/[id]/page.tsx",
  ]) {
    assert.match(await read(path), /export const revalidate = \d+;/, `${path} should revalidate`);
  }
});

test("every shareable route has its own share image", async () => {
  for (const path of [
    "../src/app/opengraph-image.tsx",
    "../src/app/Entelechy/opengraph-image.tsx",
    "../src/app/Entelechy/[id]/opengraph-image.tsx",
    "../src/app/NNN/opengraph-image.tsx",
    "../src/app/NNN/[id]/opengraph-image.tsx",
    "../src/app/Blog/opengraph-image.tsx",
    "../src/app/Blog/[slug]/opengraph-image.tsx",
  ]) {
    await access(new URL(path, import.meta.url));
  }
});

test("share images load fonts that exist and are traced into the server build", async () => {
  const [card, config] = await Promise.all([read("../src/lib/share-card.tsx"), read("../next.config.ts")]);
  const fonts = [...card.matchAll(/assets\/og-fonts\/([\w-]+\.woff)/g)].map((match) => match[1]);

  assert.ok(fonts.length >= 2);
  for (const font of fonts) await access(new URL(`../assets/og-fonts/${font}`, import.meta.url));
  assert.match(config, /outputFileTracingIncludes/);
  assert.match(config, /assets\/og-fonts/);
});

test("reader pages set share metadata and offer share links", async () => {
  for (const path of [
    "../src/app/Entelechy/[id]/page.tsx",
    "../src/app/NNN/[id]/page.tsx",
    "../src/app/Blog/[slug]/page.tsx",
  ]) {
    const page = await read(path);
    assert.match(page, /shareMetadata\(/, `${path} should set share metadata`);
    assert.match(page, /<ShareLinks\s/, `${path} should render share links`);
  }

  const layout = await read("../src/app/layout.tsx");
  assert.match(layout, /metadataBase: new URL\(siteOrigin\)/);
});

test("share links never send the page anywhere but WhatsApp and the clipboard", async () => {
  const links = await read("../src/Components/ShareLinks.tsx");

  assert.match(links, /https:\/\/wa\.me\/\?text=/);
  assert.match(links, /navigator\.clipboard\.writeText/);
  assert.match(links, /rel="noopener noreferrer"/);
});
