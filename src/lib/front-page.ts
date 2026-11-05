import { getSupabaseClient } from "@/lib/supabase";
import type { EntelechyEdition, NNNEdition } from "@/lib/publications";
import type { BlogPost } from "@/lib/stories";

export type FrontPagePost = Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "author" | "published_at">;

export type FrontPage = {
  entelechy: EntelechyEdition | null;
  nnn: NNNEdition[];
  posts: FrontPagePost[];
};

// Everything the front page shows, read in parallel. Each part fails on its own,
// so a broken table hides one block instead of the whole page.
export async function getFrontPage(): Promise<FrontPage> {
  const db = getSupabaseClient();
  if (!db) return { entelechy: null, nnn: [], posts: [] };

  const [entelechy, nnn, posts] = await Promise.all([
    db.from("Entelechy").select("id,edition,pdf_url").order("id", { ascending: false }).limit(1),
    db.from("NNN").select("id,Month,Year,Pdf_url").order("id", { ascending: false }).limit(3),
    db.from("blog_posts")
      .select("id,slug,title,excerpt,author,published_at")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(3),
  ]);

  return {
    entelechy: ((entelechy.data ?? [])[0] as EntelechyEdition | undefined) ?? null,
    nnn: (nnn.data ?? []) as NNNEdition[],
    posts: (posts.data ?? []) as FrontPagePost[],
  };
}

// "Thursday, 5 November 2026", in campus time.
export function formatDateline(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}
