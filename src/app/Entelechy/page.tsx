import type { Metadata } from "next";
import Link from "next/link";
import ArchiveState from "@/Components/ArchiveState";
import { getSupabaseClient } from "@/lib/supabase";
import type { EntelechyEdition } from "@/lib/publications";

export const metadata: Metadata = {
  title: "Entelechy",
  description: "Browse editions of Entelechy, DAU's flagship college magazine.",
};

// Re-read Supabase at most every 5 minutes, so a new edition appears without a redeploy.
export const revalidate = 300;

export default async function EntelechyPage() {
  const supabase = getSupabaseClient();
  const result = supabase
    ? await supabase
        .from("Entelechy")
        .select("id,edition,pdf_url")
        .order("id", { ascending: false })
    : { data: null, error: new Error("Supabase is not configured") };
  const editions = (result.data ?? []) as EntelechyEdition[];
  const [featuredEdition, ...earlierEditions] = editions;

  return (
    <main id="main-content" className="site-main archive-page">
      <header className="archive-header archive-header--entelechy">
        <h1>Entelechy</h1>
        <p>
          A longer-form home for the college’s writing and creative work,
          gathered edition by edition.
        </p>
      </header>

      {!supabase ? (
        <ArchiveState
          tone="pending"
          title="The Entelechy archive is being prepared."
          message="Check back soon for editions of Entelechy."
        />
      ) : result.error ? (
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
        <div className="entelechy-archive">
          <section className="entelechy-feature" aria-labelledby="featured-entelechy-title">
            <div className="entelechy-feature__mark" aria-hidden="true">E</div>
            <div className="entelechy-feature__copy">
              <p>Latest in the archive</p>
              <h2 id="featured-entelechy-title">Edition {featuredEdition.edition}</h2>
              <p>Open the complete magazine in the Press Club reader, with page controls and an original-PDF fallback.</p>
              <Link className="front-button front-button--entelechy" href={`/Entelechy/${featuredEdition.id}`}>
                Read this edition <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>

          {earlierEditions.length > 0 && (
            <section className="entelechy-earlier" aria-labelledby="earlier-entelechy-title">
              <h2 id="earlier-entelechy-title">Earlier editions</h2>
              <ol className="edition-list" aria-label="Earlier Entelechy editions">
                {earlierEditions.map((edition) => (
                  <li key={edition.id}>
                    <Link href={`/Entelechy/${edition.id}`}>
                      <span className="edition-list__date">Edition {edition.edition}</span>
                      <span className="edition-list__action">Read magazine <span aria-hidden="true">→</span></span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
