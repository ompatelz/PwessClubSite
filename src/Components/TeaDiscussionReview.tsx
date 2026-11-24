import TeaDiscussionReviewDesk, { type ReviewComment, type ReviewReport } from "@/Components/TeaDiscussionReviewDesk";
import { getTeaDb } from "@/lib/tea";

// Render only after the staff page has verified editor/convenor access.
export default async function TeaDiscussionReview() {
  const db = getTeaDb();
  if (!db) return null;
  const [commentResults, reports] = await Promise.all([
    Promise.all(["pending", "published", "rejected"].map(status => db.from("tea_comments")
      .select("id,post_id,parent_id,author_name,submitted_body,body,status,created_at,updated_at")
      .eq("status", status).order("updated_at", { ascending: false }).limit(100))),
    db.from("tea_reports").select("id,post_id,comment_id,reason,created_at").eq("status", "open").order("created_at", { ascending: true }).limit(100),
  ]);
  if ([...commentResults, reports].some(result => result.error)) return <p role="status">The reply and report queue could not be loaded. Check the discussion migration and refresh.</p>;
  const commentIds = (reports.data ?? []).flatMap(report => report.comment_id ? [report.comment_id] : []);
  const postIds = (reports.data ?? []).filter(report => !report.comment_id).map(report => report.post_id);
  const [commentTargets, postTargets] = await Promise.all([
    commentIds.length ? db.from("tea_comments").select("id,body").in("id", commentIds) : { data: [] },
    postIds.length ? db.from("tea_posts").select("id,edited_body").in("id", postIds) : { data: [] },
  ]);
  const comments = commentResults.flatMap(result => result.data ?? []) as ReviewComment[];
  const targets = new Map<string, string>([...(commentTargets.data ?? []).map(c => [c.id, c.body] as [string, string]), ...(postTargets.data ?? []).map(p => [p.id, p.edited_body] as [string, string])]);
  return <TeaDiscussionReviewDesk comments={comments} reports={(reports.data ?? []).map(report => ({ ...report, targetBody: targets.get(report.comment_id ?? report.post_id) ?? null })) as ReviewReport[]} />;
}
