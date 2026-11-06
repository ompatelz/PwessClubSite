import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("staff can find the sign-in from any page", async () => {
  const [footer, navbar, contact] = await Promise.all([
    read("../src/Components/Footer.tsx"),
    read("../src/Components/Navbar.tsx"),
    read("../src/app/Contact/page.tsx"),
  ]);
  for (const source of [footer, navbar, contact]) {
    assert.match(source, /href="\/press-club"[^>]*>\s*Staff sign in/);
  }
});

test("contact details live in one place and empty social links stay hidden", async () => {
  const links = await read("../src/lib/club-links.ts");
  assert.match(links, /CLUB_EMAIL = "pressclub@dau\.ac\.in"/);
  for (const label of ["Instagram", "LinkedIn"]) assert.match(links, new RegExp(`label: "${label}"`));
  assert.match(links, /new URL\(link\.href\)\.protocol === "https:"/);

  const footer = await read("../src/Components/Footer.tsx");
  assert.match(footer, /social\.length > 0 &&/);
  assert.match(footer, /rel="noopener noreferrer"/);
  assert.match(footer, /href="\/Contact"/);
  assert.match(footer, /href="\/Past-members"/);
});

test("the gallery is public to view and only editors change it", async () => {
  const sql = await read("../supabase/migrations/20261108090000_past_members_gallery.sql");
  assert.match(sql, /grant select on table public\.gallery_photos to anon, authenticated;/);
  for (const action of ["insert", "update", "delete"]) {
    assert.match(sql, new RegExp(`on public\\.gallery_photos for ${action} to authenticated[\\s\\S]{0,120}staff_role\\(\\) in \\('convenor', 'editor'\\)`));
  }
  assert.match(sql, /new\.created_by := nullif\(public\.staff_email\(\), ''\)/);
  assert.match(sql, /values \('gallery', 'gallery', true, 3145728, array\['image\/webp'\]\)/);
  assert.match(sql, /bucket_id = 'gallery' and public\.staff_role\(\) in \('convenor', 'editor'\)/);
});

test("gallery photos are resized before upload and batches sort newest first", async () => {
  const manager = await read("../src/Components/staff/GalleryManager.tsx");
  assert.match(manager, /const FULL_WIDTH = 1600;/);
  assert.match(manager, /const THUMB_WIDTH = 640;/);
  assert.match(manager, /"image\/webp"/);
  assert.match(manager, /canEdit/);

  const gallery = await read("../src/lib/gallery.ts");
  assert.match(gallery, /b\.localeCompare\(a, "en", \{ numeric: true \}\)/);

  const desk = await read("../src/app/press-club/gallery/page.tsx");
  assert.match(desk, /export const dynamic = "force-dynamic";/);
  assert.match(desk, /await getStaffSession\(\)/);
  assert.match(desk, /robots: \{ index: false, follow: false \}/);
});

test("the full masthead row only appears where it fits", async () => {
  const css = await read("../src/app/club-pages.css");
  assert.match(css, /@media \(min-width: 72rem\) \{\s*\.masthead__nav \{\s*display: flex;/);
  assert.match(css, /\.site-footer__meta nav \{\s*flex-wrap: wrap;/);
});

test("the photo viewer is centred and the email never breaks mid-word", async () => {
  const css = await read("../src/app/club-pages.css");
  assert.match(css, /\.gallery-viewer \{[\s\S]*?margin: auto;/);
  const contact = await read("../src/app/Contact/page.tsx");
  assert.match(contact, /\{CLUB_EMAIL_PARTS\[0\]\}@<wbr \/>\{CLUB_EMAIL_PARTS\[1\]\}/);
  assert.doesNotMatch(css, /\.contact-email__address \{[^}]*overflow-wrap: anywhere/);
});

test("the desk header keeps your account together, with real buttons", async () => {
  const shell = await read("../src/Components/staff/StaffShell.tsx");
  assert.match(shell, /className="staff-bar__account"[\s\S]*?Edit profile[\s\S]*?<SignOutButton \/>/);
  assert.match(shell, /<div className="staff-bar__top">[\s\S]*?<\/div>\s*<nav className="staff-tabs"/);
  const links = await read("../src/lib/club-links.ts");
  assert.match(links, /https:\/\/www\.instagram\.com\/pressclubdau\//);
  assert.match(links, /https:\/\/www\.linkedin\.com\/company\/press-club-dau\//);
  assert.doesNotMatch(links, /dlrf=|WhatsApp/);
});
