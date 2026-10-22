import { cookies } from "next/headers";
import { reviewerCookie, reviewerSessionRevoked, validReviewerSession } from "@/lib/tea-auth";
import { cleanPost, getTeaDb, sameOrigin, teaEnabled, teaJson } from "@/lib/tea";
import { readJsonBody } from "@/lib/request-security";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!teaEnabled()) return teaJson("The review desk is not open yet.", 503);
  if (!sameOrigin(request)) return teaJson("Request rejected.", 403);
  const session = (await cookies()).get(reviewerCookie)?.value;
  if (!validReviewerSession(session)) return teaJson("Sign in to review posts.", 401);
  const db = getTeaDb();
  if (!db) return teaJson("The review desk is not configured yet.", 503);
  if (await reviewerSessionRevoked(db, session!)) return teaJson("Sign in to review posts.", 401);
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return teaJson("Post not found.", 404);
  }

  const parsed = await readJsonBody(request, 7000);
  if (!parsed.ok && parsed.reason === "too_large") return teaJson("This post is too long.", 413);
  if (!parsed.ok) {
    return teaJson("Check the post and try again.", 400);
  }
  const input = parsed.value;
  if (typeof input !== "object" || input === null) return teaJson("Check the post and try again.", 400);
  const fields = input as Record<string, unknown>;
  const action = fields.action;
  if (!["save", "publish", "reject", "unpublish", "restore"].includes(String(action))) {
    return teaJson("Choose a review action.", 400);
  }
  const post = cleanPost(input);
  if (!post) return teaJson("Use a title of 4–120 characters and a post of 20–5000 characters.", 400);

  const { data: existing, error: lookupError } = await db
    .from("tea_posts")
    .select("status,published_at")
    .eq("id", id)
    .single();
  if (lookupError || !existing) return teaJson("Post not found.", 404);

  const nextStatus = action === "publish" ? "published"
    : action === "reject" ? "rejected"
      : action === "unpublish" || action === "restore" ? "pending"
        : existing.status;
  const now = new Date().toISOString();
  const { error } = await db.from("tea_posts").update({
    edited_title: post.title,
    edited_body: post.body,
    status: nextStatus,
    updated_at: now,
    published_at: nextStatus === "published" ? existing.published_at ?? now : null,
  }).eq("id", id);
  if (error) {
    console.error("Tea review update failed", error.code);
    return teaJson("The change did not save. Please try again.", 503);
  }
  return teaJson("Review updated.", 200);
}
