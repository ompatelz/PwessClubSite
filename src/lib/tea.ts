import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type TeaStatus = "pending" | "published" | "rejected";

export type TeaPost = {
  id: string;
  submitted_title: string;
  submitted_body: string;
  edited_title: string;
  edited_body: string;
  status: TeaStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export const teaEnabled = () => process.env.TEA_ENABLED === "true";

export function getTeaCredentials() {
  const explicitUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const explicitKey = process.env.TEA_SUPABASE_SERVICE_ROLE_KEY;
  if (explicitUrl && explicitKey) return { url: explicitUrl, key: explicitKey };

  const integrationUrl = process.env.SUPABASE_URL;
  const integrationKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (integrationUrl && integrationKey) return { url: integrationUrl, key: integrationKey };

  return null;
}

export function getTeaDb(): SupabaseClient | null {
  const credentials = getTeaCredentials();
  if (!credentials) return null;

  return createClient(credentials.url, credentials.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function cleanPost(input: unknown) {
  if (typeof input !== "object" || input === null) return null;
  const fields = input as Record<string, unknown>;
  const title = typeof fields.title === "string" ? fields.title.trim() : "";
  const body = typeof fields.body === "string" ? fields.body.trim() : "";

  if (title.length < 4 || title.length > 120 || body.length < 20 || body.length > 5000) {
    return null;
  }

  return { title, body };
}

export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export function teaJson(message: string, status: number) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}
