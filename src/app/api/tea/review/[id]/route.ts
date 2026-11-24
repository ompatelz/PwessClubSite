import { canPublish, getStaffSession } from "@/lib/staff";
import { cleanPost, getTeaDb, sameOrigin, teaJson } from "@/lib/tea";
import { readJsonBody } from "@/lib/request-security";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (!sameOrigin(request)) return teaJson("Request rejected.", 403);
  // Reviewers are staff signed in with their DAU Google account; the staff list
  // is checked on every request, so a removed member loses access at once.
  const staff = await getStaffSession();
  if (staff.state !== "staff") return teaJson("Sign in to the staff desk to review posts.", 401);
  if (!canPublish(staff.role)) return teaJson("Only editors and the convenor review Campus Tea posts.", 403);
  const db = getTeaDb();
  if (!db) return teaJson("The review desk is not configured yet.", 503);
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return teaJson("Post not found.", 404);
  }

  const parsed = await readJsonBody(request, 24000);
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
  if (typeof fields.updatedAt !== "string") return teaJson("Refresh the desk before reviewing this post.", 400);

  const { data: existing, error: lookupError } = await db
    .from("tea_posts")
    .select("status,published_at,edited_title,edited_body,updated_at")
    .eq("id", id)
    .single();
  if (lookupError || !existing) return teaJson("Post not found.", 404);
  if (fields.updatedAt !== existing.updated_at) return teaJson("Another editor changed this post. Refresh before editing.", 409);
  // Removing a post must work even when the editor has unfinished, invalid edits.
  const post = action === "save" || action === "publish" ? cleanPost(input)
    : { title: existing.edited_title, body: existing.edited_body };
  if (!post) return teaJson("Use a title of 4–120 characters and a post of 20–5000 characters.", 400);
  if ((action === "publish" || (action === "save" && existing.status === "published")) && fields.rulesReviewed !== true) {
    return teaJson("Check this post against the community rules before publishing.", 400);
  }

  const nextStatus = action === "publish" ? "published"
    : action === "reject" ? "rejected"
      : action === "unpublish" || action === "restore" ? "pending"
        : existing.status;
  const now = new Date().toISOString();
  const { data: updated, error } = await db.from("tea_posts").update({
    edited_title: post.title,
    edited_body: post.body,
    status: nextStatus,
    updated_at: now,
    published_at: nextStatus === "published" ? existing.published_at ?? now : null,
  }).eq("id", id).eq("updated_at", fields.updatedAt).select("id").maybeSingle();
  if (error) {
    console.error("Tea review update failed", error.code);
    return teaJson("The change did not save. Please try again.", 503);
  }
  if (!updated) return teaJson("Another editor changed this post. Refresh before editing.", 409);
  return teaJson("Review updated.", 200);
}
