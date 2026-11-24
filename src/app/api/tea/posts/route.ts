import { canPublish, getStaffSession } from "@/lib/staff";
import { cleanPost, getTeaDb, sameOrigin, teaEnabled, teaJson } from "@/lib/tea";
import { readJsonBody } from "@/lib/request-security";
import { TEA_RULES_VERSION } from "@/lib/tea-discussion";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return teaJson("Request rejected.", 403);
  const staff = await getStaffSession();
  if (staff.state !== "staff") return teaJson("Sign in to the staff desk to create a post.", 401);
  if (!canPublish(staff.role)) return teaJson("Only editors and the convenor can create Tea from the review desk.", 403);
  const parsed = await readJsonBody(request, 24000);
  if (!parsed.ok) return teaJson("Check your post and try again.", parsed.reason === "too_large" ? 413 : 400);
  const post = cleanPost(parsed.value);
  if (!post || !parsed.value || typeof parsed.value !== "object") return teaJson("Use a title of 4–120 characters and a post of 20–5000 characters.", 400);
  const input = parsed.value as Record<string, unknown>;
  if (input.action !== "draft" && input.action !== "publish") return teaJson("Choose Save draft or Publish Tea.", 400);
  const publish = input.action === "publish";
  if (publish && !teaEnabled()) return teaJson("Public Campus Tea is paused. Save a draft instead.", 409);
  if (publish && (input.rulesReviewed !== true || input.rulesVersion !== TEA_RULES_VERSION)) return teaJson("Review the current community rules before publishing.", 400);
  const db = getTeaDb();
  if (!db) return teaJson("The desk is not connected to storage. Please contact the site administrator.", 503);
  try {
    const { data, error } = await db.from("tea_posts").insert({ submitted_title: post.title, submitted_body: post.body,
      edited_title: post.title, edited_body: post.body, status: publish ? "published" : "pending",
      published_at: publish ? new Date().toISOString() : null,
    }).select("id").single();
    if (error || !data) return teaJson("Your post did not save. Your text is still in the form; please try again.", 503);
    return Response.json({ id: data.id, message: publish ? "Campus Tea published." : "Draft saved to Waiting for review." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return teaJson("Your post did not save. Please try again later.", 503); }
}
