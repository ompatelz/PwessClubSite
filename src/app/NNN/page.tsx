import type { Metadata } from "next";
import Link from "next/link";
import ArchiveState from "@/Components/ArchiveState";
import { getSupabaseClient } from "@/lib/supabase";
import { NNN_PUBLIC_COLUMNS, nnnEditionTitle, type NNNEdition } from "@/lib/publications";

export const metadata: Metadata = {
  title: "NNN",
  description: "Browse editions of News and Nonsense, DAU's campus newspaper.",
};

// Re-read Supabase at most every 5 minutes, so a new edition appears without a redeploy.
export const revalidate = 300;

export default async function NNNPage() {
  const supabase = getSupabaseClient();
  const result = supabase
    ? await supabase.from("NNN").select(NNN_PUBLIC_COLUMNS).order("Year", { ascending: false }).order("Month", { ascending: false })
    : { data: null, error: new Error("Supabase is not configured") };
  const editions = (result.data ?? []) as NNNEdition[];

  return (
    <main id="main-content" className="site-main archive-page">
      <header className="archive-header">
        <h1>News and Nonsense</h1>
        <p>
          NNN is the college newspaper: a record of campus news,
          observations, and everything between the serious and the strange.
          It is shared with the DAU community only, by email to your college address.
        </p>
      </header>

      {!supabase ? (
        <ArchiveState
          tone="pending"
          title="The NNN archive is being prepared."
          message="Check back soon for editions of News and Nonsense."
        />
      ) : result.error ? (
        <ArchiveState
          title="The NNN archive is unavailable."
          message="The publication archive could not be reached. Please check back soon."
        />
      ) : editions.length === 0 ? (
        <ArchiveState
          title="No NNN editions are listed yet."
          message="Newspaper editions will appear here when the archive is updated."
        />
      ) : (
        <ol className="edition-list" aria-label="NNN editions">
          {editions.map((edition) => (
            <li key={edition.id}>
              <Link href={`/NNN/${edition.id}`}>
                <span className="edition-list__date">
                  {nnnEditionTitle(edition)}
                </span>
                <span className="edition-list__action">
                  Get it by email <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
