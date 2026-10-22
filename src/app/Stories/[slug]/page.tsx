import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { formatStoryDate, type BlogPost } from "@/lib/stories";

export const dynamic = "force-dynamic";

type StoryProps = {
  params: Promise<{ slug: string }>;
};

async function getStory(slug: string) {
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

export async function generateMetadata({ params }: StoryProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) return { title: "Story not found" };
  return {
    title: story.title,
    description: story.excerpt,
    alternates: { canonical: `/Stories/${story.slug}` },
    openGraph: {
      type: "article",
      title: story.title,
      description: story.excerpt,
      publishedTime: story.published_at,
      authors: [story.author],
    },
  };
}

export default async function StoryPage({ params }: StoryProps) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();

  const paragraphs = story.body.split(/\r?\n\s*\r?\n/).filter(Boolean);

  return (
    <main id="main-content" className="site-main story-reader">
      <Link className="story-reader__back" href="/Stories">
        <span aria-hidden="true">←</span> All stories
      </Link>
      <article>
        <header className="story-reader__header">
          <p className="story-reader__byline">
            <span>{story.author}</span>
            <time dateTime={story.published_at}>{formatStoryDate(story.published_at)}</time>
          </p>
          <h1>{story.title}</h1>
          <p className="story-reader__dek">{story.excerpt}</p>
        </header>
        <div className="story-reader__body">
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      </article>
    </main>
  );
}

