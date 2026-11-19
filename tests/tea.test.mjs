import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { cleanPost, getTeaCredentials, getTeaDb, sameOrigin } from "../src/lib/tea.ts";

test("review desk accepts server-only Supabase integration credentials", () => {
  const names = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "TEA_SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    assert.equal(getTeaDb(), null);
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "server-only-test-key";
    assert.ok(getTeaDb());

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://legacy.supabase.co";
    assert.deepEqual(getTeaCredentials(), {
      url: "https://example.supabase.co",
      key: "server-only-test-key",
    });

    delete process.env.SUPABASE_URL;
    assert.equal(getTeaCredentials(), null, "never mix a legacy URL with an integration key");

    process.env.TEA_SUPABASE_SERVICE_ROLE_KEY = "legacy-service-role-key";
    assert.deepEqual(getTeaCredentials(), {
      url: "https://legacy.supabase.co",
      key: "legacy-service-role-key",
    });
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});

const read = async (path) => (await readFile(new URL(path, import.meta.url), "utf8")).replace(/\r\n/g, "\n");

test("Campus Tea is reviewed by signed-in editors and the convenor, not a shared password", async () => {
  const [route, page, shell] = await Promise.all([
    read("../src/app/api/tea/review/[id]/route.ts"),
    read("../src/app/press-club/tea/page.tsx"),
    read("../src/Components/staff/StaffShell.tsx"),
  ]);
  // Every review change checks the staff list and the member's role first.
  assert.match(route, /const staff = await getStaffSession\(\);\s*if \(staff\.state !== "staff"\) return teaJson\([^)]*, 401\);\s*if \(!canPublish\(staff\.role\)\) return teaJson\([^)]*, 403\);/);
  assert.ok(route.indexOf("getStaffSession()") < route.indexOf("getTeaDb()"), "role check runs before the database is touched");
  // The queue is only read for editors and the convenor, inside the staff desk.
  assert.match(page, /const allowed = canPublish\(session\.role\);\s*[\s\S]*?const db = allowed \? getTeaDb\(\) : null;/);
  assert.match(page, /<StaffShell session=\{session\} section="tea">/);
  assert.match(shell, /if \(teaEnabled\(\) && canPublish\(session\.role\)\) tabs\.push\(/);
  // The password login is gone.
  for (const gone of ["../src/lib/tea-auth.ts", "../src/app/api/tea/login/route.ts", "../src/app/api/tea/logout/route.ts", "../src/Components/TeaReviewerLogin.tsx"]) {
    assert.equal(existsSync(new URL(gone, import.meta.url)), false, `${gone} should be removed`);
  }
  assert.doesNotMatch(route + page, /TEA_REVIEW_PASSWORD|reviewerCookie|tea-auth/);
});

test("submission normalization keeps post text and drops unsolicited identity fields", () => {
  const post = cleanPost({
    title: "  Campus story  ",
    body: "  This is a long enough anonymous campus post.  ",
    email: "someone@example.com",
    author: "Someone",
  });
  assert.deepEqual(post, {
    title: "Campus story",
    body: "This is a long enough anonymous campus post.",
  });
  assert.equal(cleanPost({ title: "Hi", body: "A short post" }), null);
});

test("write requests require the site's own origin", () => {
  assert.equal(sameOrigin(new Request("https://example.com/api/tea/submit", {
    headers: { origin: "https://example.com" },
  })), true);
  assert.equal(sameOrigin(new Request("https://example.com/api/tea/submit", {
    headers: { origin: "https://other.example" },
  })), false);
});
