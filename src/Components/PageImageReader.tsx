"use client";

import { useEffect, useRef, useState } from "react";
import type { EditionPage } from "@/lib/edition-pages-manifest";

type PageImageReaderProps = {
  pages: EditionPage[];
  pdfUrl: string;
  title: string;
};

// A continuous column of pre-rendered page images. The browser scrolls, zooms and
// lazy-loads them natively, so there is no PDF engine to download or wait for.
export default function PageImageReader({ pages, pdfUrl, title }: PageImageReaderProps) {
  const [current, setCurrent] = useState(1);
  const figures = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    // The page being read is the last one whose top has passed 40% of the screen.
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      let reading = 1;
      figures.current.forEach((figure, index) => {
        if (figure && figure.getBoundingClientRect().top <= line) reading = index + 1;
      });
      setCurrent(reading);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pages]);

  function scrollToFigure(figure: HTMLElement | null | undefined) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    figure?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  function goToPrevious() {
    scrollToFigure(figures.current[Math.max(current - 2, 0)]);
  }

  function goToNext() {
    // The first page whose top is still below the sticky toolbar comes next. From the
    // top of the article that is page 1, so no page is skipped.
    const toolbarLine = parseFloat(getComputedStyle(document.documentElement).fontSize) * 9 + 4;
    scrollToFigure(figures.current.find((figure) => figure && figure.getBoundingClientRect().top > toolbarLine));
  }

  return (
    <section className="pdf-reader page-reader" aria-label={`${title} reader`}>
      <div className="pdf-toolbar page-reader__toolbar" aria-label="Reader controls">
        <div className="pdf-toolbar__group" aria-label="Page controls">
          <button type="button" onClick={goToPrevious} disabled={current <= 1}>
            Previous
          </button>
          <output className="pdf-page-status" aria-live="polite">
            Page {current} of {pages.length}
          </output>
          <button type="button" onClick={goToNext} disabled={current >= pages.length}>
            Next
          </button>
        </div>
        <a className="pdf-original-link" href={pdfUrl} target="_blank" rel="noreferrer">
          Open original PDF
        </a>
      </div>

      <div className="page-reader__pages">
        {pages.map((page, index) => (
          <figure
            key={page.src}
            id={`page-${page.number}`}
            data-page={page.number}
            ref={(element) => { figures.current[index] = element; }}
            className="page-reader__page"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP files from storage; next/image would re-encode them */}
            <img
              src={page.src}
              srcSet={page.srcSet}
              sizes="(min-width: 64rem) 60rem, 100vw"
              width={page.width}
              height={page.height}
              alt={`${title}, page ${page.number} of ${pages.length}`}
              loading={index < 2 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding="async"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
