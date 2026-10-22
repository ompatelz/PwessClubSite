import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { previewStoryText } from "../src/lib/stories.ts";

const migrationUrl = new URL("../supabase/migrations/20261022051830_add_blog_posts.sql", import.meta.url);
const pageUrl = new URL("../src/app/Stories/page.tsx", import.meta.url);

test("blog publishing exposes only approved, non-future stories", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  assert.match(migration, /enable row level security/i);
  assert.match(migration, /grant select on table public\.blog_posts to anon, authenticated/i);
  assert.match(migration, /status = 'published' and published_at <= now\(\)/i);
  assert.doesNotMatch(migration, /grant (insert|update|delete|all).*anon/i);
});

test("the public Stories feed never selects original Tea submissions", async () => {
  const page = await readFile(pageUrl, "utf8");

  assert.match(page, /edited_title,edited_body,published_at/);
  assert.doesNotMatch(page, /submitted_title|submitted_body/);
  assert.match(page, /\.eq\("status", "published"\)/);
});

test("Tea previews shorten long posts without cutting most of a word", () => {
  const original = `${"Campus writing should remain readable and intentional. ".repeat(12)}Ending.`;
  const preview = previewStoryText(original, 120);

  assert.ok(preview.length <= 121);
  assert.ok(preview.endsWith("…"));
  assert.ok(preview.length >= 84);
  assert.equal(previewStoryText("A short post", 120), "A short post");
});
