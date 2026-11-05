import { RISO_BLACK, RISO_RED, SHARE_CARD_SIZE, renderShareCard } from "@/lib/share-card";

export const alt = "The Press Club blog: signed stories from DAU";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderShareCard({
    kicker: "Press Club blog",
    title: "Signed stories between editions",
    mark: "¶",
    ink: RISO_BLACK,
    overprint: RISO_RED,
  });
}
