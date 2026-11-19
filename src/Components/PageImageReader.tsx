"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
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
    // The page being read is the last one whose top has passed a line 40% down the
    // screen. The browser tells us when a page crosses that line, and only then do
    // we work out the page, so nothing runs on each scroll frame. Working it out
    // from scratch also covers jumps (to the top, or to a linked page).
    const update = () => {
      const line = window.innerHeight * 0.4;
      let reading = 1;
      figures.current.forEach((figure, index) => {
        if (figure && figure.getBoundingClientRect().top <= line) reading = index + 1;
      });
      setCurrent(reading);
    };
    const observer = new IntersectionObserver(update, { rootMargin: "-40% 0px -60% 0px" });
    figures.current.forEach((figure) => figure && observer.observe(figure));

    // Backstop for big jumps the observer can miss: once scrolling settles, check
    // once. While scrolling, this only resets a timer.
    let settle = 0;
    const onScrollSettled = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(update, 120);
    };
    window.addEventListener("scroll", onScrollSettled, { passive: true });

    // Pages already loaded (from the cache, before this ran) drop their placeholder.
    figures.current.forEach((figure) => {
      const image = figure?.querySelector("img");
      if (image?.complete && image.naturalWidth) figure?.setAttribute("data-loaded", "");
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScrollSettled);
      window.clearTimeout(settle);
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
          <button type="button" className="reader-step" onClick={goToPrevious} disabled={current <= 1} aria-label="Previous page">
            <span aria-hidden="true">‹</span><span className="reader-step__word" aria-hidden="true">Previous</span>
          </button>
          <output className="pdf-page-status" aria-live="polite">
            <span className="reader-status__word">Page </span>{current}
            <span className="reader-status__word"> of </span><span className="reader-status__slash" aria-hidden="true"> / </span>{pages.length}
          </output>
          <button type="button" className="reader-step" onClick={goToNext} disabled={current >= pages.length} aria-label="Next page">
            <span className="reader-step__word" aria-hidden="true">Next</span><span aria-hidden="true">›</span>
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
            // The page's shape lets the browser reserve its height while it skips
            // drawing pages far off screen (content-visibility in polish.css).
            style={{ "--page-ratio": page.height / page.width } as CSSProperties}
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
              onLoad={(event) => event.currentTarget.parentElement?.setAttribute("data-loaded", "")}
            />
          </figure>
        ))}
      </div>
      <a className="reader-pdf-after" href={pdfUrl} target="_blank" rel="noreferrer">
        Open the original PDF <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
