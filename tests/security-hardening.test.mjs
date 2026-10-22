import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { readJsonBody } from "../src/lib/request-security.ts";

test("JSON request limits measure real bytes even without content-length", async () => {
  const oversized = new Request("https://press.example/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(64) }),
  });
  const wrongType = new Request("https://press.example/api/test", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "{}",
  });

  assert.deepEqual(await readJsonBody(oversized, 32), { ok: false, reason: "too_large" });
  assert.deepEqual(await readJsonBody(wrongType, 32), { ok: false, reason: "wrong_type" });
});

test("deployment config supplies browser security headers", async () => {
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");

  for (const header of [
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]) assert.match(config, new RegExp(header));
  assert.match(config, /frame-ancestors 'none'/);
  assert.match(config, /worker-src 'self' blob:/);
});

test("durable limiter and published-only Tea policy are migration-backed", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20261022160000_security_hardening.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /create table if not exists public\.request_rate_limits/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /revoke all on function .* from public, anon, authenticated/i);
  assert.match(migration, /status = 'published' and published_at <= now\(\)/i);
});

test("public archive queries select explicit fields", async () => {
  const paths = [
    "../src/app/NNN/page.tsx",
    "../src/app/NNN/[id]/page.tsx",
    "../src/app/Entelechy/page.tsx",
    "../src/app/Entelechy/[id]/page.tsx",
  ];
  const sources = await Promise.all(paths.map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  for (const source of sources) assert.doesNotMatch(source, /\.select\("\*"\)/);
});
