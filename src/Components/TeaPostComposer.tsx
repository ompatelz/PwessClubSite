"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { TEA_RULES_VERSION } from "@/lib/tea-discussion";

export default function TeaPostComposer({ publicEnabled }: { publicEnabled: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [publishedId, setPublishedId] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice(""); setPublishedId(null);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const action = submitter?.value === "publish" ? "publish" : "draft";
    try {
      const response = await fetch("/api/tea/posts", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, action, rulesReviewed: checked, rulesVersion: TEA_RULES_VERSION }) });
      const result = await response.json() as { message?: string; id?: string };
      setNotice(result.message ?? "Please try again.");
      if (response.ok) { setTitle(""); setBody(""); setChecked(false); if (action === "publish") setPublishedId(result.id ?? null); router.refresh(); }
    } catch { setNotice("Your post could not be saved. Your text is still here; please try again."); }
    finally { setBusy(false); }
  }
  return <section className="tea-composer staff-section" aria-labelledby="new-tea-title">
    <h2 id="new-tea-title">New Tea post</h2>
    <p>Write directly from the desk. Save a draft for review, or check the rules and publish. The public post will be anonymous.</p>
    <form onSubmit={submit}><fieldset disabled={busy} className="tea-form__fields">
      <label htmlFor="new-tea-heading">Post title</label>
      <input id="new-tea-heading" required minLength={4} maxLength={120} value={title} onChange={e => { setTitle(e.target.value); setChecked(false); }} aria-describedby="new-tea-title-count" />
      <span id="new-tea-title-count">{title.length} / 120 characters</span>
      <label htmlFor="new-tea-body">Post text</label>
      <textarea id="new-tea-body" required minLength={20} maxLength={5000} rows={7} value={body} onChange={e => { setBody(e.target.value); setChecked(false); }} aria-describedby="new-tea-body-count" />
      <span id="new-tea-body-count">{body.length} / 5000 characters</span>
      <label className="tea-review-check"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} /><span>I checked privacy, consent, allegations, harassment and spam against the <a href="#tea-rules">community rules</a>.</span></label>
      <div className="tea-review-item__actions"><button type="submit" name="action" value="draft">Save draft</button><button type="submit" name="action" value="publish" disabled={!checked || !publicEnabled}>Publish Tea</button></div>
      {!publicEnabled && <p>Public Campus Tea is paused. You can prepare drafts here; publishing opens when Campus Tea is enabled.</p>}
    </fieldset></form>
    {busy && <p role="status">Saving your post…</p>}
    {notice && <p role="status">{notice} {publishedId && <Link href={`/Tea/${publishedId}`}>View published post</Link>}</p>}
  </section>;
}
