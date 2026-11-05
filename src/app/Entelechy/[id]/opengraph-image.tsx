import { getEntelechyEdition } from "@/lib/publications";
import { RISO_BLUE, RISO_RED, SHARE_CARD_SIZE, renderShareCard } from "@/lib/share-card";

export const alt = "Share card for an Entelechy edition";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getEntelechyEdition(id);

  return renderShareCard({
    kicker: "Entelechy · flagship magazine",
    title: result.status === "found" ? `Edition ${result.edition.edition}` : "Entelechy",
    detail: "Read the full edition online",
    mark: "E",
    ink: RISO_BLUE,
    overprint: RISO_RED,
  });
}
