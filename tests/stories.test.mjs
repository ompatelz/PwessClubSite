import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { partitionPostsByAge, previewStoryText } from "../src/lib/stories.ts";

const migrationUrl = new URL("../supabase/migrations/20261022051830_add_blog_posts.sql", import.meta.url);
const pageUrl = new URL("../src/app/Blog/page.tsx", import.meta.url);
const teaPageUrl = new URL("../src/app/Tea/page.tsx", import.meta.url);

test("blog publishing exposes only approved, non-future stories", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  assert.match(migration, /enable row level security/i);
  assert.match(migration, /grant select on table public\.blog_posts to anon, authenticated/i);
  assert.match(migration, /status = 'published' and published_at <= now\(\)/i);
  assert.doesNotMatch(migration, /grant (insert|update|delete|all).*anon/i);
});

test("the public Blog page only selects approved blog fields", async () => {
  const page = await readFile(pageUrl, "utf8");

  assert.match(page, /id,slug,title,excerpt,author,published_at/);
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

test("published posts stay newest for seven days, then move to older", () => {
  const now = new Date("2026-10-22T12:00:00.000Z");
  const posts = [
    { id: "recent", published_at: "2026-10-15T12:00:00.001Z" },
    { id: "boundary", published_at: "2026-10-15T12:00:00.000Z" },
    { id: "old", published_at: "2026-10-15T11:59:59.999Z" },
    { id: "invalid", published_at: "not-a-date" },
    { id: "missing", published_at: null },
  ];

  const grouped = partitionPostsByAge(posts, now);

  assert.deepEqual(grouped.newest.map(({ id }) => id), ["recent"]);
  assert.deepEqual(grouped.older.map(({ id }) => id), ["boundary", "old", "invalid", "missing"]);
});

test("Blog and Tea expose newest and older sections from publication time", async () => {
  const [blogPage, teaPage] = await Promise.all([
    readFile(pageUrl, "utf8"),
    readFile(teaPageUrl, "utf8"),
  ]);

  for (const page of [blogPage, teaPage]) {
    assert.match(page, /partitionPostsByAge/);
    assert.match(page, />Newest</);
    assert.match(page, />Older posts</);
    assert.match(page, /\.lte\("published_at", now\.toISOString\(\)\)/);
  }
});
