import type { Metadata } from "next";
import Link from "next/link";
import ArchiveState from "@/Components/ArchiveState";
import { getSupabaseClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Entelechy",
  description: "Browse editions of Entelechy, DAU's flagship college magazine.",
};

type Edition = {
  id: number;
  edition: number;
  pdf_url: string;
};

export default async function EntelechyPage() {
  const supabase = getSupabaseClient();
  const result = supabase
    ? await supabase
        .from("Entelechy")
        .select("*")
        .order("id", { ascending: false })
    : { data: null, error: new Error("Supabase is not configured") };
  const editions = (result.data ?? []) as Edition[];

  return (
    <main id="main-content" className="site-main archive-page">
      <header className="archive-header archive-header--entelechy">
        <h1>Entelechy</h1>
        <p>
          A longer-form home for the college’s writing and creative work,
          gathered edition by edition.
        </p>
      </header>

      {result.error ? (
        <ArchiveState
          title="The Entelechy archive is unavailable."
          message="The publication archive could not be reached. Please check back soon."
        />
      ) : editions.length === 0 ? (
        <ArchiveState
          title="No Entelechy editions are listed yet."
          message="Magazine editions will appear here when the archive is updated."
        />
      ) : (
        <ol className="edition-list" aria-label="Entelechy editions">
          {editions.map((edition) => (
            <li key={edition.id}>
              <Link href={`/Entelechy/${edition.id}`}>
                <span className="edition-list__date">
                  Edition {edition.edition}
                </span>
                <span className="edition-list__action">
                  Read magazine <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
