import { RISO_BLUE, RISO_RED, SHARE_CARD_SIZE, renderShareCard } from "@/lib/share-card";

export const alt = "Entelechy, the flagship magazine of the Press Club at DAU";
export const size = SHARE_CARD_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderShareCard({
    kicker: "Flagship magazine",
    title: "Entelechy",
    detail: "Every edition of DAU's college magazine",
    mark: "En",
    ink: RISO_BLUE,
    overprint: RISO_RED,
  });
}
