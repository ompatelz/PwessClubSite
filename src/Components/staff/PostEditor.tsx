"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { StaffRole } from "@/lib/staff-roles";

export type EditablePost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  author: string;
  status: "draft" | "review" | "published" | "archived";
  published_at: string | null;
  created_by: string | null;
};

type Props = {
  post: EditablePost | null;
  role: StaffRole;
  memberName: string;
  memberEmail: string;
};

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function friendlyError(error: { code?: string; message?: string }) {
  if (error.code === "23505") return "Another post already uses that web address. Change the web address and try again.";
  if (error.code === "42501" || /row-level security/i.test(error.message ?? "")) {
    return "You don't have permission to do that. Writers can edit only their own drafts; an editor publishes.";
  }
  if (error.code === "23514") return "Something is too short or too long. Check the headline, summary and body.";
  return "That didn't save. Check your connection and try again.";
}

export default function PostEditor({ post, role, memberName, memberEmail }: Props) {
  const router = useRouter();
  const isEditor = role === "convenor" || role === "editor";
  const ownsPost = !post || post.created_by === memberEmail;
  const writerLocked = !isEditor && (!ownsPost || (post !== null && !["draft", "review"].includes(post.status)));

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(post));
  const [author, setAuthor] = useState(post?.author ?? memberName);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [scheduleAt, setScheduleAt] = useState(toLocalInput(post?.published_at ?? null));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  // The time the editor opened; enough to tell live posts from scheduled ones.
  const [openedAt] = useState(() => Date.now());

  const effectiveSlug = slugEdited ? slug : slugify(title);
  const paragraphs = useMemo(() => body.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean), [body]);

  const problems = [
    title.trim().length < 4 || title.trim().length > 140 ? "Headline: 4 to 140 characters." : "",
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(effectiveSlug) ? "Web address: lowercase letters, numbers and hyphens." : "",
    author.trim().length < 2 || author.trim().length > 100 ? "Writer: 2 to 100 characters." : "",
    excerpt.trim().length < 20 || excerpt.trim().length > 320 ? `Summary: 20 to 320 characters (now ${excerpt.trim().length}).` : "",
    body.trim().length < 40 ? "Body: at least 40 characters." : "",
  ].filter(Boolean);

  async function save(status: EditablePost["status"], publishedAt: string | null, done: string) {
    setError("");
    setNotice("");
    if (status !== "draft" && problems.length > 0) {
      setError(problems.join(" "));
      return;
    }
    if (status === "draft" && (title.trim().length < 4 || !effectiveSlug)) {
      setError("Add a headline of at least 4 characters before saving.");
      return;
    }
    setBusy(true);
    const values = {
      title: title.trim(),
      slug: effectiveSlug,
      author: author.trim(),
      excerpt: excerpt.trim(),
      body: body.trim(),
      status,
      published_at: publishedAt,
    };
    const supabase = getBrowserSupabase();
    const result = post
      ? await supabase.from("blog_posts").update(values).eq("id", post.id).select("id").maybeSingle()
      : await supabase.from("blog_posts").insert(values).select("id").single();
    setBusy(false);

    if (result.error || !result.data) {
      setError(result.error ? friendlyError(result.error) : "You don't have permission to change this post.");
      return;
    }
    setNotice(done);
    if (!post) router.replace(`/press-club/posts/${result.data.id}?saved=1`);
    else router.refresh();
  }

  async function remove() {
    if (!post) return;
    setBusy(true);
    const { error: deleteError, count } = await getBrowserSupabase()
      .from("blog_posts")
      .delete({ count: "exact" })
      .eq("id", post.id);
    setBusy(false);
    if (deleteError || count === 0) {
      setError(deleteError ? friendlyError(deleteError) : "You don't have permission to delete this post.");
      return;
    }
    router.replace("/press-club");
    router.refresh();
  }

  const status = post?.status ?? "draft";
  const scheduledIso = scheduleAt ? new Date(scheduleAt).toISOString() : null;
  const isLive = status === "published" && post?.published_at && new Date(post.published_at).getTime() <= openedAt;

  return (
    <div className="post-editor">
      <form className="post-editor__form" onSubmit={(event) => event.preventDefault()}>
        {writerLocked && (
          <p className="staff-hint">
            {ownsPost ? "This post has been published or archived, so only an editor can change it now." : "Only the writer who started this post, or an editor, can change it."}
          </p>
        )}
        <fieldset disabled={busy || writerLocked}>
          <label htmlFor="post-title">Headline</label>
          <input id="post-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} required />

          <label htmlFor="post-slug">Web address</label>
          <div className="post-editor__slug">
            <span>/Blog/</span>
            <input
              id="post-slug"
              value={effectiveSlug}
              onChange={(event) => { setSlugEdited(true); setSlug(slugify(event.target.value) || event.target.value.toLowerCase()); }}
              maxLength={80}
            />
          </div>
          {isLive && <p className="staff-hint">Changing the web address of a live post breaks links people have already shared.</p>}

          <label htmlFor="post-author">Writer (as shown on the post)</label>
          <input id="post-author" value={author} onChange={(event) => setAuthor(event.target.value)} maxLength={100} />

          <label htmlFor="post-excerpt">Summary <span>({excerpt.trim().length}/320, shown on cards and link previews)</span></label>
          <textarea id="post-excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={3} maxLength={320} />

          <label htmlFor="post-body">Body <span>(leave a blank line between paragraphs)</span></label>
          <textarea id="post-body" value={body} onChange={(event) => setBody(event.target.value)} rows={18} />
        </fieldset>

        <div className="post-editor__status">
          Status: <strong>{status === "review" ? "waiting for review" : status}</strong>
          {post?.published_at && status === "published" && !isLive && <> · goes live {new Date(post.published_at).toLocaleString("en-IN")}</>}
        </div>

        {!writerLocked && (
          <div className="post-editor__actions">
            {/* Save keeps the post exactly where it is: a draft stays a draft, a live post stays live. */}
            <button
              type="button"
              className={isLive ? "staff-button staff-button--primary" : "staff-button"}
              disabled={busy}
              onClick={() => save(status, status === "published" || status === "archived" ? post?.published_at ?? null : null, isLive ? "Live post updated." : "Saved.")}
            >
              {isLive ? "Update live post" : "Save"}
            </button>
            {!isEditor && status === "draft" && (
              <button type="button" className="staff-button staff-button--primary" disabled={busy} onClick={() => save("review", null, "Sent to the editors for review.")}>
                Submit for review
              </button>
            )}
            {!isEditor && status === "review" && (
              <button type="button" className="staff-button" disabled={busy} onClick={() => save("draft", null, "Moved back to drafts.")}>
                Back to draft
              </button>
            )}
            {isEditor && (
              <>
                {!isLive && (
                  <button type="button" className="staff-button staff-button--primary" disabled={busy} onClick={() => save("published", new Date().toISOString(), "Published.")}>
                    Publish now
                  </button>
                )}
                {!isLive && (
                  <span className="post-editor__schedule">
                    <label htmlFor="post-schedule">or publish on</label>
                    <input id="post-schedule" type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)} />
                    <button
                      type="button"
                      className="staff-button"
                      disabled={busy || !scheduledIso || new Date(scheduledIso).getTime() <= openedAt}
                      onClick={() => save("published", scheduledIso, "Scheduled.")}
                    >
                      Schedule
                    </button>
                  </span>
                )}
                {(status === "published" || status === "review") && (
                  <button type="button" className="staff-button" disabled={busy} onClick={() => save("draft", null, status === "published" ? "Unpublished and moved to drafts." : "Moved back to drafts.")}>
                    {status === "published" ? "Unpublish" : "Return to writer"}
                  </button>
                )}
                {post && status !== "archived" && (
                  <button type="button" className="staff-button" disabled={busy} onClick={() => save("archived", post.published_at, "Archived. It no longer appears on the site.")}>
                    Archive
                  </button>
                )}
              </>
            )}
            {post && (isEditor || (ownsPost && status === "draft")) && (
              confirmDelete ? (
                <span className="post-editor__confirm">
                  Delete this post for good?
                  <button type="button" className="staff-button staff-button--danger" disabled={busy} onClick={remove}>Yes, delete</button>
                  <button type="button" className="staff-button" onClick={() => setConfirmDelete(false)}>Keep it</button>
                </span>
              ) : (
                <button type="button" className="staff-link-button" onClick={() => setConfirmDelete(true)}>Delete</button>
              )
            )}
          </div>
        )}
        <p className="post-editor__messages" role="status" aria-live="polite">
          {notice && <span className="staff-notice">{notice}</span>}
          {error && <span className="staff-error">{error}</span>}
        </p>
      </form>

      <aside className="post-editor__preview" aria-label="Preview">
        <p className="kicker">Preview</p>
        <article>
          <p className="post-editor__byline">{author || "Writer"}</p>
          <h2>{title || "Headline"}</h2>
          <p className="post-editor__dek">{excerpt || "The summary appears here."}</p>
          {paragraphs.length ? paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p className="staff-empty">The body appears here.</p>}
        </article>
      </aside>
    </div>
  );
}
