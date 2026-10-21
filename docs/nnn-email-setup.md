# NNN email delivery

The NNN page offers the supplied **August 2026, Part 1** test issue by email. The PDF is stored at `issues/nnn/august-2026-part-1.pdf` and is attached by the server route at `/api/nnn/request`. The route only accepts `@dau.ac.in` recipient addresses. An address does not need a site account: receiving the message is the proof that the person controls that inbox.

## Enable delivery

1. Create a Resend account and verify a domain that the Press Club can send from. Resend must authorize the sender address you choose.
2. In the Vercel project, add these **server-side** environment variables for Production (and Preview if testing there):
   - `RESEND_API_KEY`: a Resend API key with permission to send email.
   - `NNN_FROM_EMAIL`: `pressclub@dau.ac.in`, provided `dau.ac.in` is verified for sending in the Press Club Resend account.
3. Redeploy after saving the variables. Open `/NNN`, submit an actual `@dau.ac.in` address, and confirm the PDF arrives. Check spam if necessary.

Do not prefix these variables with `NEXT_PUBLIC_` or commit credentials to the repository. The existing Supabase connection continues to supply the archive list; it is not used to send mail. The PDF is bundled with the server route for Vercel deployments.

## Changing the test issue

When a new PDF is ready, add it under `issues/nnn/`, then update the filename, subject and body in `src/app/api/nnn/request/route.ts` and the form copy in `src/Components/NNNEmailRequest.tsx`. Redeploy. The archive's Supabase `NNN` record is separate and can be updated on its normal schedule.

The route has a five-minute, per-address cooldown in server memory. This is a basic guard for the test, not a shared rate limit across Vercel instances. Add a persistent rate limit or bot challenge before promoting the form broadly.
