import { getNNNEdition, nnnEditionTitle } from "@/lib/publications";
import { RISO_BLUE, RISO_RED, SHARE_CARD_SIZE, renderShareCard } from "@/lib/share-card";

export const alt = "Share card for an NNN edition";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getNNNEdition(id);

  return renderShareCard({
    kicker: "News and Nonsense",
    title: result.status === "found" ? nnnEditionTitle(result.edition) : "NNN",
    detail: "Read the full edition online",
    mark: "N",
    ink: RISO_RED,
    overprint: RISO_BLUE,
  });
}
