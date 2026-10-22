import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const baseUrl = new URL(required("E2E_BASE_URL"));
baseUrl.pathname = "/";
baseUrl.search = "";
baseUrl.hash = "";

const isLocal = ["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname);
if (!isLocal && process.env.E2E_ALLOW_PRODUCTION !== "true") {
  throw new Error("Remote content tests require E2E_ALLOW_PRODUCTION=true.");
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY
  ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  ?? process.env.TEA_SUPABASE_SERVICE_ROLE_KEY;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !serviceKey || !publicKey) {
  throw new Error("Supabase URL, service key, and publishable key are required.");
}

const reviewerPassword = required("TEA_REVIEW_PASSWORD");
const serviceDb = createClient(supabaseUrl, serviceKey, clientOptions());
const publicDb = createClient(supabaseUrl, publicKey, clientOptions());
const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const marker = `press-club-e2e-${runId}`;
const teaTitle = `Tea E2E ${runId}`;
const teaBody = `Temporary automated moderation check for ${marker}. This record must be removed after the run.`;
const blogTitle = `Blog E2E ${runId}`;
const blogExcerpt = `Temporary published article used to verify the public Blog workflow for ${marker}.`;
const blogBody = `This is a temporary automated article for ${marker}.\n\nIt verifies that a published row appears on both the Blog index and its article page.`;
const blogSlug = marker;
const draftSlug = `${marker}-draft`;
let teaId;
let blogId;
let draftId;
let unexpectedAnonId;

try {
  log("checking route and access-control guards");
  await expectStatus("/Blog", {}, 200);
  await expectStatus("/Tea", {}, 200);
  await expectStatus("/press-club", {}, 200);
  await expectStatus("/api/tea/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://invalid.example" },
    body: JSON.stringify({ title: teaTitle, body: teaBody, agreed: true }),
  }, 403);
  await expectStatus("/api/tea/login", jsonRequest({ password: `${reviewerPassword}-wrong` }), 401);

  log("checking public Supabase write protection");
  const anonAttempt = await publicDb.from("blog_posts").insert({
    slug: `${marker}-anon-attempt`,
    title: `Blocked ${blogTitle}`,
    excerpt: blogExcerpt,
    body: blogBody,
    author: "Automated test",
    status: "draft",
  }).select("id").maybeSingle();
  unexpectedAnonId = anonAttempt.data?.id;
  assert.ok(anonAttempt.error, "The publishable key unexpectedly wrote to blog_posts.");

  log("creating temporary Blog draft and published article");
  ({ id: draftId } = await insertOne("blog_posts", {
    slug: draftSlug,
    title: `Draft ${blogTitle}`,
    excerpt: blogExcerpt,
    body: blogBody,
    author: "Automated test",
    status: "draft",
  }));
  ({ id: blogId } = await insertOne("blog_posts", {
    slug: blogSlug,
    title: blogTitle,
    excerpt: blogExcerpt,
    body: blogBody,
    author: "Automated test",
    status: "published",
    published_at: new Date().toISOString(),
  }));

  await eventually("published Blog article appears", async () => {
    const index = await pageText("/Blog");
    const article = await pageText(`/Blog/${blogSlug}`);
    return index.includes(blogTitle) && article.includes(blogTitle) && article.includes(marker);
  });
  const draftPage = await fetchUrl(`/Blog/${draftSlug}`);
  assert.equal(draftPage.status, 404, "A draft Blog article was publicly reachable.");
  assert.ok(!(await pageText("/Blog")).includes(`Draft ${blogTitle}`), "A draft appeared on the Blog index.");

  log("submitting a temporary anonymous Tea post");
  await expectStatus("/api/tea/submit", jsonRequest({
    title: teaTitle,
    body: teaBody,
    agreed: true,
  }), 201);
  const tea = await selectOne("tea_posts", "submitted_title", teaTitle, "id,status");
  teaId = tea.id;
  assert.equal(tea.status, "pending");
  assert.ok(!(await pageText("/Tea")).includes(teaTitle), "Pending Tea appeared publicly.");

  log("signing in and publishing through the moderation API");
  const login = await fetchUrl("/api/tea/login", jsonRequest({ password: reviewerPassword }));
  assert.equal(login.status, 200, `Reviewer login returned ${login.status}.`);
  const reviewerCookie = extractCookie(login.headers.get("set-cookie"));
  await expectStatus(`/api/tea/review/${teaId}`, {
    ...jsonRequest({ title: teaTitle, body: teaBody, action: "publish" }),
    method: "PATCH",
  }, 401);
  await expectStatus(`/api/tea/review/${teaId}`, {
    ...jsonRequest({ title: teaTitle, body: teaBody, action: "publish" }),
    method: "PATCH",
    headers: {
      ...jsonRequest({}).headers,
      Cookie: reviewerCookie,
    },
  }, 200);

  await eventually("published Tea post appears", async () => (await pageText("/Tea")).includes(teaTitle));
  const publishedTea = await selectOne("tea_posts", "id", teaId, "status,published_at");
  assert.equal(publishedTea.status, "published");
  assert.ok(publishedTea.published_at);

  log("unpublishing the Tea post through the moderation API");
  await expectStatus(`/api/tea/review/${teaId}`, {
    ...jsonRequest({ title: teaTitle, body: teaBody, action: "unpublish" }),
    method: "PATCH",
    headers: {
      ...jsonRequest({}).headers,
      Cookie: reviewerCookie,
    },
  }, 200);
  await eventually("unpublished Tea post disappears", async () => !(await pageText("/Tea")).includes(teaTitle));
  const logout = await fetchUrl("/api/tea/logout", {
    method: "POST",
    headers: { Origin: baseUrl.origin, Cookie: reviewerCookie },
  });
  assert.equal(logout.status, 200);

  log("all live content checks passed");
} finally {
  log("removing this run's temporary records");
  await removeByIds("tea_posts", [teaId]);
  await removeByIds("blog_posts", [blogId, draftId, unexpectedAnonId]);
  await assertRemoved("tea_posts", "submitted_title", teaTitle);
  await assertRemoved("blog_posts", "slug", [blogSlug, draftSlug, `${marker}-anon-attempt`]);
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function clientOptions() {
  return { auth: { autoRefreshToken: false, persistSession: false } };
}

function jsonRequest(body) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl.origin },
    body: JSON.stringify(body),
  };
}

async function fetchUrl(path, options = {}) {
  return fetch(new URL(path, baseUrl), { redirect: "manual", ...options });
}

async function expectStatus(path, options, expected) {
  const response = await fetchUrl(path, options);
  assert.equal(response.status, expected, `${options.method ?? "GET"} ${path} returned ${response.status}, expected ${expected}.`);
  return response;
}

async function pageText(path) {
  const response = await fetchUrl(path);
  assert.equal(response.status, 200, `GET ${path} returned ${response.status}.`);
  return response.text();
}

function extractCookie(setCookie) {
  const match = setCookie?.match(/(?:^|,\s*)(press_club_review=[^;]+)/);
  assert.ok(match, "Reviewer login did not return the session cookie.");
  return match[1];
}

async function insertOne(table, row) {
  const { data, error } = await serviceDb.from(table).insert(row).select("id").single();
  if (error) throw new Error(`Could not create ${table} test row: ${error.message}`);
  return data;
}

async function selectOne(table, column, value, columns) {
  const { data, error } = await serviceDb.from(table).select(columns).eq(column, value).single();
  if (error) throw new Error(`Could not read ${table} test row: ${error.message}`);
  return data;
}

async function removeByIds(table, ids) {
  const exactIds = ids.filter((id) => id !== undefined && id !== null);
  if (!exactIds.length) return;
  const { error } = await serviceDb.from(table).delete().in("id", exactIds);
  if (error) throw new Error(`Could not clean ${table} test rows: ${error.message}`);
}

async function assertRemoved(table, column, values) {
  const expected = Array.isArray(values) ? values : [values];
  const { data, error } = await serviceDb.from(table).select("id").in(column, expected);
  if (error) throw new Error(`Could not verify ${table} cleanup: ${error.message}`);
  assert.equal(data.length, 0, `${table} cleanup left ${data.length} test row(s).`);
}

async function eventually(label, check) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    if (await check()) return;
    if (attempt < 8) await new Promise((resolve) => setTimeout(resolve, 750));
  }
  assert.fail(`Timed out waiting until ${label}.`);
}

function log(message) {
  console.log(`[content-e2e] ${message}`);
}
