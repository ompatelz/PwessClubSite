"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { makeImagesForEdition } from "@/lib/edition-pages-upload";

type Missing = { id: number; edition: number; pdf_url: string };

// Shared across desk pages: the header (and this banner) is drawn again on every
// tab, so editions already being worked on are not started a second time.
const inProgress = new Set<number>();

// When an editor opens the desk and some Entelechy edition has no page images
// (older uploads, or an upload that was interrupted), this makes them in the
// background, one edition at a time, and shows its progress in a slim banner.
export default function PageImagesAutopilot({ editions }: { editions: Missing[] }) {
  const router = useRouter();
  const started = useRef(false);
  const [status, setStatus] = useState<"working" | "done" | "failed">("working");
  // If another desk page already started on these editions, just say so.
  const [message, setMessage] = useState(() =>
    editions.length > 0 && editions.every((edition) => inProgress.has(edition.id))
      ? "Page images are still being made in the background…"
      : "",
  );

  useEffect(() => {
    if (started.current || editions.length === 0) return;
    started.current = true;
    const todo = editions.filter((edition) => !inProgress.has(edition.id));
    if (todo.length === 0) return;
    todo.forEach((edition) => inProgress.add(edition.id));

    // Leaving mid-way is safe (the next visit simply starts again), but warn anyway.
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);

    (async () => {
      const supabase = getBrowserSupabase();
      let failed = false;
      for (const edition of todo) {
        try {
          await makeImagesForEdition(supabase, edition, (step) => setMessage(`Making page images for Edition ${edition.edition}: ${step}…`));
        } catch {
          failed = true;
        } finally {
          inProgress.delete(edition.id);
        }
      }
      window.removeEventListener("beforeunload", warn);
      setStatus(failed ? "failed" : "done");
      setMessage(failed
        ? "Some page images didn't finish. They'll be tried again next time the desk is opened."
        : `Page images are ready for ${todo.map((edition) => `Edition ${edition.edition}`).join(", ")}. The smooth reader appears on the site within 5 minutes.`);
      router.refresh();
    })();

    return () => window.removeEventListener("beforeunload", warn);
  }, [editions, router]);

  if (editions.length === 0) return null;

  return (
    <p className={`page-images-autopilot page-images-autopilot--${status}`} role="status" aria-live="polite">
      {message || "Preparing page images for the smooth reader…"}
      {status === "working" && <span> Keep this tab open.</span>}
    </p>
  );
}
