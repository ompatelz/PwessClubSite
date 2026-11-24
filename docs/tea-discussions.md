# Campus Tea discussions

Campus Tea keeps its editorial gate. Anonymous posts and signed member replies
must be approved before appearing publicly. These controls support human review;
they do not automatically determine whether every statement complies with policy.

## Reading and participating

- `/Tea` links each published post to `/Tea/<id>` and shows real approved-reply
  and upvote counts when the discussion database is available.
- Anyone can read or report published content. Reports use a fixed reason list,
  are private, and do not collect a name or email.
- Active Press Club members with a completed staff profile can reply and upvote
  using the existing DAU Google sign-in. All three staff roles can participate.
  Membership is checked on every write. This does not enroll every DAU student.
- Replies use the profile byline, never a client-supplied author or email. Their
  original text stays private. Posts remain anonymous to public readers.
- Upvotes are idempotent, reversible, and unique per member and post. They never
  publish or approve content.
- Threads support four nested reply levels. Pages select 20 complete root
  conversations at a time. Replies beneath a hidden parent stay hidden.

## Rules and moderation

Rules appear beside the feed and each thread. Posting and replying require an
explicit acknowledgement of the current version (`2026-11-24`), checked by the
server. Editors must check privacy, consent, allegations, harassment and spam
before publishing or updating a live contribution. Editing the text resets the
checkbox in the review UI.

Editors and the convenor use `/press-club/tea` for posts, replies and reports.
Writers can participate but cannot approve, unpublish or access the review queue.
Replies retain their original submission; edited public text and reviewer are
stored separately. Stale reply edits return a conflict rather than overwriting
another editor. The queue shows the latest 100 replies per status and 100 oldest
open reports. A report can unpublish its exact target and be resolved, even if
that target is outside the latest-replies list. Resolving alone leaves content
unchanged. Unpublishing a post hides the entire discussion; unpublishing a reply
hides its descendants. Restore parents before republishing descendants.

Private account emails support unique votes and accountability. They are never
selected into public projections. Infrastructure logs can still exist; do not
promise absolute anonymity. Agree a retention process with the convenor before
launching; this change does not delete existing content or accounts.

## Deploying

1. Apply `supabase/migrations/20261124100000_tea_discussions.sql` after the existing
   Tea and staff migrations. It adds tables, indexes, a parent-chain trigger and
   service-role-only read projections. No browser role can directly read or write
   the discussion tables or call the projections.
2. Keep the current Supabase project and server-only service credentials. No new
   secrets are needed. Do not expose service keys to the browser.
3. Deploy the code. Preserve `TEA_ENABLED` as configured. The feature remains off
   when the existing flag is off; this change does not open submissions by itself.
4. As writer, editor, and signed-out reader, check reply submission, review,
   publication, reporting, removal and upvote reversal. Check mobile nesting and
   keyboard controls. Do not publish fixture content to production for testing.

Every write checks same-origin requests, bounded JSON and input lengths. Replies,
reports and votes use the existing durable database rate limiter and fail closed
if it is unavailable. Keep Vercel's trusted forwarded-IP headers/firewall rules;
deployments behind a different proxy must validate that header trust boundary.
Human review is still essential for privacy and allegation checks.

## Validation

`npm test` includes executable request-handler tests with mocked verified identity
and database dependencies. `tests/tea-discussion.integration.sql` exercises the
actual migration in one rolled-back transaction, including RLS grants, pending
privacy, cross-thread parents, hidden descendants and vote uniqueness. Run it in
the trial database. No fixtures are committed or publicly published. GitHub's
Site checks run a clean dependency install, all unit tests, TypeScript and build.
