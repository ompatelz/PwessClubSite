# Going live: moving the trial to the real website

Everything below has been built and tested in the trial copy
(`PwessClubSite-trial`) against the test Supabase project (`press-club-trial`).
None of it is on the live site yet. Do the steps in this order.

## What is moving

The trial branch `front-page-redesign` carries these changes on top of the live code:

- Riso newspaper redesign with format inks; front page, Entelechy (with the "En" tile),
  NNN, Blog, How we publish, Media consent (readable text version).
- Page-image reader for Entelechy (smooth scrolling, no PDF lag), with PDF fallback.
- Copy review applied across the site.
- Staff desk at `/press-club`: DAU Google sign-in; convenor, editor and writer roles;
  posts, editions (with automatic page images), gallery, team, profiles with pen names.
- NNN is college-only: files are private and DAU readers get the issue by email.
- Contact page, Instagram and LinkedIn links, Staff sign in links.
- Past members gallery.
- Fixes: footer squeeze at tablet width, phone menu staying open, email wrapping.

## Before you start

1. **Back up the live database.** In Supabase (live project `wwolaudlyieuawsmuoly`):
   Database → Backups, or run `supabase db dump` from a laptop with the Supabase CLI.
   Also note the NNN and Entelechy rows (`select * from "NNN"; select * from "Entelechy";`).
2. **The three uncommitted edits in the live folder** (`Footer.tsx`, `Blog/page.tsx`,
   `page.tsx`) only hide Campus Tea links while Tea is off. The trial already does this,
   so they can be discarded when the trial code replaces them.
3. PR #25 is already merged on `main`, so the trial branch is rebased onto `main` first.

## 1. Google sign-in for the live site

In Google Cloud (project **Press Club Website**, signed in as pressclub@dau.ac.in):

- **APIs & Services → Credentials → Press Club staff desk** → Authorized redirect URIs:
  make sure `https://wwolaudlyieuawsmuoly.supabase.co/auth/v1/callback` is listed
  (the test one is already there).

In Supabase, **live** project:

- **Authentication → Sign In / Providers → Google**: turn on; paste the same Client ID
  and secret (copy the Client ID carefully: it contains a zero, not the letter O).
- **Authentication → URL Configuration**:
  - Site URL: the live address (for example `https://<your-site>.vercel.app` or the
    club's domain).
  - Redirect URLs: `<live address>/auth/callback`. To test sign-in on Vercel preview
    links too, also add `https://*.vercel.app/auth/callback`.

## 2. Vercel settings (environment variables)

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | live project URL (already set) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | live publishable key (already set) |
| `SUPABASE_SECRET_KEY` | live secret key; the NNN email reads private files with it |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` | already set for NNN email |
| `NNN_EMAIL_ENABLED` | `true` |
| `NEXT_PUBLIC_SITE_URL` | optional; set if the club moves to its own domain |
| `TRIAL_MAIL_DIR` | **must not exist** on Vercel (trial only) |

## 3. Ship the code, then change the database straight after

New code works with the old database (the new pages just show "not available yet"),
but the old code breaks once NNN becomes private. So deploy first, then migrate.

1. Open a pull request from the trial branch into `main`; check the Vercel preview.
2. Merge. Wait for the production deploy to finish.
3. Immediately run these on the **live** project, in order (SQL editor or migrations):
   1. `20261105090000_edition_pages_bucket.sql`
   2. `20261106090000_staff_desk_and_private_nnn.sql`
   3. `20261106100000_editors_read_edition_files.sql`
   4. `20261107090000_staff_names_and_pen_names.sql`
   5. `20261108090000_past_members_gallery.sql`
4. Add the team:

   ```sql
   insert into public.staff_members (email, name, role)
   values ('202501082@dau.ac.in', 'Praveen', 'convenor');

   insert into public.staff_members (email, role) values
     ('202403007@dau.ac.in', 'editor'),
     ('202401164@dau.ac.in', 'editor'),
     ('202401005@dau.ac.in', 'editor'),
     ('202501062@dau.ac.in', 'editor');
   ```
5. Run Supabase **Advisors → Security** and confirm nothing new beyond the two
   intended functions (`staff_role`, `set_my_staff_profile`).

## 4. Check the live site

- Sign in at `/press-club` with your DAU account; fill in the welcome form.
- Every public page loads: front page, Entelechy, an edition, NNN, Blog, How we publish,
  Media consent, Contact, Past members.
- NNN: request an issue with a DAU address and confirm the email arrives with the PDF;
  confirm the issue's old public file link no longer opens.
- Phone check: open the Menu, choose a page, confirm it closes.

## 5. Content to add after launch

- **NNN issues**: existing live rows keep working for email. Upload any missing issue
  (for example August 2026) from Staff desk → Editions.
- **Entelechy page images**: editions already on the live site open in the PDF reader.
  For the smooth reader, remove and re-add them from the desk, or run
  `npm run edition:pages` for each one.
- **Past members**: add batch photos from Staff desk → Gallery.
- Ask the four editors to sign in and set their names and pen names.

## If something goes wrong

- Code: revert the merge on `main` in GitHub; Vercel redeploys the previous version.
- Database: the migrations only add tables, columns and rules, except that NNN becomes
  private. To reopen NNN temporarily: `update storage.buckets set public = true where id = 'NNN';`
  and `grant select ("Pdf_url") on table public."NNN" to anon;`.
