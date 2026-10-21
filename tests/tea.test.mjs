import assert from "node:assert/strict";
import test from "node:test";
import { createReviewerSession, passwordMatches, validReviewerSession } from "../src/lib/tea-auth.ts";
import { cleanPost, getTeaDb, sameOrigin } from "../src/lib/tea.ts";

test("review desk accepts server-only Supabase integration credentials", () => {
  const names = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "TEA_SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    assert.equal(getTeaDb(), null);
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-test-key";
    assert.ok(getTeaDb());
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});

test("reviewer sessions are signed and stop working after a password change", () => {
  const previousPassword = process.env.TEA_REVIEW_PASSWORD;
  const previousSecret = process.env.TEA_SESSION_SECRET;
  try {
    process.env.TEA_REVIEW_PASSWORD = "a-long-press-club-test-password";
    process.env.TEA_SESSION_SECRET = "test-secret-that-is-long-and-different";
    const token = createReviewerSession();
    assert.ok(token);
    assert.equal(passwordMatches("a-long-press-club-test-password"), true);
    assert.equal(passwordMatches("wrong-password"), false);
    assert.equal(validReviewerSession(token), true);
    assert.equal(validReviewerSession(`${token}x`), false);
    process.env.TEA_REVIEW_PASSWORD = "rotated-password";
    assert.equal(validReviewerSession(token), false);
  } finally {
    if (previousPassword === undefined) delete process.env.TEA_REVIEW_PASSWORD;
    else process.env.TEA_REVIEW_PASSWORD = previousPassword;
    if (previousSecret === undefined) delete process.env.TEA_SESSION_SECRET;
    else process.env.TEA_SESSION_SECRET = previousSecret;
  }
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
