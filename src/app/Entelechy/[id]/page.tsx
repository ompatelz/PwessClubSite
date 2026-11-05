import type { Metadata } from "next";
import Link from "next/link";
import PDFWrapper from "@/Components/PDF_wrapper";
import PageImageReader from "@/Components/PageImageReader";
import ArchiveState from "@/Components/ArchiveState";
import ShareLinks from "@/Components/ShareLinks";
import { shareMetadata } from "@/lib/share";
import { getEditionPages } from "@/lib/edition-pages";
import { getEntelechyEdition, publicPdfUrl } from "@/lib/publications";

// Re-read Supabase at most every 5 minutes, so a new edition appears without a redeploy.
export const revalidate = 300;

type EditionPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: EditionPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getEntelechyEdition(id);
  if (result.status !== "found") return { title: "Entelechy edition" };

  const title = `Entelechy, Edition ${result.edition.edition}`;
  const description = "Read this edition of Entelechy, the flagship magazine of the Press Club at DAU.";

  return shareMetadata({ title, description, path: `/Entelechy/${result.edition.id}` });
}

export default async function EntelechyEditionPage({ params }: EditionPageProps) {
  const { id } = await params;
  const result = await getEntelechyEdition(id);

  if (result.status === "unconfigured") {
    return (
      <main id="main-content" className="site-main reader-page">
        <ArchiveState
          title="This edition is unavailable."
          message="The Entelechy archive is not connected in this environment."
        />
      </main>
    );
  }

  if (result.status === "missing") {
    return (
      <main id="main-content" className="site-main reader-page">
        <ArchiveState
          title="Edition not found."
          message="This Entelechy edition may have moved or is not available yet."
        />
      </main>
    );
  }

  const { edition } = result;
  const pages = await getEditionPages("Entelechy", edition.id);
  const documentUrl = publicPdfUrl("Entelechy", edition.pdf_url);

  return (
    <main id="main-content" className="site-main reader-page">
      <header className="reader-header">
        <Link className="type-link" href="/Entelechy">
          <span aria-hidden="true">←</span> Entelechy archive
        </Link>
        <h1>Edition {edition.edition}</h1>
        <p>Entelechy · digital reading copy</p>
        <ShareLinks
          title={`Entelechy, Edition ${edition.edition}`}
          path={`/Entelechy/${edition.id}`}
        />
      </header>
      {pages
        ? <PageImageReader pages={pages} pdfUrl={documentUrl} title={`Entelechy, Edition ${edition.edition}`} />
        : <PDFWrapper url={documentUrl} />}
    </main>
  );
}
