import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import { formatStoryDate, type BlogPost } from "@/lib/stories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "Signed reporting, commentary, and campus writing from the DAU Press Club.",
};

type BlogPreview = Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "author" | "published_at">;

export default async function BlogPage() {
  const db = getSupabaseClient();
  const result = db
    ? await db.from("blog_posts")
      .select("id,slug,title,excerpt,author,published_at")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(24)
    : { data: null, error: new Error("Blog database is not configured") };
  const posts = (result.data ?? []) as BlogPreview[];

  return (
    <main id="main-content" className="site-main stories-page blog-page">
      <header className="stories-header blog-header">
        <h1>The Press Club blog.</h1>
        <p className="stories-header__intro">
          Signed reporting, commentary, interviews, and creative work from the
          students who make the campus record.
        </p>
      </header>

      <section className="story-stream story-stream--blogs" aria-labelledby="latest-blogs-title">
        <div className="story-stream__heading blog-stream__heading">
          <h2 id="latest-blogs-title">Latest from the desk</h2>
          <p>Every article carries its writer&apos;s name and publication date.</p>
        </div>

        {result.error ? (
          <div className="story-empty">
            <strong>The blog desk is temporarily unavailable.</strong>
            <span>Please check back soon.</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="story-empty">
            <strong>The first blog is still on the desk.</strong>
            <span>Signed Press Club stories will appear here when they are published.</span>
          </div>
        ) : (
          <ol className="blog-grid">
            {posts.map((post, index) => (
              <li key={post.id} className={index === 0 ? "blog-card blog-card--lead" : "blog-card"}>
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
        )}
      </section>
    </main>
  );
}

