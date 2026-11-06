"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { GalleryBatch, GalleryPhoto } from "@/lib/gallery";

const FULL_WIDTH = 1600;
const THUMB_WIDTH = 640;
const MAX_FILES = 20;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

type Sized = { full: Blob; thumb: Blob; width: number; height: number };

function toWebp(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/webp", quality);
  });
}

// Shrinks a photo to a 1600px viewing copy and a 640px grid copy, both WebP, in
// the browser. Phones' 12 MB photos become a few hundred KB before upload.
async function resize(file: File): Promise<Sized> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const draw = (targetWidth: number) => {
      const scale = Math.min(1, targetWidth / bitmap.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return canvas;
    };
    const fullCanvas = draw(FULL_WIDTH);
    const full = await toWebp(fullCanvas, 0.84);
    const thumb = await toWebp(draw(THUMB_WIDTH), 0.8);
    return { full, thumb, width: fullCanvas.width, height: fullCanvas.height };
  } finally {
    bitmap.close();
  }
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "batch";
}

function friendly(error: { code?: string; message?: string; statusCode?: string }) {
  if (error.code === "42501" || error.statusCode === "403" || /row-level security|unauthorized/i.test(error.message ?? "")) {
    return "Only editors and the convenor can change the gallery.";
  }
  if (error.code === "23514") return "Check the batch name (2 to 40 characters) and keep captions short.";
  return "That didn't work. Check your connection and try again.";
}

export default function GalleryManager({
  batches,
  urls,
  canEdit,
}: {
  batches: GalleryBatch[];
  urls: Record<number, string>;
  canEdit: boolean;
}) {
  const router = useRouter();
  const knownBatches = useMemo(() => batches.map((group) => group.batch), [batches]);
  const [batch, setBatch] = useState(knownBatches[0] ?? "");
  const [people, setPeople] = useState("");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const cleanBatch = batch.trim().replace(/\s+/g, " ");
    if (cleanBatch.length < 2) return setError("Name the batch, for example 2024–25.");
    if (files.length === 0) return setError("Choose at least one photo.");
    if (files.length > MAX_FILES) return setError(`Add up to ${MAX_FILES} photos at a time.`);
    const tooBig = files.find((file) => file.size > MAX_INPUT_BYTES);
    if (tooBig) return setError(`${tooBig.name} is larger than 25 MB.`);

    const supabase = getBrowserSupabase();
    const form = event.currentTarget;
    let added = 0;
    setBusy(true);
    try {
      for (const [index, file] of files.entries()) {
        setProgress(`Preparing photo ${index + 1} of ${files.length}…`);
        let sized: Sized;
        try {
          sized = await resize(file);
        } catch {
          throw new Error(`${file.name} couldn't be opened. Use a JPG, PNG or WebP photo (iPhone HEIC photos: export as JPG first).`);
        }
        const base = `${slug(cleanBatch)}/${Date.now()}-${index}`;
        const fullPath = `${base}-1600.webp`;
        const thumbPath = `${base}-640.webp`;

        setProgress(`Uploading photo ${index + 1} of ${files.length}…`);
        const store = supabase.storage.from("gallery");
        const fullUpload = await store.upload(fullPath, sized.full, { contentType: "image/webp" });
        if (fullUpload.error) throw new Error(friendly(fullUpload.error));
        const thumbUpload = await store.upload(thumbPath, sized.thumb, { contentType: "image/webp" });
        if (thumbUpload.error) {
          await store.remove([fullPath]);
          throw new Error(friendly(thumbUpload.error));
        }

        const row = await supabase.from("gallery_photos").insert({
          batch: cleanBatch,
          people: people.trim() || null,
          caption: caption.trim() || null,
          image_path: fullPath,
          thumb_path: thumbPath,
          width: sized.width,
          height: sized.height,
        });
        if (row.error) {
          await store.remove([fullPath, thumbPath]);
          throw new Error(friendly(row.error));
        }
        added += 1;
      }
      setNotice(`${added} ${added === 1 ? "photo" : "photos"} added to ${cleanBatch}. The public page updates within 5 minutes.`);
      setPeople("");
      setCaption("");
      setFiles([]);
      form.reset();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "That didn't work.";
      setError(added ? `${added} added, then: ${message}` : message);
    } finally {
      setBusy(false);
      setProgress("");
      if (added) router.refresh();
    }
  }

  async function saveDetails(photo: GalleryPhoto, form: HTMLFormElement) {
    const data = new FormData(form);
    const next = {
      batch: String(data.get("batch") ?? "").trim(),
      people: String(data.get("people") ?? "").trim() || null,
      caption: String(data.get("caption") ?? "").trim() || null,
    };
    if (next.batch.length < 2) return setError("Name the batch, for example 2024–25.");
    setBusy(true);
    setError("");
    const { error: saveError, count } = await getBrowserSupabase()
      .from("gallery_photos").update(next, { count: "exact" }).eq("id", photo.id);
    setBusy(false);
    if (saveError || count === 0) return setError(friendly(saveError ?? { code: "42501" }));
    setEditing(null);
    setNotice("Photo details saved.");
    router.refresh();
  }

  async function remove(photo: GalleryPhoto) {
    const supabase = getBrowserSupabase();
    setBusy(true);
    setError("");
    const { error: deleteError, count } = await supabase.from("gallery_photos").delete({ count: "exact" }).eq("id", photo.id);
    if (deleteError || count === 0) {
      setBusy(false);
      return setError(friendly(deleteError ?? { code: "42501" }));
    }
    await supabase.storage.from("gallery").remove([photo.image_path, photo.thumb_path]);
    setBusy(false);
    setConfirming(null);
    setNotice("Photo removed.");
    router.refresh();
  }

  return (
    <div className="gallery-manager">
      {canEdit ? (
        <form className="staff-card" onSubmit={upload}>
          <h2>Add batch photos</h2>
          <fieldset disabled={busy}>
            <label htmlFor="gallery-batch">Batch</label>
            <input id="gallery-batch" list="gallery-batch-list" value={batch} onChange={(event) => setBatch(event.target.value)} placeholder="2024–25" maxLength={40} required />
            <datalist id="gallery-batch-list">
              {knownBatches.map((name) => <option key={name} value={name} />)}
            </datalist>
            <p className="staff-hint">Use the academic year, like 2024–25, so batches sort newest first.</p>

            <label htmlFor="gallery-people">Who is in the photo <span>(optional)</span></label>
            <input id="gallery-people" value={people} onChange={(event) => setPeople(event.target.value)} maxLength={400} placeholder="Names, left to right" />

            <label htmlFor="gallery-caption">Caption <span>(optional)</span></label>
            <input id="gallery-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={300} placeholder="Editorial team, Entelechy 6 launch" />

            <label htmlFor="gallery-files">Photos <span>(up to {MAX_FILES} at a time)</span></label>
            <input id="gallery-files" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles([...(event.target.files ?? [])])} required />
            <p className="staff-hint">Photos are resized on this device before upload. The same names and caption apply to every photo in this upload; you can edit each one afterwards.</p>

            <button type="submit" className="staff-button staff-button--primary">{busy ? "Working…" : files.length > 1 ? `Add ${files.length} photos` : "Add photo"}</button>
          </fieldset>
        </form>
      ) : (
        <p className="staff-hint">Editors and the convenor add gallery photos.</p>
      )}

      <div className="gallery-manager__photos">
      <p className="post-editor__messages" role="status" aria-live="polite">
        {progress && <span>{progress}</span>}
        {notice && <span className="staff-notice">{notice}</span>}
        {error && <span className="staff-error">{error}</span>}
      </p>

      {batches.length === 0 ? (
        <p className="staff-empty">No photos yet. They appear on the public Past members page.</p>
      ) : batches.map((group) => (
        <section key={group.batch} className="staff-group" aria-label={`Batch ${group.batch}`}>
          <h2>{group.batch} <span>{group.photos.length}</span></h2>
          <ul className="gallery-manager__list">
            {group.photos.map((photo) => (
              <li key={photo.id}>
                {/* eslint-disable-next-line @next/next/no-img-element -- Supabase storage thumbnail */}
                <img src={urls[photo.id]} alt={photo.caption || photo.people || `Batch ${photo.batch}`} width={photo.width} height={photo.height} loading="lazy" />
                {editing === photo.id ? (
                  <form className="gallery-manager__edit" onSubmit={(event) => { event.preventDefault(); saveDetails(photo, event.currentTarget); }}>
                    <fieldset disabled={busy}>
                      <label htmlFor={`batch-${photo.id}`}>Batch</label>
                      <input id={`batch-${photo.id}`} name="batch" defaultValue={photo.batch} list="gallery-batch-list" maxLength={40} required />
                      <label htmlFor={`people-${photo.id}`}>Who is in the photo</label>
                      <input id={`people-${photo.id}`} name="people" defaultValue={photo.people ?? ""} maxLength={400} />
                      <label htmlFor={`caption-${photo.id}`}>Caption</label>
                      <input id={`caption-${photo.id}`} name="caption" defaultValue={photo.caption ?? ""} maxLength={300} />
                      <span className="post-editor__actions">
                        <button type="submit" className="staff-button staff-button--primary">Save</button>
                        <button type="button" className="staff-button" onClick={() => setEditing(null)}>Cancel</button>
                      </span>
                    </fieldset>
                  </form>
                ) : (
                  <div className="gallery-manager__details">
                    <strong>{photo.people || "No names yet"}</strong>
                    <span>{photo.caption || "No caption"}</span>
                    {canEdit && (
                      <span className="gallery-manager__actions">
                        <button type="button" className="staff-link-button" onClick={() => { setEditing(photo.id); setConfirming(null); }}>Edit</button>
                        {confirming === photo.id ? (
                          <span className="post-editor__confirm">
                            Remove?
                            <button type="button" className="staff-button staff-button--danger" disabled={busy} onClick={() => remove(photo)}>Yes, remove</button>
                            <button type="button" className="staff-button" onClick={() => setConfirming(null)}>Keep</button>
                          </span>
                        ) : (
                          <button type="button" className="staff-link-button" onClick={() => setConfirming(photo.id)}>Remove</button>
                        )}
                      </span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      </div>
    </div>
  );
}
