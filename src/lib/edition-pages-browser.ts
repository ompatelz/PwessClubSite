"use client";

// Makes the scrolling reader's page images in the editor's own browser, using the
// same sizes and manifest format as scripts/edition-pages.mjs, so nobody needs a
// laptop with the project installed to publish an Entelechy edition.

export const BROWSER_PAGE_WIDTHS = [800, 1400];
const WEBP_QUALITY = 0.82;

export type RenderedPage = { number: number; width: number; height: number; blobs: Record<number, Blob> };

function canvasToWebp(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode page"))), "image/webp", WEBP_QUALITY);
  });
}

export async function renderPdfPages(
  file: File,
  onProgress: (done: number, total: number) => void,
): Promise<RenderedPage[]> {
  const { pdfjs } = await import("react-pdf");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await task.promise;
  const pages: RenderedPage[] = [];
  try {
    for (let number = 1; number <= pdf.numPages; number += 1) {
      onProgress(number - 1, pdf.numPages);
      const page = await pdf.getPage(number);
      const base = page.getViewport({ scale: 1 });
      const blobs: Record<number, Blob> = {};
      let size = { width: 0, height: 0 };
      for (const width of BROWSER_PAGE_WIDTHS) {
        const viewport = page.getViewport({ scale: width / base.width });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("This browser cannot draw pages");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        blobs[width] = await canvasToWebp(canvas);
        size = { width: canvas.width, height: canvas.height };
      }
      pages.push({ number, ...size, blobs });
      page.cleanup();
    }
    onProgress(pdf.numPages, pdf.numPages);
    return pages;
  } finally {
    await task.destroy();
  }
}

export function pageFileName(number: number, width: number) {
  return `page-${String(number).padStart(3, "0")}-${width}.webp`;
}

export function buildManifest(pages: RenderedPage[]) {
  return {
    version: 1,
    pageCount: pages.length,
    widths: BROWSER_PAGE_WIDTHS,
    pages: pages.map((page) => ({
      width: page.width,
      height: page.height,
      files: Object.fromEntries(BROWSER_PAGE_WIDTHS.map((width) => [width, pageFileName(page.number, width)])),
    })),
  };
}
