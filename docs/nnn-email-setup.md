# NNN email delivery through Brevo

The NNN request form sends the supplied **August 2026, Part 1** issue only to
addresses ending in `@dau.ac.in`. The PDF is bundled server-side at
`issues/nnn/august-2026-part-1.pdf`; it is never supplied by the browser.

Brevo replaces the previous Google Apps Script gateway. Recipients do not sign
in and no Google OAuth flow is involved. The website calls Brevo's transactional
email API directly with a server-only API key and attaches the PDF as base64.

## One-time setup

1. Create a Brevo account at <https://www.brevo.com/>.
2. Under **Settings → Senders, Domains & Dedicated IPs → Senders**, add
   `pressclub@dau.ac.in` as a sender. Brevo sends a six-digit verification code
   to that inbox; enter it once to verify the sender.
3. Under **SMTP & API → API Keys**, generate an API key named
   `Press Club NNN website`.
4. In the Vercel `pwess-club-site` project, add these **Production** variables:
   - `BREVO_API_KEY`: the generated API key, marked sensitive.
   - `BREVO_SENDER_EMAIL`: `pressclub@dau.ac.in`.
5. Redeploy, submit one DAU test address, and confirm the PDF arrives.
6. Only after the delivery test succeeds, set `NNN_EMAIL_ENABLED=true` in
   Production and redeploy.

If the DAU domain is not authenticated with Brevo DNS records, Brevo may rewrite
the visible From domain to a Brevo-managed domain for deliverability. Replies
still use the verified DAU sender. DNS authentication can be added later with
the university administrator; it is not required for the website integration.

The endpoint also enforces same-origin requests, actual request-size limits,
`@dau.ac.in` recipient validation, and a durable per-address/IP rate limit in
Supabase. Keep the API key server-only and never prefix it with `NEXT_PUBLIC_`.

Brevo API reference: <https://developers.brevo.com/reference/send-transac-email>

## Changing the issue

For a new issue, add the PDF under `issues/nnn/`, then update the path, subject,
attachment name, body copy, and tag in `src/app/api/nnn/request/route.ts`. Update
the request-form copy if the edition name changes, then redeploy the website.
