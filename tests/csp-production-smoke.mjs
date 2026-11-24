// HTTP validation against the built Next server; never sends email or writes data.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

const base = "http://127.0.0.1:4107";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "4107"], { stdio: ["ignore", "pipe", "pipe"] });
let output = "";
server.stdout.on("data", chunk => { output = (output + chunk).slice(-20000); });
server.stderr.on("data", chunk => { output = (output + chunk).slice(-20000); });
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { await fetch(base); ready = true; break; } catch { await new Promise(resolve => setTimeout(resolve, 250)); }
  }
  assert.ok(ready, `Production server did not start: ${output}`);
  const nonces = new Set();
  for (const path of ["/", "/", "/Editorial", "/press-club/tea", "/Entelechy"]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, `${path}: ${output}`);
    const policy = response.headers.get("content-security-policy") ?? "";
    const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
    assert.ok(nonce, `${path} has no script nonce`);
    assert.ok(!nonces.has(nonce), "Nonce reused across requests"); nonces.add(nonce);
    const scriptPolicy = policy.split(";").find(value => value.trim().startsWith("script-src "));
    assert.ok(scriptPolicy && !scriptPolicy.includes("unsafe-inline") && !scriptPolicy.includes("'unsafe-eval'"));
    assert.match(scriptPolicy, /strict-dynamic/);
    assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
    assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin");
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    const html = await response.text();
    const scripts = [...html.matchAll(/<script\b([^>]*)>/gi)];
    assert.ok(scripts.length > 0, `No framework scripts in ${path}`);
    for (const script of scripts) {
      if (/type="application\/(?:ld\+json|json)"/.test(script[1])) continue;
      assert.equal(script[1].match(/\bnonce="([^"]+)"/)?.[1], nonce, `Missing/mismatched script nonce in ${path}: ${script[0]}`);
    }
  }
  const disclosure = await fetch(base + "/.well-known/security.txt");
  assert.equal(disclosure.status, 200); assert.match(await disclosure.text(), /Contact: mailto:pressclub@dau.ac.in/);
  console.log("Production CSP smoke check passed: unique nonces, matching framework scripts, no-store HTML, isolation headers, disclosure route.");
} catch (error) { console.error(output); throw error; }
finally { server.kill(); await Promise.race([once(server, "exit"), new Promise(resolve => setTimeout(resolve, 1000))]); }
