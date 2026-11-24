import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TeaDiscussion, { TeaPostActions, TeaReport } from "@/Components/TeaDiscussion";
import TeaRules from "@/Components/TeaRules";
import { getStaffSession } from "@/lib/staff";
import { getTeaDb, teaEnabled } from "@/lib/tea";
import { isUuid, type PublicTeaComment } from "@/lib/tea-discussion";
import "@/app/tea-discussion.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Campus Tea � Discussion", description: "Reviewed campus conversation from the Press Club.", robots: { index: false, follow: true } };

export default async function TeaThread({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }>;
}) {
  if (!teaEnabled()) notFound();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const db = getTeaDb();
  if (!db) return <main id="main-content" className="site-main tea-page"><h1>Campus Tea</h1><p>Discussions are being prepared. <Link href="/Tea">Back to the feed</Link>.</p></main>;
  const { data: post, error } = await db.from("tea_posts").select("id,edited_title,edited_body,published_at")
    .eq("id", id).eq("status", "published").lte("published_at", new Date().toISOString()).maybeSingle();
  if (error) throw new Error("Campus Tea could not be loaded.");
  if (!post) notFound();
  const rawPage = Number((await searchParams).page ?? 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 1000 ? rawPage : 1;
  const [session, replies, next, counts] = await Promise.all([
    getStaffSession(), db.rpc("tea_public_comments", { p_post_id: id, p_offset: (page - 1) * 20 }),
    db.rpc("tea_public_comments", { p_post_id: id, p_offset: page * 20 }),
    db.rpc("tea_discussion_counts", { p_post_ids: [id] }),
  ]);
  const member = session.state === "staff" && !session.needsProfile;
  const { data: vote } = member ? await db.from("tea_votes").select("post_id").eq("post_id", id).eq("member_email", session.email).maybeSingle() : { data: null };
  const count = counts.data?.[0];
  return <main id="main-content" className="site-main tea-page tea-thread-page">
    <Link href="/Tea" className="tea-back">All Campus Tea</Link>
    <div className="tea-page__columns"><div>
      <article className="tea-post tea-thread-post"><div className="tea-post__meta"><span>Anonymous � reviewed by the Press Club</span><time dateTime={post.published_at}>{new Date(post.published_at).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "UTC" })}</time></div>
        <h1>{post.edited_title}</h1><p>{post.edited_body}</p>
        <TeaPostActions postId={id} votes={count ? Number(count.votes) : null} replies={count ? Number(count.replies) : null} voted={Boolean(vote)} member={member} />
        <TeaReport postId={id} />
      </article>
      <TeaDiscussion postId={id} comments={(replies.error ? [] : replies.data ?? []) as PublicTeaComment[]} memberName={member ? session.byline : null} available={!replies.error && !counts.error} />
      {!replies.error && <nav className="tea-pagination" aria-label="Reply pages">{page > 1 && <Link href={`/Tea/${id}?page=${page - 1}`}>Previous conversations</Link>}<span>Page {page}</span>{!next.error && next.data?.length > 0 && <Link href={`/Tea/${id}?page=${page + 1}`}>More conversations</Link>}</nav>}
    </div><TeaRules /></div>
  </main>;
}
