"use client";

import { useState, type FormEvent } from "react";

export default function TeaSubmissionForm({ available }: { available: boolean }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/tea/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, agreed }),
      });
      const result = (await response.json()) as { message?: string };
      setNotice(result.message ?? "Please try again.");
      if (response.ok) {
        setTitle("");
        setBody("");
        setAgreed(false);
      }
    } catch {
      setNotice("Couldn't send your post. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="tea-form" onSubmit={submit}>
      <div className="tea-form__intro">
        <h2>Send something in</h2>
        <p>No account or display name. Your words go to the Press Club review desk before anything appears here. Leave out details that identify you if you want to stay anonymous.</p>
      </div>
      {!available && <p className="tea-form__notice">Submissions will open after the review desk is ready.</p>}
      <fieldset disabled={!available} className="tea-form__fields">
      <label htmlFor="tea-title">A title for your post</label>
      <input id="tea-title" name="title" value={title} onChange={(event) => setTitle(event.target.value)}
        minLength={4} maxLength={120} required placeholder="What’s the story?" />
      <label htmlFor="tea-body">Your post</label>
      <textarea id="tea-body" name="body" value={body} onChange={(event) => setBody(event.target.value)}
        minLength={20} maxLength={5000} required rows={8} placeholder="Write it in your own words…" />
      <label className="tea-form__agreement">
        <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} required />
        <span>I understand the Press Club may edit this before deciding whether to publish it.</span>
      </label>
      <button type="submit" disabled={busy}>{busy ? "Sending…" : "Request a post"}</button>
      </fieldset>
      {notice && <p className="tea-form__notice" role="status">{notice}</p>}
    </form>
  );
}
