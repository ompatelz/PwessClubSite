import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { cleanPost, sameOrigin } from "../src/lib/tea.ts";
import { readJsonBody } from "../src/lib/request-security.ts";
import { TEA_RULES_VERSION } from "../src/lib/tea-discussion.ts";

const id = "00000000-0000-4000-8000-000000000001";
const version = "2026-11-24T12:00:00.000Z";
const editor = { state: "staff", role: "editor", email: "editor@dau.ac.in" };
const original = { status: "published", edited_title: "Original title", edited_body: "Original body with enough text.", published_at: version, updated_at: version };
const input = { title: "A new campus post", body: "A thoughtful post about campus life.", action: "draft" };
const req = (body, origin = "https://press.example") => new Request("https://press.example/api/tea/posts", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });

async function loadRoute(path, { staff = editor, enabled = true, existing = original, stale = false, fail = false } = {}) {
  const writes = [];
  const db = { from() {
    let writing = false;
    const q = { select() { return q; }, eq() { return q; },
      insert(row) { writing = true; writes.push(row); return q; },
      update(row) { writing = true; writes.push(row); return q; },
      async single() { return { data: fail ? null : writing ? { id } : existing, error: fail ? { code: "unavailable" } : null }; },
      async maybeSingle() { return { data: stale ? null : { id }, error: null }; },
    }; return q;
  } };
  const deps = {
    "@/lib/staff": { getStaffSession: async () => staff, canPublish: role => role === "editor" || role === "convenor" },
    "@/lib/tea": { getTeaDb: () => db, cleanPost, sameOrigin, teaEnabled: () => enabled, teaJson: (message, status) => Response.json({ message }, { status }) },
    "@/lib/request-security": { readJsonBody },
    "@/lib/tea-discussion": { TEA_RULES_VERSION },
  };
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: name => { assert.ok(deps[name], name); return deps[name]; }, Response, Date, console });
  return { ...exports, writes };
}
const composer = opts => loadRoute("../src/app/api/tea/posts/route.ts", opts);
const review = opts => loadRoute("../src/app/api/tea/review/[id]/route.ts", opts);
const context = { params: Promise.resolve({ id }) };

test("only signed-in editors and convenors can create posts at the desk", async () => {
  for (const [staff, status] of [[{ state: "signed-out" }, 401], [{ state: "staff", role: "writer" }, 403], [{ state: "not-staff" }, 401]]) {
    const h = await composer({ staff }); assert.equal((await h.POST(req(input))).status, status); assert.equal(h.writes.length, 0);
  }
});
test("cross-origin post creation is refused before storage", async () => {
  const h = await composer(); assert.equal((await h.POST(req(input, "https://other.example"))).status, 403); assert.equal(h.writes.length, 0);
});
test("editors can save private drafts even when the public feed is paused", async () => {
  const h = await composer({ enabled: false }); const response = await h.POST(req({ ...input, status: "published" }));
  assert.equal(response.status, 201); assert.equal(h.writes[0].status, "pending"); assert.equal(h.writes[0].published_at, null);
});
test("publishing requires both a live feed and the current explicit rules check", async () => {
  const off = await composer({ enabled: false }); assert.equal((await off.POST(req({ ...input, action: "publish", rulesReviewed: true, rulesVersion: TEA_RULES_VERSION }))).status, 409);
  const h = await composer();
  for (const extra of [{}, { rulesReviewed: "true", rulesVersion: TEA_RULES_VERSION }, { rulesReviewed: true, rulesVersion: "old" }]) {
    assert.equal((await h.POST(req({ ...input, action: "publish", ...extra }))).status, 400);
  }
  assert.equal(h.writes.length, 0);
  const response = await h.POST(req({ ...input, action: "publish", rulesReviewed: true, rulesVersion: TEA_RULES_VERSION }));
  assert.equal(response.status, 201); assert.equal(h.writes[0].status, "published"); assert.ok(h.writes[0].published_at); assert.equal((await response.json()).id, id);
});
test("post lengths count characters without rejecting valid multibyte text", async () => {
  const h = await composer(); assert.equal((await h.POST(req({ ...input, body: "ક".repeat(5000) }))).status, 201);
  assert.equal((await h.POST(req({ ...input, body: "ક".repeat(5001) }))).status, 400);
});
test("storage failures are reported without pretending a draft saved", async () => {
  const h = await composer({ fail: true }); assert.equal((await h.POST(req(input))).status, 503);
});
test("unpublishing ignores invalid unsaved edits and works while the feed is paused", async () => {
  const h = await review({ enabled: false }); assert.equal((await h.PATCH(req({ action: "unpublish", title: "", body: "", updatedAt: version }), context)).status, 200);
  assert.equal(h.writes[0].status, "pending"); assert.equal(h.writes[0].edited_title, original.edited_title); assert.equal(h.writes[0].edited_body, original.edited_body); assert.equal(h.writes[0].published_at, null);
});
test("stale post reviews never overwrite another editor", async () => {
  const h = await review(); assert.equal((await h.PATCH(req({ ...input, action: "save", updatedAt: "old" }), context)).status, 409); assert.equal(h.writes.length, 0);
  const race = await review({ stale: true }); assert.equal((await race.PATCH(req({ ...input, action: "save", rulesReviewed: true, updatedAt: version }), context)).status, 409);
});
test("editing a live post requires a rules check", async () => {
  const h = await review(); assert.equal((await h.PATCH(req({ ...input, action: "save", updatedAt: version }), context)).status, 400); assert.equal(h.writes.length, 0);
});
test("the private desk and tab remain accessible with the public flag off", async () => {
  const page = await readFile(new URL("../src/app/press-club/tea/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /if \(!teaEnabled\(\)\) notFound/);
  assert.match(page, /TeaPostComposer/);
  const shell = await readFile(new URL("../src/Components/staff/StaffShell.tsx", import.meta.url), "utf8");
  assert.match(shell, /if \(canPublish\(session.role\)\) tabs.push/);
});
