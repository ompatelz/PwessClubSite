import { RISO_BLUE, RISO_RED, SHARE_CARD_SIZE, renderShareCard } from "@/lib/share-card";

export const alt = "News and Nonsense, the Press Club's newspaper at DAU";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderShareCard({
    kicker: "The college newspaper",
    title: "News and Nonsense",
    detail: "Every NNN edition in one place",
    mark: "N",
    ink: RISO_RED,
    overprint: RISO_BLUE,
  });
}
