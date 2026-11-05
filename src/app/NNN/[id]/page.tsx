import type { Metadata } from "next";
import Link from "next/link";
import PDFWrapper from "@/Components/PDF_wrapper";
import PageImageReader from "@/Components/PageImageReader";
import ArchiveState from "@/Components/ArchiveState";
import ShareLinks from "@/Components/ShareLinks";
import { shareMetadata } from "@/lib/share";
import { getEditionPages } from "@/lib/edition-pages";
import { getNNNEdition, nnnEditionTitle, publicPdfUrl } from "@/lib/publications";

// Re-read Supabase at most every 5 minutes, so a new edition appears without a redeploy.
export const revalidate = 300;

type EditionPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: EditionPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getNNNEdition(id);
  if (result.status !== "found") return { title: "NNN edition" };

  const title = `NNN, ${nnnEditionTitle(result.edition)}`;
  const description = "Read this edition of News and Nonsense, the Press Club's newspaper at DAU.";

  return shareMetadata({ title, description, path: `/NNN/${result.edition.id}` });
}

export default async function NNNEditionPage({ params }: EditionPageProps) {
  const { id } = await params;
  const result = await getNNNEdition(id);

  if (result.status === "unconfigured") {
    return (
      <main id="main-content" className="site-main reader-page">
        <ArchiveState
          title="This edition is unavailable."
          message="The NNN archive is not connected in this environment."
        />
      </main>
    );
  }

  if (result.status === "missing") {
    return (
      <main id="main-content" className="site-main reader-page">
        <ArchiveState
          title="Edition not found."
          message="This NNN edition may have moved or is not available yet."
        />
      </main>
    );
  }

  const { edition } = result;
  const pages = await getEditionPages("NNN", edition.id);
  const documentUrl = publicPdfUrl("NNN", edition.Pdf_url);
  const editionTitle = nnnEditionTitle(edition);

  return (
    <main id="main-content" className="site-main reader-page">
      <header className="reader-header reader-header--nnn">
        <Link className="type-link" href="/NNN">
          <span aria-hidden="true">←</span> NNN archive
        </Link>
        <h1>{editionTitle}</h1>
        <ShareLinks title={`NNN, ${editionTitle}`} path={`/NNN/${edition.id}`} />
      </header>
      {pages
        ? <PageImageReader pages={pages} pdfUrl={documentUrl} title={`NNN, ${editionTitle}`} />
        : <PDFWrapper url={documentUrl} />}
    </main>
  );
}
