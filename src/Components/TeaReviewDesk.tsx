"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import type { TeaPost, TeaStatus } from "@/lib/tea";

const groups: { status: TeaStatus; title: string }[] = [
  { status: "pending", title: "Waiting for review" },
  { status: "published", title: "Published" },
  { status: "rejected", title: "Set aside" },
];

function ReviewItem({ post }: { post: TeaPost }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.edited_title);
  const [body, setBody] = useState(post.edited_body);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [rulesReviewed, setRulesReviewed] = useState(false);

  async function update(action: "save" | "publish" | "reject" | "unpublish" | "restore") {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(`/api/tea/review/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, action, rulesReviewed }),
      });
      const result = (await response.json()) as { message?: string };
      setNotice(result.message ?? "Please try again.");
      if (response.ok) router.refresh();
    } catch {
      setNotice("Couldn't save that change. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="tea-review-item">
      <div className="tea-review-item__meta">
        <span>Received {new Date(post.created_at).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "UTC" })}</span>
        <span>{post.status}</span>
      </div>
      <details className="tea-review-item__original">
        <summary>Read original submission</summary>
        <h3>{post.submitted_title}</h3>
        <p>{post.submitted_body}</p>
      </details>
      <label htmlFor={`title-${post.id}`}>Publication title</label>
      <input id={`title-${post.id}`} value={title} onChange={(event) => { setTitle(event.target.value); setRulesReviewed(false); }}
        minLength={4} maxLength={120} />
      <label htmlFor={`body-${post.id}`}>Publication text</label>
      <textarea id={`body-${post.id}`} value={body} onChange={(event) => { setBody(event.target.value); setRulesReviewed(false); }}
        minLength={20} maxLength={5000} rows={7} />
      <label className="tea-review-check"><input type="checkbox" checked={rulesReviewed} onChange={event => setRulesReviewed(event.target.checked)} /><span>I checked privacy, consent, allegations, harassment and spam against the <Link href="/Tea#tea-rules">community rules</Link>.</span></label>
      <div className="tea-review-item__actions">
        {post.status === "pending" && <>
          <button disabled={busy} onClick={() => update("save")}>Save edit</button>
          <button disabled={busy || !rulesReviewed} onClick={() => update("publish")}>Publish</button>
          <button disabled={busy} onClick={() => update("reject")}>Set aside</button>
        </>}
        {post.status === "published" && <>
          <button disabled={busy || !rulesReviewed} onClick={() => update("save")}>Update live post</button>
          <button disabled={busy} onClick={() => update("unpublish")}>Unpublish</button>
        </>}
        {post.status === "rejected" && <button disabled={busy} onClick={() => update("restore")}>Return to review</button>}
      </div>
      {notice && <p className="tea-review-item__notice" role="status">{notice}</p>}
    </article>
  );
}

export default function TeaReviewDesk({ posts }: { posts: TeaPost[] }) {
  return (
    <div className="tea-desk">
      <div className="tea-desk__toolbar">
        <p>Only published posts appear on the public page. Original submissions stay here for reference.</p>
      </div>
      {groups.map(({ status, title }) => {
        const matching = posts.filter((post) => post.status === status);
        return <section key={status} className="tea-desk__group" aria-label={title}>
          <h2>{title} <span>{matching.length}</span></h2>
          {matching.length ? matching.map((post) => <ReviewItem key={`${post.id}-${post.updated_at}`} post={post} />)
            : <p className="tea-desk__empty">Nothing here right now.</p>}
        </section>;
      })}
    </div>
  );
}
