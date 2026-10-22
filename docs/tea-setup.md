# Anonymous campus posts

The feature is off by default. While off, `/Tea` and `/press-club` return 404 and the navigation hides the feature. You can enable the page and reviewer login before connecting storage; the submission form and review queue remain unavailable until storage is connected. Do not open submissions until abuse controls and the Press Club's editorial rules are ready.

The flow is: an anonymous visitor submits plain text; the server stores the original and an editable copy as `pending`; a Press Club reviewer signs in with a shared password, edits the copy, and publishes, unpublishes, or sets the submission aside. The public page reads only published copies. No author name, email, or account is requested or stored by this feature. No email notification is sent; the dashboard is the review queue.

Before enabling it:

1. Run `supabase/migrations/20261021_tea_posts.sql` in the chosen Supabase project. The table has RLS enabled and no public policies; only the server-side service role can access it.
2. Connect the Supabase database to the Vercel project for Production. The server accepts the integration's `SUPABASE_URL` and `SUPABASE_SECRET_KEY` pair (with `SUPABASE_SERVICE_ROLE_KEY` retained for older integrations); alternatively set `NEXT_PUBLIC_SUPABASE_URL` and `TEA_SUPABASE_SERVICE_ROLE_KEY` as an explicit pair. Incomplete pairs are rejected so credentials from different projects cannot be mixed. **Never** put a secret or service-role key in a `NEXT_PUBLIC_` variable or commit it.
3. Set a long, unique `TEA_REVIEW_PASSWORD` and a separate random `TEA_SESSION_SECRET` (at least 32 random bytes) as sensitive Production variables. Everyone with the shared password has the same review permissions; rotate it if someone leaves. The login can be tested before the database is connected.
4. Decide moderation rules and a public-submission abuse control before opening submissions. The deployed Vercel firewall currently rate-limits `/api/tea/login` and `/api/tea/submit` together to 10 requests per IP per minute; verify the rule in each deployment's firewall settings. The shared-password login is deliberately a first version, not individual reviewer accounts or an audit trail.
5. Set `TEA_ENABLED=true` and redeploy. Test a submission, review edit, publish, unpublish, and sign-out on the deployed site.

The public form enforces title/body lengths and editing acknowledgement. It is not a spam or safety policy; the firewall rule is the only rate limit and is outside this repository. Submissions appear nowhere public until a reviewer publishes them. Post text is rendered as text, not HTML. Vercel and Supabase may still retain normal request logs, so do not promise submitters absolute anonymity from infrastructure operators.
