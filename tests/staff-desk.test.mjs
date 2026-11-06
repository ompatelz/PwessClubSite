import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const migrationPath = "../supabase/migrations/20261106090000_staff_desk_and_private_nnn.sql";

test("the database decides who may do what on the staff desk", async () => {
  const sql = await read(migrationPath);

  // Only active DAU staff have a role, read from the verified sign-in token.
  assert.match(sql, /create or replace function public\.staff_role\(\)/);
  assert.match(sql, /auth\.jwt\(\) ->> 'email'/);
  assert.match(sql, /like '%@dau\.ac\.in'/);
  assert.match(sql, /email ~ '\^\[a-z0-9\._%\+-\]\+@dau\\\.ac\\\.in\$'/);

  // The convenor alone manages the team, and one convenor must always remain.
  for (const action of ["insert", "update", "delete"]) {
    assert.match(sql, new RegExp(`on public\\.staff_members for ${action} to authenticated[\\s\\S]{0,80}staff_role\\(\\) = 'convenor'`));
  }
  assert.match(sql, /needs at least one active convenor/);

  // Writers cannot publish; editors and the convenor can.
  assert.match(sql, /"Writers create unpublished posts"[\s\S]*?status in \('draft', 'review'\)/);
  assert.match(sql, /"Writers edit their own unpublished posts"[\s\S]*?created_by = public\.staff_email\(\)/);
  assert.match(sql, /"Editors edit any post"[\s\S]*?staff_role\(\) in \('convenor', 'editor'\)/);

  // Who wrote or changed a post is stamped by the database, not the browser.
  assert.match(sql, /new\.created_by := old\.created_by/);
  assert.match(sql, /new\.updated_by := coalesce\(nullif\(public\.staff_email\(\), ''\)/);
});

test("NNN is college-only: visitors never see where an issue is stored", async () => {
  const sql = await read(migrationPath);

  assert.match(sql, /revoke select on table public\."NNN" from anon, authenticated;/);
  assert.match(sql, /grant select \(id, "Month", "Year", created_at\) on table public\."NNN" to anon, authenticated;/);
  assert.match(sql, /update storage\.buckets set public = false where id = 'NNN';/);

  for (const path of ["../src/app/NNN/page.tsx", "../src/app/NNN/[id]/page.tsx", "../src/lib/front-page.ts", "../src/lib/publications.ts"]) {
    const source = await read(path);
    assert.doesNotMatch(source, /select\([^)]*Pdf_url/, `${path} must not ask for NNN file paths`);
  }
});

test("editors can read the edition files they replace and clear", async () => {
  // Supabase Storage needs SELECT for upsert uploads and for listing a folder.
  const sql = await read("../supabase/migrations/20261106100000_editors_read_edition_files.sql");
  assert.match(sql, /for select to authenticated[\s\S]*?bucket_id in \('Entelechy', 'NNN', 'edition-pages'\)[\s\S]*?staff_role\(\) in \('convenor', 'editor'\)/);

  // The list refreshes once the edition exists, even if the page images fail.
  const manager = await read("../src/Components/staff/EditionsManager.tsx");
  assert.match(manager, /finally \{[\s\S]*?if \(added\) \{[\s\S]*?router\.refresh\(\)/);
});

test("sign-in runs only on the staff desk and returns only to it", async () => {
  const [proxy, callback, signout] = await Promise.all([
    read("../src/proxy.ts"),
    read("../src/app/auth/callback/route.ts"),
    read("../src/app/auth/signout/route.ts"),
  ]);

  assert.match(proxy, /matcher: \["\/press-club\/:path\*", "\/auth\/:path\*"\]/);
  assert.match(proxy, /auth\.getClaims\(\)/);
  assert.match(callback, /\/\^\\\/press-club/);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(signout, /request\.headers\.get\("origin"\) !== origin/);
});

test("staff pages check the member on every request and stay out of search", async () => {
  const pages = [
    "../src/app/press-club/page.tsx",
    "../src/app/press-club/posts/new/page.tsx",
    "../src/app/press-club/posts/[id]/page.tsx",
    "../src/app/press-club/editions/page.tsx",
    "../src/app/press-club/members/page.tsx",
    "../src/app/press-club/profile/page.tsx",
  ];
  for (const path of pages) {
    const source = await read(path);
    assert.match(source, /export const dynamic = "force-dynamic";/, `${path} must render per request`);
    assert.match(source, /await getStaffSession\(\)/, `${path} must check the member`);
    assert.match(source, /robots: \{ index: false, follow: false \}/, `${path} must not be indexed`);
  }

  const staff = await read("../src/lib/staff.ts");
  assert.match(staff, /auth\.getClaims\(\)/);
  assert.match(staff, /!member \|\| !member\.active/);
});

test("members set their own name and optional pen name on first sign-in", async () => {
  const sql = await read("../supabase/migrations/20261107090000_staff_names_and_pen_names.sql");
  // The convenor only needs an address; the name can wait for the member.
  assert.match(sql, /alter column name drop not null/);
  assert.match(sql, /add column if not exists pen_name text/);
  // Members change only their own names, never their role or access.
  assert.match(sql, /create or replace function public\.set_my_staff_profile[\s\S]*?security definer/);
  assert.match(sql, /set name = clean_name,\s*pen_name = clean_pen,\s*profile_completed_at = now\(\)\s*where email = public\.staff_email\(\)\s*and active;/);
  assert.doesNotMatch(sql.split("set_my_staff_profile")[1], /role\s*=/);
  assert.match(sql, /revoke all on function public\.set_my_staff_profile\(text, text\) from public, anon;/);

  const [shell, staff, form, newPost] = await Promise.all([
    read("../src/Components/staff/StaffShell.tsx"),
    read("../src/lib/staff.ts"),
    read("../src/Components/staff/ProfileForm.tsx"),
    read("../src/app/press-club/posts/new/page.tsx"),
  ]);
  assert.match(staff, /needsProfile: !member\.profile_completed_at \|\| !realName/);
  assert.match(shell, /if \(session\.needsProfile\)[\s\S]*?<ProfileForm/);
  assert.match(form, /rpc\("set_my_staff_profile"/);
  assert.match(form, /Pen name <span>\(optional\)<\/span>/);
  // A pen name, when chosen, is the default byline.
  assert.match(staff, /byline: penName \?\? realName \?\? ""/);
  assert.match(newPost, /memberName=\{session\.byline\}/);
});

test("Google sign-in asks for DAU accounts", async () => {
  const panel = await read("../src/Components/staff/SignInPanel.tsx");
  assert.match(panel, /provider: "google"/);
  assert.match(panel, /hd: "dau\.ac\.in"/);
});
