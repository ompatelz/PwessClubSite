"use client";

import { createBrowserClient } from "@supabase/ssr";

// Supabase client for the staff desk in the browser. It carries the signed-in
// member's session, so every read and write is checked by the database rules.
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return client;
}
