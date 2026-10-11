"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function PDFviewer(
  { url }: { url: string }
) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.2);
  const minScale = 0.6;
  const maxScale = 2;

  return (
    <section className="pdf-reader" aria-label="Publication reader">
      <div className="pdf-toolbar" aria-label="Zoom controls">
        <button
          type="button"
          onClick={() => setScale((current) => Math.max(minScale, current - 0.2))}
          disabled={scale <= minScale}
          aria-label="Zoom out"
        >
          −
        </button>

        <output aria-live="polite">
          {Math.round(scale * 100)}%
        </output>

        <button
          type="button"
          onClick={() => setScale((current) => Math.min(maxScale, current + 0.2))}
          disabled={scale >= maxScale}
          aria-label="Zoom in"
        >
          +
        </button>
      </div>

      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(err) => console.error("PDF load error:", err)}
        loading={<p className="pdf-status">Loading publication…</p>}
        error={
          <p className="pdf-status pdf-status--error">
            The publication could not be loaded. Try opening it again later.
          </p>
        }
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={i + 1}
            pageNumber={i + 1}
            scale={scale}
            className="pdf-page"
          />
        ))}
      </Document>
    </section>
  );
}
