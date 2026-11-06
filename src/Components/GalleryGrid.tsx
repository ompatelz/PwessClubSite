"use client";

import { useEffect, useRef, useState } from "react";

export type GridPhoto = {
  id: number;
  thumb: string;
  full: string;
  width: number;
  height: number;
  people: string | null;
  caption: string | null;
  batch: string;
};

function describe(photo: GridPhoto) {
  return photo.caption || photo.people || `Press Club, ${photo.batch}`;
}

// A batch's photos as a grid. Selecting one opens it larger in a dialog;
// arrow keys move between photos and Escape closes it.
export default function GalleryGrid({ photos }: { photos: GridPhoto[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const current = open === null ? null : photos[open];

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open !== null && !element.open) element.showModal();
    if (open === null && element.open) element.close();
  }, [open]);

  function step(delta: number) {
    setOpen((index) => (index === null ? null : (index + delta + photos.length) % photos.length));
  }

  return (
    <>
      <ul className="gallery-grid">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button type="button" className="gallery-grid__item" onClick={() => setOpen(index)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase storage images, already resized */}
              <img src={photo.thumb} alt={describe(photo)} width={photo.width} height={photo.height} loading="lazy" decoding="async" />
            </button>
            {(photo.people || photo.caption) && (
              <p className="gallery-grid__caption">
                {photo.people && <strong>{photo.people}</strong>}
                {photo.caption && <span>{photo.caption}</span>}
              </p>
            )}
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className="gallery-viewer"
        aria-label={current ? describe(current) : "Photo"}
        onClose={() => setOpen(null)}
        onClick={(event) => { if (event.target === event.currentTarget) setOpen(null); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
      >
        {current && (
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element -- Supabase storage images, already resized */}
            <img src={current.full} alt={describe(current)} width={current.width} height={current.height} />
            <figcaption>
              {current.people && <strong>{current.people}</strong>}
              {current.caption && <span>{current.caption}</span>}
              <span className="gallery-viewer__count">{(open ?? 0) + 1} of {photos.length} · {current.batch}</span>
            </figcaption>
          </figure>
        )}
        <div className="gallery-viewer__controls">
          {photos.length > 1 && (
            <>
              <button type="button" onClick={() => step(-1)}>← Previous</button>
              <button type="button" onClick={() => step(1)}>Next →</button>
            </>
          )}
          <button type="button" onClick={() => setOpen(null)} autoFocus>Close</button>
        </div>
      </dialog>
    </>
  );
}
