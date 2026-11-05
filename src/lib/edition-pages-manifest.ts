// Shape of the manifest.json written by `npm run edition:pages`.
// Kept free of imports so tests can load it directly.

export type EditionPage = {
  number: number;
  width: number;
  height: number;
  src: string;
  srcSet: string;
};

const MAX_PAGES = 400;

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

// Returns the pages with absolute image URLs, or null when the manifest is missing
// pieces, so the reader falls back to the PDF instead of showing broken images.
export function parseEditionPagesManifest(raw: unknown, baseUrl: string): EditionPage[] | null {
  if (!raw || typeof raw !== "object") return null;
  const manifest = raw as { version?: unknown; pages?: unknown };
  if (manifest.version !== 1 || !Array.isArray(manifest.pages)) return null;
  if (manifest.pages.length === 0 || manifest.pages.length > MAX_PAGES) return null;

  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const pages: EditionPage[] = [];

  for (const [index, entry] of manifest.pages.entries()) {
    if (!entry || typeof entry !== "object") return null;
    const { width, height, files } = entry as { width?: unknown; height?: unknown; files?: unknown };
    if (!isPositiveInteger(width) || !isPositiveInteger(height) || !files || typeof files !== "object") return null;

    const sources = Object.entries(files as Record<string, unknown>)
      .map(([size, file]) => [Number(size), file] as const)
      .filter(([size, file]) => isPositiveInteger(size) && typeof file === "string" && /^[\w.-]+\.webp$/.test(file))
      .sort(([a], [b]) => a - b) as [number, string][];
    if (sources.length === 0) return null;

    pages.push({
      number: index + 1,
      width,
      height,
      src: `${base}${sources[sources.length - 1][1]}`,
      srcSet: sources.map(([size, file]) => `${base}${file} ${size}w`).join(", "),
    });
  }

  return pages;
}
