import { cache } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export type EntelechyEdition = {
  id: number;
  edition: number;
  pdf_url: string;
};

export type NNNEdition = {
  id: number;
  Month: number | string;
  Year: number;
  Pdf_url: string;
};

export function formatNNNMonth(month: number | string) {
  const monthNumber = Number(month);

  if (Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
    return new Intl.DateTimeFormat("en", { month: "long" }).format(
      new Date(2000, monthNumber - 1, 1),
    );
  }

  return String(month);
}

export function nnnEditionTitle(edition: Pick<NNNEdition, "Month" | "Year">) {
  return `${formatNNNMonth(edition.Month)} ${edition.Year}`;
}

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
    .select("id,Month,Year,Pdf_url")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return { status: "missing" as const };
  return { status: "found" as const, edition: data as NNNEdition };
});

export function publicPdfUrl(bucket: "Entelechy" | "NNN", path: string) {
  if (String(path).startsWith("http")) return path;

  const supabase = getSupabaseClient();
  if (!supabase) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
