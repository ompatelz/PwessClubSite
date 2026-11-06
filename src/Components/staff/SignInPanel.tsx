"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

// One button: sign in with the member's DAU Google account. The `hd` hint asks
// Google to show only dau.ac.in accounts; the server still checks the address
// against the staff list, so a hint alone never grants access.
export default function SignInPanel({ failed }: { failed?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(failed ? "Sign-in didn't finish. Please try again." : "");

  async function signIn() {
    setBusy(true);
    setError("");
    const { error: signInError } = await getBrowserSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/press-club`,
        queryParams: { hd: "dau.ac.in", prompt: "select_account" },
      },
    });
    if (signInError) {
      setBusy(false);
      setError("Google sign-in isn't available right now. Please try again later.");
    }
  }

  return (
    <div className="staff-signin">
      <button type="button" className="staff-signin__google" onClick={signIn} disabled={busy}>
        <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
          <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
        </svg>
        {busy ? "Opening Google…" : "Sign in with your DAU Google account"}
      </button>
      <p className="staff-signin__note">Only @dau.ac.in accounts on the Press Club staff list can open the desk.</p>
      {error && <p className="staff-signin__error" role="alert">{error}</p>}
    </div>
  );
}
