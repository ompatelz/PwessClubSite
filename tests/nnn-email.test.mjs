import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { POST } from "../src/app/api/nnn/request/route.ts";

const endpoint = "https://press.example/api/nnn/request";

function request(body, headers = {}) {
  return new Request(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://press.example",
      ...headers,
    },
    body,
  });
}

async function withEmailFlag(value, run) {
  const previous = process.env.NNN_EMAIL_ENABLED;
  try {
    if (value === undefined) delete process.env.NNN_EMAIL_ENABLED;
    else process.env.NNN_EMAIL_ENABLED = value;
    await run();
  } finally {
    if (previous === undefined) delete process.env.NNN_EMAIL_ENABLED;
    else process.env.NNN_EMAIL_ENABLED = previous;
  }
}

test("email API stays closed until the production feature flag is enabled", async () => {
  await withEmailFlag(undefined, async () => {
    const response = await POST(request(JSON.stringify({ email: "reader@dau.ac.in" })));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "email_disabled");
  });
});

test("email API requires the site's own origin", async () => {
  await withEmailFlag("true", async () => {
    const response = await POST(request(JSON.stringify({ email: "reader@dau.ac.in" }), { origin: "https://example.org" }));
    assert.equal(response.status, 403);
  });
});

test("email API rejects oversized bodies without relying on content-length", async () => {
  await withEmailFlag("true", async () => {
    const response = await POST(request(JSON.stringify({ email: `${"a".repeat(1100)}@dau.ac.in` })));
    assert.equal(response.status, 413);
  });
});

test("email API validates malformed JSON", async () => {
  await withEmailFlag("true", async () => {
    const response = await POST(request("{"));
    assert.equal(response.status, 400);
  });
});

test("email API needs a DAU address and an issue number", async () => {
  await withEmailFlag("true", async () => {
    const outsider = await POST(request(JSON.stringify({ email: "reader@gmail.com", editionId: 1 })));
    assert.equal(outsider.status, 400);
    const noIssue = await POST(request(JSON.stringify({ email: "reader@dau.ac.in" })));
    assert.equal(noIssue.status, 400);
    assert.match((await noIssue.json()).message, /Choose an NNN issue/);
  });
});

test("email API sends the chosen issue from private storage with Brevo", async () => {
  const source = await readFile(new URL("../src/app/api/nnn/request/route.ts", import.meta.url), "utf8");

  assert.match(source, /https:\/\/api\.brevo\.com\/v3\/smtp\/email/);
  assert.match(source, /process\.env\.BREVO_API_KEY/);
  assert.match(source, /attachment:/);
  assert.match(source, /\.storage\.from\("NNN"\)\.download\(/);
  assert.match(source, /@dau\\.ac\\.in/);
  assert.doesNotMatch(source, /script\.google\.com|NNN_GMAIL_SCRIPT|readFile\(/);
  // The trial-only outbox is opt-in and only used when no Brevo key is set.
  assert.match(source, /else if \(trialMailDir\)/);
});
