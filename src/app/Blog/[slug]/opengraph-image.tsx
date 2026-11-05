import { getPublishedArticle } from "@/lib/blog";
import { formatStoryDate } from "@/lib/stories";
import { RISO_BLACK, RISO_RED, SHARE_CARD_SIZE, renderShareCard } from "@/lib/share-card";

export const alt = "Share card for a Press Club blog post";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);

  return renderShareCard({
    kicker: article ? `Blog · ${article.author}` : "Press Club blog",
    title: article?.title ?? "Signed stories between editions",
    detail: article ? formatStoryDate(article.published_at) : undefined,
    mark: "¶",
    ink: RISO_BLACK,
    overprint: RISO_RED,
  });
}
