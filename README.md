# The Press Club at DAU

Next.js site for the News and Nonsense newspaper and Entelechy magazine.

## Run locally

```bash
npm ci
npm run dev
```

For a production check, run `npm run lint`, `npx tsc --noEmit`, and `npm run build`. The build downloads the site's Google Fonts, so it requires network access to Google Fonts.

## Deployment configuration

The home page needs no environment variables. The NNN and Entelechy archive pages read their public edition lists from Supabase when these variables are set:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL of the Supabase project containing the publication tables |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key for reading the public archive |

The expected tables and public PDF-only storage buckets are `NNN` and `Entelechy`. Their schema and read-only RLS policies are defined in `supabase/migrations/20261022044134_publication_archives.sql`. Archive rows and matching storage objects must exist for the reader pages to work. If Supabase is not configured, the site stays available and shows a setup message on the archive pages.

The August NNN email form is **off by default** while delivery is being set up. After the [Gmail gateway setup](docs/nnn-email-setup.md) is complete and a test email arrives, set `NNN_EMAIL_ENABLED=true` in Vercel Production and redeploy to show the form. Keep the gateway URL and secret server-side; never prefix them with `NEXT_PUBLIC_`.

Anonymous campus posts and the Press Club review desk are also **off by default**. See [the campus posts setup](docs/tea-setup.md) for the database migration, shared reviewer password, and feature flag. This feature has no public login or email notifications.
