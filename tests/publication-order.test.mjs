import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = [
  "../src/app/page.tsx",
  "../src/Components/Navbar.tsx",
  "../src/Components/Footer.tsx",
];

test("Entelechy precedes NNN across primary publication navigation", async () => {
  for (const path of files) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    const entelechy = source.indexOf('href="/Entelechy"');
    const nnn = source.indexOf('href="/NNN"');

    assert.notEqual(entelechy, -1, `${path} should link to Entelechy`);
    assert.notEqual(nnn, -1, `${path} should link to NNN`);
    assert.ok(entelechy < nnn, `${path} should present Entelechy before NNN`);
  }
});

test("navigation exposes current-page state and publication grouping", async () => {
  const [navbar, activeLink] = await Promise.all([
    readFile(new URL("../src/Components/Navbar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/Components/ActiveNavLink.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(navbar, /aria-label="Publications"/);
  assert.match(navbar, /aria-label="Between editions"/);
  assert.match(activeLink, /aria-current/);
  assert.match(activeLink, /usePathname/);
});
