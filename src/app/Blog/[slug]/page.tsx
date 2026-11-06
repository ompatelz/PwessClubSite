import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatStoryDate } from "@/lib/stories";
import { getPublishedArticle as getArticle } from "@/lib/blog";
import { shareMetadata } from "@/lib/share";
import ShareLinks from "@/Components/ShareLinks";

export const dynamic = "force-dynamic";

type BlogArticleProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogArticleProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article not found" };

  return shareMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/Blog/${article.slug}`,
    publishedTime: article.published_at,
    authors: [article.author],
  });
}

export default async function BlogArticlePage({ params }: BlogArticleProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const paragraphs = article.body.split(/\r?\n\s*\r?\n/).filter(Boolean);

  return (
    <main id="main-content" className="site-main story-reader">
      <div className="read-progress read-progress--blog" aria-hidden="true" />
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
          <ShareLinks title={article.title} path={`/Blog/${article.slug}`} />
        </header>
        <div className="story-reader__body">
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      </article>
    </main>
  );
}

