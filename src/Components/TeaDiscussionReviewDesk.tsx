"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ReviewComment = { id: string; post_id: string; parent_id: string | null; author_name: string; submitted_body: string; body: string; status: string; updated_at: string; created_at: string };
export type ReviewReport = { id: string; post_id: string; comment_id: string | null; reason: string; created_at: string; targetBody: string | null };

async function review(input: Record<string, unknown>) {
  const response = await fetch("/api/tea/discussion/review", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const result = await response.json() as { message?: string };
  if (!response.ok) throw new Error(result.message ?? "Review failed.");
  return result.message ?? "Saved.";
}

function CommentReview({ comment }: { comment: ReviewComment }) {
  const router = useRouter();
  const [body, setBody] = useState(comment.body);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function update(status: string) {
    setBusy(true); setNotice("");
    try { setNotice(await review({ kind: "comment", id: comment.id, status, body, rulesReviewed: checked, updatedAt: comment.updated_at })); router.refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not save."); }
    finally { setBusy(false); }
  }
  return <article className="tea-review-item"><p><strong>{comment.author_name}</strong> · {comment.status} · {comment.parent_id ? "Nested reply" : "Top-level reply"}</p>
    <Link href={`/Tea/${comment.post_id}`}>Open parent post</Link>
    <details><summary>Original reply</summary><p style={{ whiteSpace: "pre-wrap" }}>{comment.submitted_body}</p></details>
    <label htmlFor={`comment-${comment.id}`}>Publication text</label>
    <textarea id={`comment-${comment.id}`} disabled={busy} rows={4} minLength={2} maxLength={2000} value={body} onChange={e => { setBody(e.target.value); setChecked(false); }} />
    <label className="tea-review-check"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} /><span>I checked privacy, consent, allegations, harassment and spam against the <a href="#tea-rules">community rules</a>.</span></label>
    <div className="tea-review-item__actions"><button disabled={busy || !checked} onClick={() => update("published")}>{comment.status === "published" ? "Update approved reply" : "Approve reply"}</button>
      {comment.status === "published" && <button disabled={busy} onClick={() => update("pending")}>Unpublish reply and hide its thread</button>}
      {comment.status !== "rejected" && <button disabled={busy} onClick={() => update("rejected")}>Set aside</button>}
      {comment.status === "rejected" && <button disabled={busy} onClick={() => update("pending")}>Return to review</button>}</div>
    <p>Removing this reply also hides all replies beneath it. Restore parents before approving their replies.</p>
    {notice && <p role="status">{notice}</p>}
  </article>;
}
function ReportReview({ report }: { report: ReviewReport }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function update(status: string, removeContent = false) {
    setBusy(true); setNotice("");
    try { setNotice(await review({ kind: "report", id: report.id, status, removeContent })); router.refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not save."); }
    finally { setBusy(false); }
  }
  return <article className="tea-review-item"><h3>{report.reason}</h3><p>Reported {report.comment_id ? "reply" : "post"} · <Link href={`/Tea/${report.post_id}`}>Open discussion</Link></p>
    {report.targetBody && <p style={{ whiteSpace: "pre-wrap" }}>{report.targetBody}</p>}
    <p>Use the post or reply review controls to remove harmful content before resolving this report. Resolving a report does not unpublish content.</p>
    <div className="tea-review-item__actions"><button disabled={busy} onClick={() => update("resolved", true)}>Unpublish content and resolve</button><button disabled={busy} onClick={() => update("resolved")}>Mark handled</button><button disabled={busy} onClick={() => update("dismissed")}>Dismiss report</button></div>
    {notice && <p role="status">{notice}</p>}</article>;
}
export default function TeaDiscussionReviewDesk({ comments, reports }: { comments: ReviewComment[]; reports: ReviewReport[] }) {
  return <section className="tea-desk" aria-labelledby="reply-review-title"><h2 id="reply-review-title">Replies and reports</h2>
    <p>Latest 100 replies per status and 100 open reports. Original replies and reports stay private. Approval always requires an editorial check.</p>
    <section aria-label="Open reports"><h3>Open reports ({reports.length})</h3>{reports.length ? reports.map(report => <ReportReview key={report.id} report={report} />) : <p>No open reports.</p>}</section>
    {["pending", "published", "rejected"].map(status => <section key={status} aria-label={`${status} replies`}><h3>{status === "pending" ? "Replies waiting for review" : status === "published" ? "Approved replies" : "Replies set aside"}</h3>
      {comments.filter(c => c.status === status).map(comment => <CommentReview key={`${comment.id}-${comment.updated_at}`} comment={comment} />)}
      {!comments.some(c => c.status === status) && <p>Nothing here right now.</p>}</section>)}
  </section>;
}
