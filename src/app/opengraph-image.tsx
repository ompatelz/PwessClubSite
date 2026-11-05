import { RISO_BLUE, RISO_RED, SHARE_CARD_SIZE, renderShareCard } from "@/lib/share-card";

export const alt = "The Press Club at DAU: Entelechy, NNN and the blog";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderShareCard({
    kicker: "The Press Club at DAU",
    title: "A campus, read at every speed.",
    detail: "Entelechy, NNN and signed stories",
    mark: "PC",
    ink: RISO_BLUE,
    overprint: RISO_RED,
  });
}
