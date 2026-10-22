import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import { getTeaDb, teaEnabled, type TeaPost } from "@/lib/tea";
import { formatStoryDate, previewStoryText, type BlogPost } from "@/lib/stories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stories",
  description: "Press Club blogs and anonymous campus Tea from DAU.",
};

type BlogPreview = Pick<BlogPost, "id" | "slug" | "title" | "excerpt" | "author" | "published_at">;
type TeaPreview = Pick<TeaPost, "id" | "edited_title" | "edited_body" | "published_at">;

export default async function StoriesPage() {
  const publicDb = getSupabaseClient();
  const teaDb = teaEnabled() ? getTeaDb() : null;
  const now = new Date().toISOString();
  const [blogResult, teaResult] = await Promise.all([
    publicDb
      ? publicDb.from("blog_posts")
        .select("id,slug,title,excerpt,author,published_at")
        .eq("status", "published")
        .lte("published_at", now)
        .order("published_at", { ascending: false })
        .limit(12)
      : Promise.resolve({ data: null, error: new Error("Blog database is not configured") }),
    teaDb
      ? teaDb.from("tea_posts")
        .select("id,edited_title,edited_body,published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(6)
      : Promise.resolve({ data: null, error: new Error("Tea database is not configured") }),
  ]);

  const blogs = (blogResult.data ?? []) as BlogPreview[];
  const teaPosts = (teaResult.data ?? []) as TeaPreview[];

  return (
    <main id="main-content" className="site-main stories-page">
      <header className="stories-header">
        <p className="stories-header__eyebrow">The live page</p>
        <h1>Stories from both sides of campus.</h1>
        <p className="stories-header__intro">
          Signed writing from the Press Club sits beside anonymous posts from
          students. Different voices, one place to see what DAU is talking about.
        </p>
        <nav className="stories-header__jump" aria-label="Jump to a story stream">
          <a href="#blogs">Read the blog</a>
          <a href="#tea">Read campus Tea</a>
        </nav>
      </header>

      <section id="blogs" className="story-stream story-stream--blogs" aria-labelledby="blogs-title">
        <div className="story-stream__heading">
          <div>
            <p className="story-stream__number" aria-hidden="true">01</p>
            <h2 id="blogs-title">The Press Club blog</h2>
          </div>
          <p>Reported, argued, photographed, and signed by the people who made it.</p>
        </div>

        {blogResult.error ? (
          <div className="story-empty">
            <strong>The blog desk is being set up.</strong>
            <span>Published stories will appear here.</span>
          </div>
        ) : blogs.length === 0 ? (
          <div className="story-empty">
            <strong>The first blog is still on the desk.</strong>
            <span>Press Club stories will appear here as soon as they are published.</span>
          </div>
        ) : (
          <ol className="blog-grid">
            {blogs.map((post, index) => (
              <li key={post.id} className={index === 0 ? "blog-card blog-card--lead" : "blog-card"}>
                <Link href={`/Stories/${post.slug}`}>
                  <div className="blog-card__meta">
                    <span>{post.author}</span>
                    <time dateTime={post.published_at}>{formatStoryDate(post.published_at)}</time>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <span className="blog-card__action">Read story <span aria-hidden="true">→</span></span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section id="tea" className="story-stream story-stream--tea" aria-labelledby="tea-title">
        <div className="story-stream__heading">
          <div>
            <p className="story-stream__number" aria-hidden="true">02</p>
            <h2 id="tea-title">Campus Tea</h2>
          </div>
          <p>Anonymous submissions, reviewed by the Press Club before they go public.</p>
        </div>

        {teaResult.error ? (
          <div className="story-empty story-empty--tea">
            <strong>The Tea desk is being prepared.</strong>
            <span>Check back soon for anonymous campus posts.</span>
          </div>
        ) : teaPosts.length === 0 ? (
          <div className="story-empty story-empty--tea">
            <strong>No Tea has been published yet.</strong>
            <span>The page is open for the first anonymous submission.</span>
          </div>
        ) : (
          <ol className="tea-preview-grid">
            {teaPosts.map((post) => (
              <li key={post.id}>
                <article className="tea-preview">
                  <div className="tea-preview__meta">
                    <span>Anonymous · reviewed by the Press Club</span>
                    {post.published_at && <time dateTime={post.published_at}>{formatStoryDate(post.published_at)}</time>}
                  </div>
                  <h3>{post.edited_title}</h3>
                  <p>{previewStoryText(post.edited_body)}</p>
                </article>
              </li>
            ))}
          </ol>
        )}

        <Link className="story-stream__cta" href="/Tea">
          Read or submit Tea <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}

