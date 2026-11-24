import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { readJsonBody, consumeIdentityRateLimit, consumeRateLimit } from "../src/lib/request-security.ts";
import { configuredSupabaseOrigin, contentSecurityPolicy } from "../src/lib/content-security-policy.ts";
import { summarizeCspReport } from "../src/lib/csp-report.ts";
import vm from "node:vm";
import ts from "typescript";

test("production policy permits only nonced scripts and the configured Supabase origin", () => {
  const policy = contentSecurityPolicy("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef", "https://project.supabase.co/path");
  const script = policy.split(";").find(v => v.trim().startsWith("script-src "));
  assert.match(script, /nonce-ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef/); assert.match(script, /strict-dynamic/);
  assert.doesNotMatch(script, /unsafe-inline|'unsafe-eval'/);
  assert.ok(policy.includes("connect-src 'self' https://project.supabase.co"));
  assert.ok(!policy.includes("*.supabase.co")); assert.match(policy, /report-to csp/);
  assert.throws(() => contentSecurityPolicy("bad'nonce", "https://project.supabase.co"));
  for (const value of ["not a URL", "data:abc", "javascript:alert(1)", "https://user:secret@project.supabase.co"]) assert.equal(configuredSupabaseOrigin(value), "");
});
test("CSP reports never log URLs, query strings, user details or script samples", () => {
  const reports = summarizeCspReport({ "csp-report": { "effective-directive": "script-src-elem", "blocked-uri": "https://example.org/?private=secret", "document-uri": "https://press.example/?email=private", "script-sample": "private token" } });
  assert.deepEqual(reports, [{ directive: "script-src-elem", disposition: "enforce", kind: "external" }]);
  assert.deepEqual(summarizeCspReport([{ type: "csp-violation", body: { effectiveDirective: "script-src", blockedURL: "inline", disposition: "report" } }]), [{ directive: "script-src", disposition: "report", kind: "inline" }]);
  assert.deepEqual(summarizeCspReport({ "csp-report": { "effective-directive": "injected\nlog" } }), []);
});
test("JSON reader cancels an oversized stream before buffering the whole request", async () => {
  let cancelled = false;
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{' + 'x'.repeat(64))); }, cancel() { cancelled = true; } });
  const request = new Request("https://press.example/api/test", { method: "POST", headers: { "content-type": "application/json" }, body: stream, duplex: "half" });
  assert.deepEqual(await readJsonBody(request, 32), { ok: false, reason: "too_large" }); assert.equal(cancelled, true);
});
test("recipient limiter key is independent of request IP; global IP limiter is not", async () => {
  const keys = [];
  const db = { async rpc(name, input) { assert.equal(name, "consume_request_rate_limit"); keys.push(input.rate_key); return { data: true }; } };
  await consumeIdentityRateLimit(db, "nnn-recipient:reader@dau.ac.in", 1, 300);
  await consumeIdentityRateLimit(db, "nnn-recipient:reader@dau.ac.in", 1, 300);
  await consumeRateLimit(db, new Request("https://press.example", { headers: { "x-forwarded-for": "192.0.2.1" } }), "nnn-email", 3, 3600);
  await consumeRateLimit(db, new Request("https://press.example", { headers: { "x-forwarded-for": "192.0.2.2" } }), "nnn-email", 3, 3600);
  assert.equal(keys[0], keys[1]); assert.notEqual(keys[2], keys[3]);
  for (const key of keys) assert.match(key, /^[a-f0-9]{64}$/);
});
test("email throttles reject requests before any PDF download or real email", async () => {
  const source = await readFile(new URL("../src/app/api/nnn/request/route.ts", import.meta.url), "utf8");
  for (const limitedAt of ["ip", "recipient", "unavailable"]) {
    let downloads = 0; let sends = 0;
    const deps = {
      "node:fs/promises": {}, "node:path": {},
      "../../../../lib/tea.ts": { getTeaDb: () => ({ from() { throw new Error("Should not read editions"); }, storage: { from() { downloads++; } } }) },
      "../../../../lib/request-security.ts": { readJsonBody, consumeRateLimit: async () => limitedAt === "unavailable" ? "unavailable" : limitedAt === "ip" ? "limited" : "allowed", consumeIdentityRateLimit: async () => "limited" },
      "../../../../lib/nnn-title.ts": {},
    };
    const exports = {};
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
      { exports, require: name => deps[name], process: { env: { NNN_EMAIL_ENABLED: "true" } }, Response, URL, fetch: () => { sends++; throw new Error("No real mail"); } });
    const response = await exports.POST(new Request("https://press.example/api/nnn/request", { method: "POST", headers: { origin: "https://press.example", "content-type": "application/json" }, body: JSON.stringify({ editionId: 1, email: "reader@dau.ac.in" }) }));
    assert.equal(response.status, limitedAt === "unavailable" ? 503 : 429); assert.equal(downloads, 0); assert.equal(sends, 0);
  }
});
