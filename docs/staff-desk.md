# Staff desk and college-only NNN

The staff desk lives at `/press-club`. Press Club members sign in with their DAU
Google account; nobody shares a password. The convenor decides who is on the team
and what each person may do. Every permission is enforced by the database, so the
website can never grant more than these rules allow.

| Role | Can |
| --- | --- |
| Convenor | Everything below, plus add, pause, re-role and remove members |
| Editor | Publish, schedule, unpublish and archive any post; add and remove editions |
| Writer | Write posts, save drafts, submit them for review; edit only their own unpublished posts |

The club always keeps at least one active convenor; the database refuses any change
that would leave none.

## NNN is for the DAU community only

NNN issues are never shown on the open web. The NNN storage bucket is private and
visitors cannot read where a file is stored. On `/NNN`, a reader picks an issue and
enters their `@dau.ac.in` address; the server fetches that PDF and emails it as an
attachment through Brevo. Each address can request a given issue once every five
minutes.

Editors add an NNN issue from **Staff desk → Editions** by choosing NNN, the month
and year, and uploading the PDF. It becomes requestable within five minutes.

## One-time setup

Do these first on the test project (`press-club-trial`), check everything in the
trial copy, then repeat on the live project.

### 1. Google sign-in

1. Sign in to <https://console.cloud.google.com/> with the Press Club's DAU Google
   account, and create a project named **Press Club website**.
2. **APIs & Services → OAuth consent screen**: choose **Internal** if it is offered.
   Internal limits sign-in to dau.ac.in accounts at Google's end as well. App name
   *The Press Club*, support email the Press Club address.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   type *Web application*. Under **Authorized redirect URIs** add the Supabase
   callback for each project:
   - test: `https://otxqxsziaufazlmeqwnf.supabase.co/auth/v1/callback`
   - live: `https://wwolaudlyieuawsmuoly.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client secret**.
5. In the Supabase dashboard for the project, open **Authentication → Sign In /
   Providers → Google**, turn it on, and paste the Client ID and secret.
6. **Authentication → URL Configuration**: set the Site URL to the website's address
   and add `<site address>/auth/callback` to **Redirect URLs**. For the local trial
   that is `http://localhost:3100/auth/callback`.

### 2. The first convenor

The first convenor is added once in the Supabase SQL editor (after that, the
convenor manages everyone from the Team page):

```sql
insert into public.staff_members (email, name, role)
values ('your.name@dau.ac.in', 'Your Name', 'convenor');
```

### 3. Database changes

Run `supabase/migrations/20261105090000_edition_pages_bucket.sql` and then
`supabase/migrations/20261106090000_staff_desk_and_private_nnn.sql`. The second
one makes the NNN bucket private: any NNN file already uploaded stops being
publicly downloadable at that moment, which is intended.

### 4. NNN email

Brevo is already set up for NNN (see `nnn-email-setup.md`). On the live site keep
`BREVO_API_KEY`, `BREVO_SENDER_EMAIL` and `NNN_EMAIL_ENABLED=true`, and make sure the
server key (`SUPABASE_SECRET_KEY`, from the Vercel Supabase integration) is set, because
the email route reads private NNN files with it. Never set `TRIAL_MAIL_DIR` on the
live site; it exists only so the local trial can save emails to a folder instead of
sending them.

The August 2026 issue that used to be bundled with the code is no longer used by the
website. Upload it from **Staff desk → Editions** so readers can request it.

## Campus Tea

Campus Tea moderation moved to `/press-club/tea` and still uses its shared reviewer
password. It can move onto staff accounts later.
