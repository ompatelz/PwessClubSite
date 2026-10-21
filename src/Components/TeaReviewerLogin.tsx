"use client";

import { useState, type FormEvent } from "react";

export default function TeaReviewerLogin() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/tea/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { message?: string };
      if (response.ok) window.location.reload();
      else setNotice(result.message ?? "Sign-in failed.");
    } catch {
      setNotice("Couldn't sign in right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="tea-login" onSubmit={login}>
      <label htmlFor="tea-password">Press Club password</label>
      <input id="tea-password" type="password" autoComplete="current-password" value={password}
        onChange={(event) => setPassword(event.target.value)} required />
      <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Open review desk"}</button>
      {notice && <p role="alert">{notice}</p>}
    </form>
  );
}
