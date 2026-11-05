"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type ShareLinksProps = {
  title: string;
  path: string;
};

type CopyState = "idle" | "copied" | "failed";

// Browser-only values read without a mount effect; the server render uses the fallbacks.
const noSubscription = () => () => {};
const readOrigin = () => window.location.origin;
const readCanShare = () => typeof navigator.share === "function";

export default function ShareLinks({ title, path }: ShareLinksProps) {
  const origin = useSyncExternalStore(noSubscription, readOrigin, () => "");
  const canShare = useSyncExternalStore(noSubscription, readCanShare, () => false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  // The full address is only known in the browser (preview, production or a custom domain).
  const url = origin ? new URL(path, origin).toString() : path;

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  async function shareNatively() {
    try {
      await navigator.share({ title, url });
    } catch {
      // The reader closed the share sheet; nothing to report.
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;

  return (
    <div className="share-links" role="group" aria-label="Share">
      {canShare && (
        <button type="button" className="share-links__button share-links__button--primary" onClick={shareNatively}>
          Share
        </button>
      )}
      <a className="share-links__button" href={whatsappHref} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      <button type="button" className="share-links__button" onClick={copyLink}>
        Copy link
      </button>
      <span className="share-links__status" role="status" aria-live="polite">
        {copyState === "copied" && "Link copied"}
        {copyState === "failed" && "Copy failed. Copy the address from the browser bar instead."}
      </span>
    </div>
  );
}
