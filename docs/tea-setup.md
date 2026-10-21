# Anonymous campus posts

The feature is off by default. Keep `TEA_ENABLED` unset until storage, abuse controls, and the Press Club's editorial rules are ready. While off, `/Tea` and `/press-club` return 404 and the navigation hides the feature.

The flow is: an anonymous visitor submits plain text; the server stores the original and an editable copy as `pending`; a Press Club reviewer signs in with a shared password, edits the copy, and publishes, unpublishes, or sets the submission aside. The public page reads only published copies. No author name, email, or account is requested or stored by this feature. No email notification is sent; the dashboard is the review queue.

Before enabling it:

1. Run `supabase/migrations/20261021_tea_posts.sql` in the chosen Supabase project. The table has RLS enabled and no public policies; only the server-side service role can access it.
2. Set `NEXT_PUBLIC_SUPABASE_URL` to that project's URL and `TEA_SUPABASE_SERVICE_ROLE_KEY` to its service-role key in Vercel Production. **Never** put the service-role key in a `NEXT_PUBLIC_` variable or commit it.
3. Set a long, unique `TEA_REVIEW_PASSWORD` and a separate random `TEA_SESSION_SECRET` (at least 32 random bytes) as sensitive Production variables. Everyone with the shared password has the same review permissions; rotate it if someone leaves.
4. Decide moderation rules and a public-submission abuse control before opening submissions. The shared-password login is deliberately a first version, not individual reviewer accounts or an audit trail.
5. Set `TEA_ENABLED=true` and redeploy. Test a submission, review edit, publish, unpublish, and sign-out on the deployed site.

The public form enforces title/body lengths and editing acknowledgement. It is not a spam or safety policy, and the API has no durable rate limit yet. Submissions appear nowhere public until a reviewer publishes them. Post text is rendered as text, not HTML. Vercel and Supabase may still retain normal request logs, so do not promise submitters absolute anonymity from infrastructure operators.
