# Security audit follow-up — 24 November 2026

The supplied report was checked against the source and live database. Its claim
that no high or critical issues exist is not a guarantee from this review.
No exploit probes or real email deliveries were run for this follow-up.

## Confirmed and addressed

- **Editorial email columns:** anonymous table-wide reads exposed internal audit
  addresses. The migration replaces them with explicit public column grants.
  Authenticated full reads remain behind active-staff RLS. Merely obtaining a
  Google/Supabase login does not allow reading these rows. This corrects the
  report's proposed fix, which would still expose metadata to non-staff logins.
- **Email nuisance:** the old limiter included both the edition/recipient pair
  and request IP, rather than being a truly global recipient limit. New limits
  cap all issue requests from an IP at three per hour and protect each recipient
  across IPs and editions at one request per five minutes. Failures stop delivery
  before downloading PDFs or calling Brevo. A shared campus NAT also shares the IP
  quota; monitor legitimate delivery failures before increasing the threshold.
- **Script policy:** CSP now uses a fresh unpredictable server-generated nonce
  for each HTML request. Production script policy forbids inline scripts without
  a nonce and JavaScript eval; WebAssembly remains allowed for the PDF reader.
  Supabase SDK session cookies remain JS-readable as required by the existing
  browser client. The audit found no XSS sink; this change strengthens prevention
  rather than repairing a demonstrated account takeover.
- **Exact external origins:** image and connection policies permit the configured
  Supabase origin, without a wildcard covering other projects. Local development
  additionally allows the dev server's WebSocket connections and debugging eval.
- **Reporting:** CSP reports go to a size/rate-limited endpoint. Only directive,
  disposition and blocked-resource category are logged; URLs, query strings,
  script samples and identity are discarded. `security.txt` names the existing
  Press Club contact. COOP and CORP are `same-origin`.
- **NNN instructions:** page-image documentation is Entelechy-only and explicitly
  forbids placing NNN in the public bucket. Existing storage objects were not
  deleted or made public by this change.
- **Request sizes:** JSON is now read as a bounded stream and cancelled as soon
  as it exceeds its byte cap, including requests without Content-Length.
- **Crawlers:** robots and a basic public-page sitemap are provided. These are
  discoverability controls, not authorization. Staff pages still require sign-in.

## Rendering and verification

Nonce-based CSP requires HTML to render on every request. Root layout waits for
the incoming connection; nonce-bearing HTML is private/no-store. Public database
queries retain their explicit data-cache configuration, but full HTML no longer
uses ISR/CDN caching. Expect more server rendering and potentially greater hosting
usage. Binary files and static assets remain outside the nonce middleware.

GitHub checks build the application and run `tests/csp-production-smoke.mjs`
against the real production-mode Next server. It verifies unique per-request
nonces, matching nonces on framework scripts, isolation headers, no-store HTML,
and the disclosure endpoint. Unit tests cover throttling without sending email,
stream cancellation, policy origins, and log sanitization. The rolled-back SQL
integration test covers anonymous public reads, hidden audit columns, ordinary
authenticated users, and retained active-staff access.

## Remaining limits

This does not prove inbox ownership or implement double opt-in/CAPTCHA. Rate
limits reduce nuisance; they do not eliminate distributed abuse. Trusted proxy
forwarded-IP handling remains a deployment requirement. Inline styles stay
allowed for the PDF reader and current components; inline JavaScript does not.

Supabase's dashboard-side Google domain restrictions, email-provider settings and
auth rate-limit configuration were not verified or changed. The server's staff
list and database policies remain the authorization boundary. Tighten provider
configuration only after checking it against the club's real sign-in needs.
