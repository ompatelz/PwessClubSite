import type { Metadata } from "next";
import Link from "next/link";
import ArchiveState from "@/Components/ArchiveState";
import NNNEmailRequest from "@/Components/NNNEmailRequest";
import { getSupabaseClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "NNN",
  description: "Browse editions of News and Nonsense, DAU's monthly newspaper.",
};

type Edition = {
  id: number;
  Month: number | string;
  Year: number;
  Pdf_url: string;
};

function formatMonth(month: number | string) {
  const monthNumber = Number(month);

  if (Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
    return new Intl.DateTimeFormat("en", { month: "long" }).format(
      new Date(2000, monthNumber - 1, 1),
    );
  }

  return String(month);
}

export default async function NNNPage() {
  const supabase = getSupabaseClient();
  const emailEnabled = process.env.NNN_EMAIL_ENABLED === "true";
  const result = supabase
    ? await supabase.from("NNN").select("*").order("id", { ascending: false })
    : { data: null, error: new Error("Supabase is not configured") };
  const editions = (result.data ?? []) as Edition[];

  return (
    <main id="main-content" className="site-main archive-page">
      <header className="archive-header">
        <h1>News and Nonsense</h1>
        <p>
          NNN is the college newspaper: a month-by-month record of campus news,
          observations, and everything between the serious and the strange.
        </p>
      </header>

      {emailEnabled && <NNNEmailRequest />}

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
                  {formatMonth(edition.Month)} {edition.Year}
                </span>
                <span className="edition-list__action">
                  Read edition <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
