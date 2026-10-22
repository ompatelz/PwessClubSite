"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page render failed", error.digest ?? error.name);
  }, [error]);

  return (
    <main id="main-content" className="site-main">
      <div className="story-empty" role="alert">
        <strong>This page hit a snag.</strong>
        <span>No private error details were exposed. Please try the page again.</span>
        <button type="button" className="type-link" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
