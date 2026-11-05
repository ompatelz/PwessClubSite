"use client";

import { useState, type FormEvent } from "react";
import { NNN_EMAIL_ISSUE } from "@/lib/nnn-email-issue";

export default function NNNEmailRequest() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const address = email.trim().toLowerCase();
    if (!/^[a-z0-9._%+-]+@dau\.ac\.in$/.test(address)) {
      setStatus("Enter your @dau.ac.in email address.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/nnn/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address }),
      });
      const result = (await response.json()) as { message?: string };
      setStatus(result.message ?? "We couldn't process your request. Please try again.");
      if (response.ok) setEmail("");
    } catch {
      setStatus("The request couldn't connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="nnn-email" aria-labelledby="nnn-email-title">
      <div>
        <h2 id="nnn-email-title">Get the {NNN_EMAIL_ISSUE.label} issue by email.</h2>
        <p>Enter your DAU email and we’ll send you the PDF.</p>
      </div>
      <form onSubmit={submit}>
        <label htmlFor="nnn-email-address">DAU email address</label>
        <div className="nnn-email__controls">
          <input
            id="nnn-email-address"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@dau.ac.in"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={busy}
          />
          <button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Email me the issue"}
          </button>
        </div>
        <p role="status" aria-live="polite">{status}</p>
      </form>
    </section>
  );
}
