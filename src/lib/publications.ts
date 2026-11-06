import { cache } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export { formatNNNMonth, nnnEditionTitle } from "@/lib/nnn-title";

export type EntelechyEdition = {
  id: number;
  edition: number;
  pdf_url: string;
};

// What visitors may see about an NNN issue. The file location is private: only
// staff and the server-side email route can read it.
export type NNNEdition = {
  id: number;
  Month: number | string;
  Year: number;
};

export const NNN_PUBLIC_COLUMNS = "id,Month,Year";

// `cache` lets generateMetadata, the page and its share image share one query per request.
export const getEntelechyEdition = cache(async (id: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) return { status: "unconfigured" as const };

  const { data, error } = await supabase
    .from("Entelechy")
    .select("id,edition,pdf_url")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return { status: "missing" as const };
  return { status: "found" as const, edition: data as EntelechyEdition };
});

export const getNNNEdition = cache(async (id: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) return { status: "unconfigured" as const };

  const { data, error } = await supabase
    .from("NNN")
    .select(NNN_PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return { status: "missing" as const };
  return { status: "found" as const, edition: data as NNNEdition };
});

export function publicPdfUrl(path: string) {
  if (String(path).startsWith("http")) return path;

  const supabase = getSupabaseClient();
  if (!supabase) return path;
  return supabase.storage.from("Entelechy").getPublicUrl(path).data.publicUrl;
}
