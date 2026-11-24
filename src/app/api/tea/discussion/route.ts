import { getStaffSession } from "@/lib/staff";
import { getTeaDb, sameOrigin, teaEnabled, teaJson } from "@/lib/tea";
import { consumeRateLimit, readJsonBody } from "@/lib/request-security";
import { acceptsTeaRules, cleanReply, isUuid, REPORT_REASONS, TEA_RULES_VERSION } from "@/lib/tea-discussion";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!teaEnabled()) return teaJson("Campus Tea is not open yet.", 503);
  if (!sameOrigin(request)) return teaJson("Request rejected.", 403);
  const parsed = await readJsonBody(request, 10000);
  if (!parsed.ok) return teaJson("Check your submission and try again.", parsed.reason === "too_large" ? 413 : 400);
  if (!parsed.value || typeof parsed.value !== "object") return teaJson("Invalid submission.", 400);
  const input = parsed.value as Record<string, unknown>;
  if (!isUuid(input.postId) || !["reply", "vote", "report"].includes(String(input.action))) return teaJson("Choose a valid thread and action.", 400);
  if (input.parentId != null && !isUuid(input.parentId)) return teaJson("Invalid parent reply.", 400);
  if (input.commentId != null && !isUuid(input.commentId)) return teaJson("Invalid report target.", 400);
  // Identity always comes from the verified session and current active staff list.
  const staff = input.action === "report" ? null : await getStaffSession();
  if (input.action !== "report" && staff?.state !== "staff") return teaJson("Sign in as an active Press Club member to participate.", 401);
  if (staff?.state === "staff" && staff.needsProfile) return teaJson("Finish your member profile before joining the discussion.", 403);
  const db = getTeaDb();
  if (!db) return teaJson("Discussions are not available yet.", 503);
  try {
    const rate = await consumeRateLimit(db, request, `tea-${input.action}`, input.action === "vote" ? 120 : 20, 3600);
    if (rate !== "allowed") return teaJson(rate === "limited" ? "Too many requests. Please try again later." : "Discussions are temporarily unavailable.", rate === "limited" ? 429 : 503);
    const { data: post, error: postError } = await db.from("tea_posts").select("id")
      .eq("id", input.postId).eq("status", "published").lte("published_at", new Date().toISOString()).maybeSingle();
    if (postError) return teaJson("Could not check this thread. Please try later.", 503);
    if (!post) return teaJson("Thread not found.", 404);
    // Check every ancestor, so hidden subthreads cannot be replied to or reported.
    let ancestor = input.action === "reply" ? input.parentId : input.action === "report" ? input.commentId : null;
    let depth = 0;
    while (ancestor) {
      const { data: parent, error } = await db.from("tea_comments").select("parent_id")
        .eq("id", ancestor).eq("post_id", input.postId).eq("status", "published")
        .lte("published_at", new Date().toISOString()).maybeSingle();
      if (error) return teaJson("Could not check this reply. Please try later.", 503);
      if (!parent) return teaJson("Reply not found.", 404);
      depth += 1;
      if (depth > 5 || (input.action === "reply" && depth > 4)) return teaJson("This reply has reached the nesting limit. Reply to an earlier comment.", 400);
      ancestor = parent.parent_id;
    }
    if (input.action === "report") {
      if (!(REPORT_REASONS as readonly unknown[]).includes(input.reason)) return teaJson("Choose a report reason.", 400);
      const { error } = await db.from("tea_reports").insert({ post_id: input.postId, comment_id: input.commentId ?? null, reason: input.reason });
      if (error) throw error;
      return teaJson("Report received. An editor will review it; the report is private.", 201);
    }
    if (staff?.state !== "staff") return teaJson("Sign in to participate.", 401);
    if (input.action === "vote") {
      if (typeof input.active !== "boolean") return teaJson("Choose whether to upvote this post.", 400);
      const result = input.active
        ? await db.from("tea_votes").upsert({ post_id: input.postId, member_email: staff.email }, { onConflict: "post_id,member_email", ignoreDuplicates: true })
        : await db.from("tea_votes").delete().eq("post_id", input.postId).eq("member_email", staff.email);
      if (result.error) throw result.error;
      const { count, error } = await db.from("tea_votes").select("post_id", { head: true, count: "exact" }).eq("post_id", input.postId);
      if (error) throw error;
      return Response.json({ votes: count ?? 0, active: input.active }, { headers: { "Cache-Control": "no-store" } });
    }
    const body = cleanReply(input.body);
    if (!body) return teaJson("Write a reply of 2-2000 characters.", 400);
    if (!acceptsTeaRules(input)) return teaJson("Read and accept the current community rules.", 400);
    const { error } = await db.from("tea_comments").insert({
      post_id: input.postId, parent_id: input.parentId ?? null, member_email: staff.email,
      author_name: staff.byline.slice(0, 200), submitted_body: body, body, status: "pending", rules_version: TEA_RULES_VERSION,
    });
    if (error) throw error;
    return teaJson("Your reply is with the editors. It will appear after approval.", 201);
  } catch {
    return teaJson("Could not save that change. Please try again later.", 503);
  }
}
