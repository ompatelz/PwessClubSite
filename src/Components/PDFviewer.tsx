"use client";

import { Suspense, useEffect, useRef, useState, useTransition } from "react";
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
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [readerWidth, setReaderWidth] = useState(0);
  // react-pdf loads pages through Suspense. Turning a page inside a transition keeps
  // the current page on screen until the next one is ready, instead of hiding the reader.
  const [isTurning, startTurning] = useTransition();
  const stageRef = useRef<HTMLDivElement>(null);
  const minZoom = 0.75;
  const maxZoom = 1.75;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateWidth = () => setReaderWidth(Math.max(240, Math.min(stage.clientWidth - 32, 960)));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  function changePage(step: number) {
    // Step from the latest queued page, so quick repeated clicks each count.
    startTurning(() => setPageNumber((current) => Math.min(Math.max(current + step, 1), numPages)));
    stageRef.current?.scrollTo({ top: 0, left: 0 });
  }

  function changeZoom(step: number | "fit") {
    startTurning(() => setZoom((current) => (
      step === "fit" ? 1 : Math.min(maxZoom, Math.max(minZoom, current + step))
    )));
  }

  return (
    <section className="pdf-reader" aria-label="Publication reader">
      <div className="pdf-toolbar" aria-label="Reader controls">
        <div className="pdf-toolbar__group" aria-label="Page controls">
          <button type="button" onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
            Previous
          </button>
          <output className="pdf-page-status" aria-live="polite">
            {numPages ? `Page ${pageNumber} of ${numPages}` : "Loading pages"}
          </output>
          <button type="button" onClick={() => changePage(1)} disabled={!numPages || pageNumber >= numPages}>
            Next
          </button>
        </div>

        <div className="pdf-toolbar__group" aria-label="Zoom controls">
          <button type="button" onClick={() => changeZoom(-0.25)}
            disabled={zoom <= minZoom}>
            Zoom out
          </button>
          <output aria-live="polite">{Math.round(zoom * 100)}%</output>
          <button type="button" onClick={() => changeZoom(0.25)}
            disabled={zoom >= maxZoom}>
            Zoom in
          </button>
          <button type="button" onClick={() => changeZoom("fit")} disabled={zoom === 1} aria-pressed={zoom === 1}>
            Fit width
          </button>
        </div>

        <a className="pdf-original-link" href={url} target="_blank" rel="noreferrer">
          Open original PDF
        </a>
      </div>

      <div className="pdf-stage" ref={stageRef} aria-busy={isTurning}>
        <Document
          file={url}
          onLoadSuccess={({ numPages: loadedPages }) => {
            // react-pdf can report success again after a Suspense re-show, so keep the
            // reader's current page instead of sending it back to page 1.
            setNumPages(loadedPages);
            setPageNumber((current) => Math.min(Math.max(current, 1), loadedPages));
          }}
          onLoadError={(error) => console.error("PDF load error:", error)}
          loading={<p className="pdf-status">Loading publication…</p>}
          error={
            <div className="pdf-status pdf-status--error" role="alert">
              <p>The publication could not be loaded in the reader.</p>
              <a href={url} target="_blank" rel="noreferrer">Open the original PDF instead</a>
            </div>
          }
        >
          <Suspense fallback={<p className="pdf-status">Rendering page {pageNumber}…</p>}>
            <Page
              pageNumber={pageNumber}
              width={readerWidth ? Math.round(readerWidth * zoom) : undefined}
              className="pdf-page"
              loading={<p className="pdf-status">Rendering page {pageNumber}…</p>}
              error={<p className="pdf-status pdf-status--error">This page could not be rendered.</p>}
            />
          </Suspense>
        </Document>
      </div>
    </section>
  );
}
