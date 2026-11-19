# Anonymous campus posts

The feature is off by default. While off, `/Tea` and `/press-club` return 404 and the navigation hides the feature. You can enable the page before connecting storage; the submission form and review queue remain unavailable until storage is connected. Do not open submissions until abuse controls and the Press Club's editorial rules are ready.

The flow is: an anonymous visitor submits plain text; the server stores the original and an editable copy as `pending`; an editor or the convenor signs in to the staff desk (`/press-club/tea`) with their DAU Google account, edits the copy, and publishes, unpublishes, or sets the submission aside. The public page reads only published copies. No author name, email, or account is requested or stored by this feature. No email notification is sent; the dashboard is the review queue.

Before enabling it:

1. Run `supabase/migrations/20261021_tea_posts.sql` in the chosen Supabase project. The table has RLS enabled and no public policies; only the server-side service role can access it.
2. Connect the Supabase database to the Vercel project for Production. The server accepts the integration's `SUPABASE_URL` and `SUPABASE_SECRET_KEY` pair (with `SUPABASE_SERVICE_ROLE_KEY` retained for older integrations); alternatively set `NEXT_PUBLIC_SUPABASE_URL` and `TEA_SUPABASE_SERVICE_ROLE_KEY` as an explicit pair. Incomplete pairs are rejected so credentials from different projects cannot be mixed. **Never** put a secret or service-role key in a `NEXT_PUBLIC_` variable or commit it.
3. Reviewers are the staff desk's editors and convenor (see `docs/staff-desk.md`). Writers don't see the Campus Tea tab and the review API refuses them. Removing or deactivating a member on the Team tab ends their access straight away. There is no shared password; `TEA_REVIEW_PASSWORD` and `TEA_SESSION_SECRET` are no longer used and can be deleted from Vercel.
4. Decide moderation rules and a public-submission abuse control before opening submissions. The deployed Vercel firewall rate-limits `/api/tea/submit` (it also named the old `/api/tea/login`, which no longer exists); verify the rule in each deployment's firewall settings.
5. Set `TEA_ENABLED=true` and redeploy. Test a submission, review edit, publish and unpublish on the deployed site, signed in as an editor.

The public form enforces title/body lengths and editing acknowledgement. It is not a spam or safety policy; the firewall rule is the only rate limit and is outside this repository. Submissions appear nowhere public until a reviewer publishes them. Post text is rendered as text, not HTML. Vercel and Supabase may still retain normal request logs, so do not promise submitters absolute anonymity from infrastructure operators.
