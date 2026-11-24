import { canPublish, getStaffSession } from "@/lib/staff";
import { getTeaDb, sameOrigin, teaEnabled, teaJson } from "@/lib/tea";
import { cleanReply, isUuid } from "@/lib/tea-discussion";
import { readJsonBody } from "@/lib/request-security";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (!teaEnabled()) return teaJson("Campus Tea is not open yet.", 503);
  if (!sameOrigin(request)) return teaJson("Request rejected.", 403);
  const staff = await getStaffSession();
  if (staff.state !== "staff") return teaJson("Sign in to review discussions.", 401);
  if (!canPublish(staff.role)) return teaJson("Only editors and the convenor can moderate discussions.", 403);
  const parsed = await readJsonBody(request, 10000);
  if (!parsed.ok || !parsed.value || typeof parsed.value !== "object") return teaJson("Invalid review.", 400);
  const input = parsed.value as Record<string, unknown>;
  if (!isUuid(input.id)) return teaJson("Item not found.", 404);
  const db = getTeaDb();
  if (!db) return teaJson("Review is unavailable.", 503);
  try {
    if (input.kind === "report" && ["resolved", "dismissed"].includes(String(input.status))) {
      if (input.removeContent === true && input.status === "resolved") {
        const { data: report, error: lookupError } = await db.from("tea_reports").select("post_id,comment_id").eq("id", input.id).eq("status", "open").maybeSingle();
        if (lookupError) throw lookupError;
        if (!report) return teaJson("This report has already been reviewed. Refresh the desk.", 409);
        const removal = report.comment_id
          ? await db.from("tea_comments").update({ status: "pending", published_at: null, reviewed_by: staff.email }).eq("id", report.comment_id).eq("post_id", report.post_id)
          : await db.from("tea_posts").update({ status: "pending", published_at: null, updated_at: new Date().toISOString() }).eq("id", report.post_id);
        if (removal.error) throw removal.error;
      }
      const { data, error } = await db.from("tea_reports").update({ status: input.status, reviewed_by: staff.email, reviewed_at: new Date().toISOString() })
        .eq("id", input.id).eq("status", "open").select("id").maybeSingle();
      if (error) throw error;
      return teaJson(data ? "Report updated." : "This report has already been reviewed. Refresh the desk.", data ? 200 : 409);
    }
    if (input.kind !== "comment" || !["published", "pending", "rejected"].includes(String(input.status))) return teaJson("Choose a review action.", 400);
    const body = cleanReply(input.body);
    if (!body || typeof input.updatedAt !== "string") return teaJson("Check the reply and refresh the desk.", 400);
    if (input.status === "published" && input.rulesReviewed !== true) return teaJson("Confirm the reply follows the community rules before publishing.", 400);
    const { data, error } = await db.from("tea_comments").update({ body, status: input.status,
      reviewed_by: staff.email, published_at: input.status === "published" ? new Date().toISOString() : null,
    }).eq("id", input.id).eq("updated_at", input.updatedAt).select("id").maybeSingle();
    if (error) return teaJson("Could not save. The post and every parent reply must be published before approving a reply.", 409);
    return teaJson(data ? "Reply review updated." : "Another editor changed this reply. Refresh before editing.", data ? 200 : 409);
  } catch {
    return teaJson("Review could not be saved. Please try later.", 503);
  }
}
