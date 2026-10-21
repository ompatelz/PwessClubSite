# NNN email delivery through Press Club Gmail

The NNN page offers the supplied **August 2026, Part 1** test issue by email. The PDF is stored at `issues/nnn/august-2026-part-1.pdf`. The website checks that recipients use `@dau.ac.in`, and a Google Apps Script owned by `pressclub@dau.ac.in` sends the attached PDF. The script also checks the recipient domain, the PDF's SHA-256 hash, and a shared secret kept on the server.

## One-time Press Club account setup

1. Sign in as `pressclub@dau.ac.in` and create a project at [Google Apps Script](https://script.google.com/home/projects/create). Confirm the avatar shows the Press Club account.
2. Replace the starter code with `integrations/apps-script/Code.gs` from this repository and save it. Name the project `Press Club NNN Mailer`.
3. Select the `initializeSecret` function in the editor and click **Run**. It creates a random `NNN_GMAIL_SCRIPT_SECRET` under **Project Settings → Script properties**. Copy that property value directly into Vercel later; do not paste it into chat or the repository.
4. Select the `authorize` function in the editor and click **Run**. Review and grant the requested Gmail permission while signed in as the Press Club account.
5. Select **Deploy → New deployment → Web app**. Set **Execute as** to **Me** and **Who has access** to **Anyone**, then deploy. If the DAU Workspace policy blocks that access setting, ask the Workspace administrator to permit this web app. Copy the URL ending in `/exec`.
6. In the Vercel `pwess-club-site` project, set **Production** server-side variables `NNN_GMAIL_SCRIPT_URL` to that `/exec` URL and `NNN_GMAIL_SCRIPT_SECRET` to the value copied from Script properties. Mark the secret as sensitive. Redeploy after changing variables.
7. Open `/NNN`, submit a DAU address, and confirm the August PDF arrives from the Press Club Gmail account.

The request form is hidden until `NNN_EMAIL_ENABLED=true` is set for the Vercel Production environment and the site is redeployed. Keep that flag unset while Gmail authorization or delivery testing is incomplete. The API route and Apps Script remain available for controlled testing before the form is enabled.

Do not prefix these variables with `NEXT_PUBLIC_`. The existing Supabase connection supplies the archive list; it is not used to send mail. The PDF is bundled with the website's server route.

## Changing the test issue

When a new PDF is ready, add it under `issues/nnn/`. Update its path in `src/app/api/nnn/request/route.ts`, the form copy in `src/Components/NNNEmailRequest.tsx`, and the subject, filename, body, and SHA-256 hash in `integrations/apps-script/Code.gs`. Redeploy both the Apps Script and website. The archive's Supabase `NNN` record is separate and can be updated on its normal schedule.

Both the website and Apps Script apply a five-minute, per-address cooldown in their own caches. These are basic guards for a test, not a persistent global rate limit. Add durable abuse protection before a broad launch.
