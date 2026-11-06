import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import { teaEnabled } from "@/lib/tea";
import { formatStoryDate, partitionPostsByAge, type BlogPost } from "@/lib/stories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "Signed reporting, commentary, and campus writing from the DAU Press Club.",
};

type BlogPreview = Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "author" | "published_at">;

export default async function BlogPage() {
  const db = getSupabaseClient();
  const now = new Date();
  const result = db
    ? await db.from("blog_posts")
      .select("id,slug,title,excerpt,author,published_at")
      .eq("status", "published")
      .lte("published_at", now.toISOString())
      .order("published_at", { ascending: false })
      .limit(24)
    : { data: null, error: new Error("Blog database is not configured") };
  const posts = (result.data ?? []) as BlogPreview[];
  const { newest, older } = partitionPostsByAge(posts, now);

  const renderPosts = (items: BlogPreview[], lead = false) => (
    <ol className="blog-grid">
      {items.map((post, index) => (
        <li key={post.id} className={["blog-card", lead && "blog-card--fresh", lead && index === 0 && "blog-card--lead"].filter(Boolean).join(" ")}>
          <Link href={`/Blog/${post.slug}`}>
            <div className="blog-card__meta">
              <span>{post.author}</span>
              <time dateTime={post.published_at}>{formatStoryDate(post.published_at)}</time>
            </div>
            <h3>{post.title}</h3>
            <p>{post.excerpt}</p>
            <span className="blog-card__action">Read article <span aria-hidden="true">→</span></span>
          </Link>
        </li>
      ))}
    </ol>
  );

  return (
    <main id="main-content" className="site-main stories-page blog-page">
      <header className="stories-header blog-header">
        <h1>The Press Club blog.</h1>
        <p className="stories-header__intro">
          Signed reporting, interviews, opinion and creative work by Press Club writers.
        </p>
      </header>

      <section className="story-stream story-stream--blogs" aria-labelledby="latest-blogs-title">
        <div className="story-stream__heading blog-stream__heading">
          <h2 id="latest-blogs-title">{posts.length > 0 ? "Newest" : "From the blog desk"}</h2>
          {teaEnabled() && <p>Signed writing lives here. Anonymous posts go to Campus Tea.</p>}
        </div>
        {result.error ? (
          <div className="story-empty">
            <strong>The blog desk is temporarily unavailable.</strong>
            <span>Please check back soon, or read the current Entelechy edition while the desk reconnects.</span>
            <Link className="story-stream__cta" href="/Entelechy">Read Entelechy</Link>
          </div>
        ) : posts.length === 0 ? (
          <div className="story-empty">
            <strong>The first blog is still on the desk.</strong>
            <span>When the first signed story is published, it will appear here with its writer and date. Until then, read the latest Entelechy.</span>
            <div className="story-empty__actions">
              <Link className="story-stream__cta" href="/Entelechy">Read Entelechy</Link>
              {teaEnabled() && <Link className="story-stream__cta" href="/Tea">Open Campus Tea</Link>}
            </div>
          </div>
        ) : (
          <>
            <section className="post-age-group" aria-labelledby="latest-blogs-title">
              <p className="post-age-group__context">Posts from the past seven days.</p>
              {newest.length > 0
                ? renderPosts(newest, true)
                : <p className="post-age-group__empty">No posts were published in the past week.</p>}
            </section>
            {older.length > 0 && (
              <section className="post-age-group" aria-labelledby="older-blogs-title">
                <div className="story-stream__heading blog-stream__heading">
                  <h2 id="older-blogs-title">Older posts</h2>
                  <p>Browse reporting and writing from the archive.</p>
                </div>
                {renderPosts(older)}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

