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

  return (

    <div className="flex flex-col items-center gap-4">

      {/* Zoom Controls */}

      <div className="flex items-center gap-4 sticky top-4 z-50 bg-black p-4 rounded-xl">

        <button
          onClick={() => setScale(scale - 0.2)}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-white"
        >
          -
        </button>

        <p className="text-white text-lg">
          {Math.round(scale * 100)}%
        </p>

        <button
          onClick={() => setScale(scale + 0.2)}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-white"
        >
          +
        </button>

      </div>

      {/* PDF */}

      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(err) => console.error("PDF load error:", err)}
      >

        {Array.from({ length: numPages }, (_, i) => (

          <Page
            key={i + 1}
            pageNumber={i + 1}
            scale={scale}
            className="mb-6 shadow-2xl"
          />

        ))}

      </Document>

    </div>
  );
}