import { getTeaDb, cleanPost, sameOrigin, teaEnabled, teaJson } from "@/lib/tea";
import { consumeRateLimit, readJsonBody } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!teaEnabled()) return teaJson("Submissions are not open yet.", 503);
  if (!sameOrigin(request)) return teaJson("Request rejected.", 403);
  const db = getTeaDb();
  if (!db) return teaJson("Submissions are not open yet.", 503);
  const rateLimit = await consumeRateLimit(db, request, "tea-submit", 10, 60 * 60);
  if (rateLimit === "unavailable") return teaJson("Submissions are temporarily unavailable.", 503);
  if (rateLimit === "limited") {
    return teaJson("Too many submissions. Please wait and try again.", 429);
  }
  const parsed = await readJsonBody(request, 7000);
  if (!parsed.ok && parsed.reason === "too_large") return teaJson("This post is too long.", 413);
  if (!parsed.ok) {
    return teaJson("Add a title and your post, then try again.", 400);
  }
  const input = parsed.value;
  const post = cleanPost(input);
  if (!post) return teaJson("Use a title of 4–120 characters and a post of 20–5000 characters.", 400);
  if (typeof input !== "object" || input === null || !("agreed" in input) || input.agreed !== true) {
    return teaJson("Please acknowledge that Press Club may edit your post.", 400);
  }

  try {
    const { error } = await db.from("tea_posts").insert({
      submitted_title: post.title,
      submitted_body: post.body,
      edited_title: post.title,
      edited_body: post.body,
      status: "pending",
    });
    if (error) throw error;
  } catch (error) {
    console.error("Tea submission failed", error instanceof Error ? error.name : "database_error");
    return teaJson("We couldn't receive your post right now. Please try later.", 503);
  }

  return teaJson("Your post has reached the Press Club review desk.", 201);
}
