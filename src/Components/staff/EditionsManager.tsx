"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { buildManifest, pageFileName, renderPdfPages } from "@/lib/edition-pages-browser";
import { formatNNNMonth } from "@/lib/nnn-title";

type Entelechy = { id: number; edition: number; pdf_url: string; created_at: string };
type NNN = { id: number; Month: number; Year: number; Pdf_url: string; created_at: string };

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

function friendly(error: { code?: string; message?: string }, what: string) {
  if (error.code === "23505") return `${what} is already in the archive.`;
  if (error.code === "42501" || /row-level security|unauthorized|not allowed/i.test(error.message ?? "")) {
    return "Only editors and the convenor can add or remove editions.";
  }
  return "That didn't work. Check your connection and try again.";
}

export default function EditionsManager({
  entelechy,
  nnn,
  canEdit,
}: {
  entelechy: Entelechy[];
  nnn: NNN[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const now = new Date();
  const [kind, setKind] = useState<"Entelechy" | "NNN">("Entelechy");
  const [editionNumber, setEditionNumber] = useState(String((entelechy[0]?.edition ?? 0) + 1));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [file, setFile] = useState<File | null>(null);
  const [makePages, setMakePages] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!file) return setError("Choose the edition's PDF.");
    if (file.type !== "application/pdf") return setError("The file must be a PDF.");
    if (file.size > MAX_PDF_BYTES) return setError("The PDF is larger than 50 MB. Export a smaller version and try again.");

    const supabase = getBrowserSupabase();
    const stamp = Date.now();
    // Set once the edition's row exists, so the list refreshes even if a later
    // step (the page images) fails.
    let added = false;
    setBusy(true);

    try {
      if (kind === "Entelechy") {
        const number = Number(editionNumber);
        if (!Number.isInteger(number) || number < 1) throw new Error("Enter the edition number, for example 5.");
        const path = `edition-${number}-${stamp}.pdf`;

        setProgress("Uploading the PDF…");
        const upload = await supabase.storage.from("Entelechy").upload(path, file, { contentType: "application/pdf" });
        if (upload.error) throw new Error(friendly(upload.error, `Edition ${number}`));

        const row = await supabase.from("Entelechy").insert({ edition: number, pdf_url: path }).select("id").single();
        if (row.error || !row.data) {
          await supabase.storage.from("Entelechy").remove([path]);
          throw new Error(friendly(row.error ?? {}, `Edition ${number}`));
        }
        added = true;
        setEditionNumber(String(number + 1));

        if (makePages) {
          const pages = await renderPdfPages(file, (done, total) => setProgress(`Making page images: ${done} of ${total}…`));
          const folder = `Entelechy/${row.data.id}`;
          for (const page of pages) {
            setProgress(`Uploading page ${page.number} of ${pages.length}…`);
            for (const [width, blob] of Object.entries(page.blobs)) {
              const put = await supabase.storage.from("edition-pages")
                .upload(`${folder}/${pageFileName(page.number, Number(width))}`, blob, { contentType: "image/webp", upsert: true });
              if (put.error) throw new Error("The edition was added, but its page images didn't upload. It will open in the PDF reader for now.");
            }
          }
          const manifest = new Blob([JSON.stringify(buildManifest(pages), null, 2)], { type: "application/json" });
          const put = await supabase.storage.from("edition-pages").upload(`${folder}/manifest.json`, manifest, { contentType: "application/json", upsert: true });
          if (put.error) throw new Error("The edition was added, but its page images didn't upload. It will open in the PDF reader for now.");
        }
        setNotice(`Edition ${number} is in the archive. It appears on the site within 5 minutes.`);
      } else {
        const monthNumber = Number(month);
        const yearNumber = Number(year);
        if (!Number.isInteger(yearNumber) || yearNumber < 2000 || yearNumber > 2200) throw new Error("Enter the year, for example 2026.");
        const label = `${formatNNNMonth(monthNumber)} ${yearNumber}`;
        const path = `nnn-${yearNumber}-${String(monthNumber).padStart(2, "0")}-${stamp}.pdf`;

        setProgress("Uploading the PDF…");
        const upload = await supabase.storage.from("NNN").upload(path, file, { contentType: "application/pdf" });
        if (upload.error) throw new Error(friendly(upload.error, label));

        const row = await supabase.from("NNN").insert({ Month: monthNumber, Year: yearNumber, Pdf_url: path }).select("id").single();
        if (row.error || !row.data) {
          await supabase.storage.from("NNN").remove([path]);
          throw new Error(friendly(row.error ?? {}, label));
        }
        added = true;
        setNotice(`${label} is listed. DAU readers can request it by email within 5 minutes.`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
      setProgress("");
      if (added) {
        setFile(null);
        (event.target as HTMLFormElement).reset();
        router.refresh();
      }
    }
  }

  async function removeEntelechy(edition: Entelechy) {
    const supabase = getBrowserSupabase();
    setBusy(true);
    const { error: deleteError, count } = await supabase.from("Entelechy").delete({ count: "exact" }).eq("id", edition.id);
    if (deleteError || count === 0) {
      setBusy(false);
      return setError(friendly(deleteError ?? { code: "42501" }, `Edition ${edition.edition}`));
    }
    await supabase.storage.from("Entelechy").remove([edition.pdf_url]);
    const listed = await supabase.storage.from("edition-pages").list(`Entelechy/${edition.id}`, { limit: 1000 });
    if (listed.data?.length) {
      await supabase.storage.from("edition-pages").remove(listed.data.map((item: { name: string }) => `Entelechy/${edition.id}/${item.name}`));
    }
    setBusy(false);
    setConfirming(null);
    setNotice(`Edition ${edition.edition} was removed.`);
    router.refresh();
  }

  async function removeNNN(edition: NNN) {
    const supabase = getBrowserSupabase();
    setBusy(true);
    const label = `${formatNNNMonth(edition.Month)} ${edition.Year}`;
    const { error: deleteError, count } = await supabase.from("NNN").delete({ count: "exact" }).eq("id", edition.id);
    if (deleteError || count === 0) {
      setBusy(false);
      return setError(friendly(deleteError ?? { code: "42501" }, label));
    }
    await supabase.storage.from("NNN").remove([edition.Pdf_url]);
    setBusy(false);
    setConfirming(null);
    setNotice(`${label} was removed.`);
    router.refresh();
  }

  function RemoveControl({ id, onConfirm, label }: { id: string; onConfirm: () => void; label: string }) {
    if (!canEdit) return null;
    return confirming === id ? (
      <span className="post-editor__confirm">
        Remove {label}?
        <button type="button" className="staff-button staff-button--danger" disabled={busy} onClick={onConfirm}>Yes, remove</button>
        <button type="button" className="staff-button" onClick={() => setConfirming(null)}>Keep</button>
      </span>
    ) : (
      <button type="button" className="staff-link-button" onClick={() => setConfirming(id)}>Remove</button>
    );
  }

  return (
    <div className="editions-manager">
      {canEdit ? (
        <form className="staff-card" onSubmit={add}>
          <h2>Add an edition</h2>
          <fieldset disabled={busy}>
            <div className="staff-choice" role="radiogroup" aria-label="Publication">
              <label><input type="radio" name="kind" checked={kind === "Entelechy"} onChange={() => setKind("Entelechy")} /> Entelechy</label>
              <label><input type="radio" name="kind" checked={kind === "NNN"} onChange={() => setKind("NNN")} /> NNN</label>
            </div>

            {kind === "Entelechy" ? (
              <>
                <label htmlFor="edition-number">Edition number</label>
                <input id="edition-number" type="number" min={1} value={editionNumber} onChange={(event) => setEditionNumber(event.target.value)} required />
              </>
            ) : (
              <div className="staff-row">
                <div>
                  <label htmlFor="nnn-month">Month</label>
                  <select id="nnn-month" value={month} onChange={(event) => setMonth(event.target.value)}>
                    {MONTHS.map((value) => <option key={value} value={value}>{formatNNNMonth(value)}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="nnn-year">Year</label>
                  <input id="nnn-year" type="number" min={2000} max={2200} value={year} onChange={(event) => setYear(event.target.value)} required />
                </div>
              </div>
            )}

            <label htmlFor="edition-file">PDF <span>(up to 50 MB)</span></label>
            <input id="edition-file" type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />

            {kind === "Entelechy" ? (
              <label className="staff-check">
                <input type="checkbox" checked={makePages} onChange={(event) => setMakePages(event.target.checked)} />
                Make page images for the smooth scrolling reader (recommended; takes about a second per page)
              </label>
            ) : (
              <p className="staff-hint">NNN stays private. It is never shown on the site; DAU readers request it and receive the PDF by email.</p>
            )}

            <button type="submit" className="staff-button staff-button--primary">{busy ? "Working…" : `Add ${kind} edition`}</button>
          </fieldset>
          <p className="post-editor__messages" role="status" aria-live="polite">
            {progress && <span>{progress}</span>}
            {notice && <span className="staff-notice">{notice}</span>}
            {error && <span className="staff-error">{error}</span>}
          </p>
        </form>
      ) : (
        <p className="staff-hint">Editors and the convenor add editions. Ask one of them if an issue is ready.</p>
      )}

      <section className="staff-group" aria-labelledby="ent-list">
        <h2 id="ent-list">Entelechy <span>{entelechy.length}</span></h2>
        {entelechy.length === 0 ? <p className="staff-empty">No editions yet.</p> : (
          <ul className="staff-list">
            {entelechy.map((edition) => (
              <li key={edition.id}>
                <a href={`/Entelechy/${edition.id}`} target="_blank" rel="noreferrer">
                  <strong>Edition {edition.edition}</strong>
                  <span>Added {new Date(edition.created_at).toLocaleDateString("en-IN")}</span>
                </a>
                <RemoveControl id={`e-${edition.id}`} label={`Edition ${edition.edition}`} onConfirm={() => removeEntelechy(edition)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="staff-group" aria-labelledby="nnn-list">
        <h2 id="nnn-list">NNN <span>{nnn.length}</span></h2>
        {nnn.length === 0 ? <p className="staff-empty">No issues yet.</p> : (
          <ul className="staff-list">
            {nnn.map((edition) => (
              <li key={edition.id}>
                <a href={`/NNN/${edition.id}`} target="_blank" rel="noreferrer">
                  <strong>{formatNNNMonth(edition.Month)} {edition.Year}</strong>
                  <span>Added {new Date(edition.created_at).toLocaleDateString("en-IN")} · email only</span>
                </a>
                <RemoveControl id={`n-${edition.id}`} label={`${formatNNNMonth(edition.Month)} ${edition.Year}`} onConfirm={() => removeNNN(edition)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
