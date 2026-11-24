# Anonymous campus posts

The public feed is off by default. While off, `/Tea` returns 404 and public navigation hides the feature. The private desk at `/press-club/tea` stays available to signed-in editors and the convenor so they can prepare drafts and moderate existing posts. Storage is required for creating or reviewing posts. Do not open public submissions until abuse controls and the Press Club's editorial rules are ready.

The flow is: an anonymous visitor submits plain text; the server stores the original and an editable copy as `pending`; an editor or the convenor signs in to the staff desk (`/press-club/tea`) with their DAU Google account, edits the copy, and publishes, unpublishes, or sets the submission aside. The public page reads only published copies. No author name, email, or account is requested or stored by this feature. No email notification is sent; the dashboard is the review queue.

Before enabling it:

1. Run `supabase/migrations/20261021_tea_posts.sql` in the chosen Supabase project. The table has RLS enabled and no public policies; only the server-side service role can access it.
2. Connect the Supabase database to the Vercel project for Production. The server accepts the integration's `SUPABASE_URL` and `SUPABASE_SECRET_KEY` pair (with `SUPABASE_SERVICE_ROLE_KEY` retained for older integrations); alternatively set `NEXT_PUBLIC_SUPABASE_URL` and `TEA_SUPABASE_SERVICE_ROLE_KEY` as an explicit pair. Incomplete pairs are rejected so credentials from different projects cannot be mixed. **Never** put a secret or service-role key in a `NEXT_PUBLIC_` variable or commit it.
3. Reviewers are the staff desk's editors and convenor (see `docs/staff-desk.md`). Writers don't see the Campus Tea tab and the review API refuses them. Removing or deactivating a member on the Team tab ends their access straight away. There is no shared password; `TEA_REVIEW_PASSWORD` and `TEA_SESSION_SECRET` are no longer used and can be deleted from Vercel.
4. Review the community rules displayed on `/Tea` and the [discussion setup](tea-discussions.md). Posts and replies require a current rules acknowledgement, and editors must confirm their rules review before publishing. Keep the Vercel firewall rules as an additional abuse control; the server also uses the durable database rate limiter and fails closed if it is unavailable.
5. Set `TEA_ENABLED=true` and redeploy. Test a submission, review edit, publish and unpublish on the deployed site, signed in as an editor.

## Put up a post from the review desk

1. Open `/press-club/tea` and sign in with your staff-listed DAU Google account.
   Google sign-in returns you to this desk. Only editors and the convenor publish.
2. In **New Tea post**, enter a title (4–120 characters) and text (20–5000).
3. **Save draft** puts it in Waiting for review without making it public. To publish
   immediately, check the community-rules acknowledgement and choose **Publish Tea**.
   Public publishing requires `TEA_ENABLED=true`.
4. In the queue, edit and publish drafts, update published posts, or unpublish.
   Updates to live text require another rules check. Removing a post works even
   if an unfinished edit in the form is invalid. A stale review asks you to refresh
   instead of overwriting another editor's changes.

The public post stays anonymous. Publishing does not send email notifications.

The public form enforces title/body lengths and the current community rules acknowledgement. Human review enforces the content rules: no submission or reply appears publicly until an editor approves it. Post and reply text is rendered as text, not HTML. Vercel and Supabase may still retain normal request logs, so do not promise submitters absolute anonymity from infrastructure operators.
