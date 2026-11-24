"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { commentTree, REPORT_REASONS, TEA_RULES_VERSION, type PublicTeaComment, type TeaCommentNode } from "@/lib/tea-discussion";

async function send(input: Record<string, unknown>) {
  const response = await fetch("/api/tea/discussion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const result = await response.json() as { message?: string; votes?: number; active?: boolean };
  if (!response.ok) throw new Error(result.message ?? "Could not save. Please try again.");
  return result;
}

export function TeaPostActions({ postId, votes, replies, voted = false, member = false }: {
  postId: string; votes: number | null; replies?: number | null; voted?: boolean; member?: boolean;
}) {
  const [count, setCount] = useState(votes);
  const [active, setActive] = useState(voted);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function vote() {
    setBusy(true); setNotice("");
    try { const result = await send({ action: "vote", postId, active: !active }); setCount(result.votes ?? count); setActive(result.active ?? active); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not vote."); }
    finally { setBusy(false); }
  }
  return <div className="tea-discussion-actions">
    {member && count !== null ? <button type="button" aria-pressed={active} disabled={busy} onClick={vote} className="tea-upvote">{active ? "Upvoted" : "Upvote"} � {count}</button>
      : count !== null && <span>{count} {count === 1 ? "upvote" : "upvotes"}</span>}
    <Link href={`/Tea/${postId}`}>{replies == null ? "Open discussion" : `${replies} ${replies === 1 ? "reply" : "replies"}`}</Link>
    {notice && <p role="status">{notice}</p>}
  </div>;
}

export function TeaReport({ postId, commentId }: { postId: string; commentId?: string }) {
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [sent, setSent] = useState(false);
  async function report(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    try { const result = await send({ action: "report", postId, commentId, reason }); setNotice(result.message ?? "Report received."); setSent(true); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not report."); }
    finally { setBusy(false); }
  }
  return <details className="tea-report"><summary>Report {commentId ? "reply" : "post"}</summary>
    {!sent && <form onSubmit={report}><label>Reason<select value={reason} onChange={e => setReason(e.target.value)} disabled={busy}>{REPORT_REASONS.map(value => <option key={value}>{value}</option>)}</select></label>
      <p>Reports go privately to editors. Do not repost the material you are reporting.</p>
      <button disabled={busy}>{busy ? "Sending." : "Send report"}</button></form>}
    {notice && <p role="status">{notice}</p>}
  </details>;
}

export default function TeaDiscussion({ postId, comments, memberName, available }: {
  postId: string; comments: PublicTeaComment[]; memberName: string | null; available: boolean;
}) {
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  const [body, setBody] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function reply(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const result = await send({ action: "reply", postId, parentId: target?.id ?? null, body, agreed, rulesVersion: TEA_RULES_VERSION });
      setBody(""); setAgreed(false); setTarget(null); setNotice(result.message ?? "Sent for review.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not send."); }
    finally { setBusy(false); }
  }
  function renderComment(node: TeaCommentNode) {
    return <li key={node.id} className="tea-comment" id={`reply-${node.id}`}>
      <div className="tea-post__meta"><strong>{node.author_name}</strong><span>Member reply � reviewed</span>
        <time dateTime={node.published_at}>{new Date(node.published_at).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "UTC" })}</time></div>
      <p className="tea-comment__body">{node.body}</p>
      <div className="tea-comment__actions">{memberName && node.depth < 4 && <a href="#write-reply" onClick={() => { setTarget({ id: node.id, name: node.author_name }); setNotice(""); }}>Reply to {node.author_name}</a>}
        <TeaReport postId={postId} commentId={node.id} /></div>
      {node.children.length > 0 && <ol className="tea-comment__children">{node.children.map(renderComment)}</ol>}
    </li>;
  }
  return <section className="tea-discussion" aria-labelledby="discussion-title">
    <h2 id="discussion-title">The conversation</h2>
    <p>Replies come from signed-in Press Club members and are reviewed before publication. <a href="#tea-rules">Read the rules</a>.</p>
    {!available ? <p role="status">Discussions are being prepared. Please check back soon.</p>
      : <>
        <div id="write-reply">{memberName ? <form className="tea-reply-form" onSubmit={reply}>
          <p>Replying as <strong>{memberName}</strong>. This byline will be public.</p>
          <fieldset disabled={busy}><legend>{target ? `Reply to ${target.name}` : "Join the conversation"}</legend>
            {target && <button type="button" onClick={() => setTarget(null)}>Reply to the post instead</button>}
            <label htmlFor="reply-body">Your reply</label><textarea id="reply-body" required minLength={2} maxLength={2000} rows={4} value={body} onChange={e => setBody(e.target.value)} aria-describedby="reply-count" />
            <span id="reply-count">{body.length} / 2000 characters</span>
            <label className="tea-form__agreement"><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} required /><span>I have read the community rules and understand this reply will be reviewed before publication.</span></label>
            <button type="submit">{busy ? "Sending." : "Send reply for review"}</button>
          </fieldset>
        </form> : <p className="tea-signin-note"><Link href="/press-club">Sign in or finish your member profile</Link> to reply and upvote. Anyone can read or report a public post.</p>}
          {notice && <p role="status">{notice}</p>}
        </div>
        {comments.length ? <ol className="tea-comment-list">{commentTree(comments).map(renderComment)}</ol> : <p className="tea-feed__empty">No approved replies on this page yet. Start a thoughtful conversation.</p>}
      </>}
  </section>;
}
