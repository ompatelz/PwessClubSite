"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";

function friendly(error: { code?: string; message?: string }) {
  // The database explains name and pen-name problems in plain words.
  if (error.code === "23514" && error.message) return error.message;
  if (error.code === "42501") return "Your access is paused or was removed. Ask the convenor.";
  return "That didn't save. Check your connection and try again.";
}

// Asks a member for their name and an optional pen name. Shown on first sign-in,
// and on the "Edit profile" page whenever they want to change either.
export default function ProfileForm({
  email,
  name,
  penName,
  firstTime,
}: {
  email: string;
  name: string | null;
  penName: string | null;
  firstTime: boolean;
}) {
  const router = useRouter();
  const [realName, setRealName] = useState(name ?? "");
  const [pen, setPen] = useState(penName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const cleanName = realName.trim().replace(/\s+/g, " ");
    const cleanPen = pen.trim().replace(/\s+/g, " ");
    if (cleanName.length < 2) return setError("Add your name (at least 2 characters).");
    if (cleanPen && cleanPen.length < 2) return setError("A pen name needs at least 2 characters, or leave it empty.");

    setBusy(true);
    const { error: saveError } = await getBrowserSupabase().rpc("set_my_staff_profile", {
      new_name: cleanName,
      new_pen_name: cleanPen || null,
    });
    setBusy(false);
    if (saveError) return setError(friendly(saveError));

    setNotice(firstTime ? "Saved. Opening the desk…" : "Saved.");
    router.refresh();
  }

  const byline = pen.trim() || realName.trim() || "Your name";

  return (
    <form className="staff-card profile-form" onSubmit={save}>
      <h2>{firstTime ? "Welcome to the staff desk" : "Your profile"}</h2>
      {firstTime && (
        <p className="profile-form__intro">
          You&apos;re signed in as <strong>{email}</strong>. Tell the team who you are before you start.
        </p>
      )}
      <fieldset disabled={busy}>
        <label htmlFor="profile-name">Your name</label>
        <input
          id="profile-name"
          value={realName}
          onChange={(event) => setRealName(event.target.value)}
          maxLength={100}
          autoComplete="name"
          required
        />
        <p className="staff-hint">Shown to the team on this desk.</p>

        <label htmlFor="profile-pen">Pen name <span>(optional)</span></label>
        <input
          id="profile-pen"
          value={pen}
          onChange={(event) => setPen(event.target.value)}
          maxLength={60}
          autoComplete="off"
        />
        <p className="staff-hint">If you write under another name, it appears as the byline on your posts. Leave it empty to use your name.</p>

        <p className="profile-form__byline">Your posts will be signed: <strong>{byline}</strong></p>

        <button type="submit" className="staff-button staff-button--primary">
          {busy ? "Saving…" : firstTime ? "Save and open the desk" : "Save"}
        </button>
      </fieldset>
      <p className="post-editor__messages" role="status" aria-live="polite">
        {notice && <span className="staff-notice">{notice}</span>}
        {error && <span className="staff-error">{error}</span>}
      </p>
    </form>
  );
}
