import { cache } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { BlogPost } from "@/lib/stories";

// One published, non-future post by slug. Shared by the article page,
// its metadata and its share image; `cache` dedupes within a request.
export const getPublishedArticle = cache(async (slug: string) => {
  const db = getSupabaseClient();
  if (!db) return null;

  const { data, error } = await db.from("blog_posts")
    .select("id,slug,title,excerpt,body,author,published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  return data as BlogPost;
});
