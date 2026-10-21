import { getTeaDb, cleanPost, sameOrigin, teaEnabled, teaJson } from "@/lib/tea";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!teaEnabled()) return teaJson("Submissions are not open yet.", 503);
  if (!sameOrigin(request)) return teaJson("Request rejected.", 403);
  if (Number(request.headers.get("content-length") ?? 0) > 7000) {
    return teaJson("This post is too long.", 413);
  }

  const db = getTeaDb();
  if (!db) return teaJson("Submissions are not open yet.", 503);
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return teaJson("Add a title and your post, then try again.", 400);
  }
  const post = cleanPost(input);
  if (!post) return teaJson("Use a title of 4–120 characters and a post of 20–5000 characters.", 400);
  if (typeof input !== "object" || input === null || !("agreed" in input) || input.agreed !== true) {
    return teaJson("Please acknowledge that Press Club may edit your post.", 400);
  }

  const { error } = await db.from("tea_posts").insert({
    submitted_title: post.title,
    submitted_body: post.body,
    edited_title: post.title,
    edited_body: post.body,
    status: "pending",
  });
  if (error) {
    console.error("Tea submission failed", error.code);
    return teaJson("We couldn't receive your post right now. Please try later.", 503);
  }

  return teaJson("Your post has reached the Press Club review desk.", 201);
}
