import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { formatStoryDate, type BlogPost } from "@/lib/stories";

export const dynamic = "force-dynamic";

type BlogArticleProps = {
  params: Promise<{ slug: string }>;
};

async function getArticle(slug: string) {
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
}

export async function generateMetadata({ params }: BlogArticleProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article not found" };

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/Blog/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.published_at,
      authors: [article.author],
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticleProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const paragraphs = article.body.split(/\r?\n\s*\r?\n/).filter(Boolean);

  return (
    <main id="main-content" className="site-main story-reader">
      <Link className="story-reader__back" href="/Blog">
        <span aria-hidden="true">←</span> All blog posts
      </Link>
      <article>
        <header className="story-reader__header">
          <p className="story-reader__byline">
            <span>{article.author}</span>
            <time dateTime={article.published_at}>{formatStoryDate(article.published_at)}</time>
          </p>
          <h1>{article.title}</h1>
          <p className="story-reader__dek">{article.excerpt}</p>
        </header>
        <div className="story-reader__body">
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      </article>
    </main>
  );
}

