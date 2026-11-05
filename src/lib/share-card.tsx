import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Share images (Open Graph) for WhatsApp, Instagram, X and similar link previews.
// Riso look: warm paper, two inks, and a large mark printed twice slightly off register.

export const SHARE_CARD_SIZE = { width: 1200, height: 630 };

// sRGB stand-ins for the oklch tokens in tokens.css (the image renderer has no oklch).
const PAPER = "#f6f0e1";
export const RISO_BLACK = "#151b27";
const MUTED = "#4f5868";
export const RISO_BLUE = "#1f5aae";
export const RISO_RED = "#d8392f";

type ShareCardInput = {
  kicker: string;
  title: string;
  detail?: string;
  mark: string;
  ink: string;
  overprint: string;
};

const fontsPromise = Promise.all([
  readFile(join(process.cwd(), "assets/og-fonts/bricolage-grotesque-latin-800-normal.woff")),
  readFile(join(process.cwd(), "assets/og-fonts/geist-sans-latin-500-normal.woff")),
]);

function titleSize(title: string) {
  if (title.length <= 16) return 112;
  if (title.length <= 32) return 88;
  if (title.length <= 60) return 68;
  return 54;
}

function clip(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export async function renderShareCard({ kicker, title, detail, mark, ink, overprint }: ShareCardInput) {
  const [display, body] = await fontsPromise;
  const safeTitle = clip(title, 110);
  const markSize = mark.length > 1 ? 230 : 520;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: PAPER, color: RISO_BLACK }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 760,
            padding: "56px 56px 48px 64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 22, height: 22, background: ink }} />
            <div style={{ fontFamily: "Geist", fontSize: 26, letterSpacing: 3, textTransform: "uppercase", color: MUTED }}>
              {kicker}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                fontFamily: "Bricolage",
                fontSize: titleSize(safeTitle),
                lineHeight: 0.98,
                letterSpacing: -2,
              }}
            >
              {safeTitle}
            </div>
            {detail && (
              <div style={{ fontFamily: "Geist", fontSize: 30, color: MUTED, lineHeight: 1.3 }}>
                {clip(detail, 90)}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, borderTop: `3px solid ${RISO_BLACK}`, paddingTop: 22 }}>
            <div style={{ fontFamily: "Bricolage", fontSize: 32 }}>The Press Club</div>
            <div style={{ fontFamily: "Geist", fontSize: 26, color: MUTED }}>Dhirubhai Ambani University</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            position: "relative",
            flex: 1,
            background: ink,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              display: "flex",
              fontFamily: "Bricolage",
              fontSize: markSize,
              lineHeight: 1,
              color: overprint,
              opacity: 0.9,
              transform: "translate(18px, 14px)",
            }}
          >
            {mark}
          </div>
          <div style={{ position: "absolute", display: "flex", fontFamily: "Bricolage", fontSize: markSize, lineHeight: 1, color: PAPER }}>
            {mark}
          </div>
        </div>
      </div>
    ),
    {
      ...SHARE_CARD_SIZE,
      fonts: [
        { name: "Bricolage", data: display, weight: 800, style: "normal" },
        { name: "Geist", data: body, weight: 500, style: "normal" },
      ],
    },
  );
}
