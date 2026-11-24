import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import { acceptsTeaRules, cleanReply, commentTree, isUuid, TEA_RULES_VERSION } from "../src/lib/tea-discussion.ts";
import * as policy from "../src/lib/tea-discussion.ts";

const postId = "00000000-0000-4000-8000-000000000001";
const parentId = "00000000-0000-4000-8000-000000000002";
const activeStaff = { state: "staff", role: "writer", email: "member@dau.ac.in", byline: "Member byline", needsProfile: false };
const request = input => new Request("https://press.example/api/tea/discussion", { method: "POST", headers: { origin: "https://press.example", "content-type": "application/json" }, body: JSON.stringify(input) });

// Execute the real route with controlled identity and database dependencies.
// This exercises request authorization, not a duplicate of the handler logic.
async function handler({ staff = activeStaff, rate = "allowed", parent = null, origin = true, enabled = true } = {}) {
  const calls = [];
  const db = { from(table) {
    const query = { select() { return query; }, eq() { return query; }, lte() { return query; },
      async maybeSingle() { return { data: table === "tea_posts" ? { id: postId } : parent }; },
      async insert(row) { calls.push({ table, row }); return { error: null }; },
    }; return query;
  } };
  const dependencies = {
    "@/lib/staff": { getStaffSession: async () => staff },
    "@/lib/tea": { getTeaDb: () => db, sameOrigin: () => origin, teaEnabled: () => enabled, teaJson: (message, status) => Response.json({ message }, { status }) },
    "@/lib/request-security": { readJsonBody: async req => ({ ok: true, value: await req.json() }), consumeRateLimit: async () => rate },
    "@/lib/tea-discussion": policy,
  };
  const source = await readFile(new URL("../src/app/api/tea/discussion/route.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => { assert.ok(dependencies[name], name); return dependencies[name]; }, Response, Date });
  return { POST: exports.POST, calls };
}

test("rules require an explicit acknowledgement of the current version", () => {
  assert.equal(acceptsTeaRules({ agreed: true, rulesVersion: TEA_RULES_VERSION }), true);
  for (const input of [{}, { agreed: "true", rulesVersion: TEA_RULES_VERSION }, { agreed: true, rulesVersion: "old" }]) assert.equal(acceptsTeaRules(input), false);
});
test("reply validation trims whitespace, preserves plain text, and enforces bounds", () => {
  assert.equal(cleanReply("  Hello campus.  "), "Hello campus.");
  assert.equal(cleanReply("<script>alert('text')</script>"), "<script>alert('text')</script>");
  for (const value of [null, 123, " ", "a", "x".repeat(2001)]) assert.equal(cleanReply(value), null);
  assert.equal(isUuid(postId), true); assert.equal(isUuid("../private"), false);
});
test("hidden ancestors never turn orphaned descendants into top-level replies", () => {
  const row = (id, parent_id, depth) => ({ id, parent_id, depth, body: "Reply", author_name: "Member", published_at: "2026-11-24" });
  const tree = commentTree([row("root", null, 0), row("child", "root", 1), row("orphan", "removed", 1), row("grandchild", "orphan", 2), row("cycle-a", "cycle-b", 1), row("cycle-b", "cycle-a", 2)]);
  assert.equal(tree.length, 1); assert.equal(tree[0].children[0].id, "child");
  assert.equal(tree[0].children.length, 1);
});
test("anonymous and removed members cannot submit replies or votes", async () => {
  for (const staff of [{ state: "signed-out" }, { state: "not-staff", email: "removed@dau.ac.in" }]) {
    for (const action of ["reply", "vote"]) {
      const h = await handler({ staff }); const response = await h.POST(request({ action, postId }));
      assert.equal(response.status, 401); assert.equal(h.calls.length, 0);
    }
  }
});
test("disabled feature, foreign origin, incomplete profiles and limiter fail closed", async () => {
  for (const [options, status] of [[{ enabled: false }, 503], [{ origin: false }, 403], [{ staff: { ...activeStaff, needsProfile: true } }, 403], [{ rate: "limited" }, 429], [{ rate: "unavailable" }, 503]]) {
    const h = await handler(options); assert.equal((await h.POST(request({ action: "reply", postId }))).status, status); assert.equal(h.calls.length, 0);
  }
});
test("approved membership never bypasses rules or the pending publication gate", async () => {
  const h = await handler();
  const base = { action: "reply", postId, body: "A useful campus reply.", agreed: true, rulesVersion: TEA_RULES_VERSION };
  assert.equal((await h.POST(request({ ...base, rulesVersion: "stale" }))).status, 400);
  assert.equal((await h.POST(request({ ...base, author_name: "Impersonated", member_email: "other@dau.ac.in", status: "published" }))).status, 201);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].row.status, "pending");
  assert.equal(h.calls[0].row.author_name, activeStaff.byline);
  assert.equal(h.calls[0].row.member_email, activeStaff.email);
});
test("missing, hidden, and cross-thread parents cannot receive replies", async () => {
  const h = await handler({ parent: null });
  assert.equal((await h.POST(request({ action: "reply", postId, parentId, body: "A useful reply.", agreed: true, rulesVersion: TEA_RULES_VERSION }))).status, 404);
  assert.equal(h.calls.length, 0);
});
test("readers can report without signing in, but cannot supply arbitrary report text", async () => {
  const h = await handler({ staff: { state: "signed-out" } });
  assert.equal((await h.POST(request({ action: "report", postId, reason: "Private information" }))).status, 201);
  assert.equal(h.calls[0].table, "tea_reports");
  assert.equal((await h.POST(request({ action: "report", postId, reason: "unbounded report" }))).status, 400);
  assert.equal(h.calls.length, 1);
});

async function reviewHandler(staff, { stale = false } = {}) {
  const updates = [];
  const db = { from(table) {
    const query = { select() { return query; }, eq() { return query; },
      update(row) { updates.push({ table, row }); return query; },
      async maybeSingle() { return { data: stale ? null : table === "tea_reports" && updates.length === 0 ? { post_id: postId, comment_id: parentId } : { id: parentId }, error: null }; },
      then(resolve) { return Promise.resolve({ error: null }).then(resolve); },
    }; return query;
  } };
  const deps = {
    "@/lib/staff": { getStaffSession: async () => staff, canPublish: role => role === "editor" || role === "convenor" },
    "@/lib/tea": { getTeaDb: () => db, sameOrigin: () => true, teaEnabled: () => true, teaJson: (message, status) => Response.json({ message }, { status }) },
    "@/lib/request-security": { readJsonBody: async req => ({ ok: true, value: await req.json() }) },
    "@/lib/tea-discussion": policy,
  };
  const source = await readFile(new URL("../src/app/api/tea/discussion/review/route.ts", import.meta.url), "utf8");
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports, require: name => { assert.ok(deps[name], name); return deps[name]; }, Response, Date });
  return { PATCH: exports.PATCH, updates };
}
test("writers cannot approve replies, including their own contributions", async () => {
  const h = await reviewHandler(activeStaff);
  assert.equal((await h.PATCH(request({ kind: "comment", id: parentId, status: "published", body: "My own reply", rulesReviewed: true, updatedAt: "now" }))).status, 403);
  assert.equal(h.updates.length, 0);
});
test("editors must confirm the rules check, and stale edits return a conflict", async () => {
  const editor = { ...activeStaff, role: "editor" };
  const h = await reviewHandler(editor);
  const input = { kind: "comment", id: parentId, status: "published", body: "Reviewed reply", updatedAt: "now" };
  assert.equal((await h.PATCH(request(input))).status, 400);
  assert.equal(h.updates.length, 0);
  const stale = await reviewHandler(editor, { stale: true });
  assert.equal((await stale.PATCH(request({ ...input, rulesReviewed: true }))).status, 409);
});
test("handling a report can remove its exact reply without granting writers moderation", async () => {
  const h = await reviewHandler({ ...activeStaff, role: "editor" });
  assert.equal((await h.PATCH(request({ kind: "report", id: parentId, status: "resolved", removeContent: true }))).status, 200);
  assert.equal(h.updates[0].table, "tea_comments");
  assert.equal(h.updates[0].row.status, "pending");
  assert.equal(h.updates[0].row.published_at, null);
  assert.equal(h.updates[1].table, "tea_reports");
  assert.equal(h.updates[1].row.status, "resolved");
});
