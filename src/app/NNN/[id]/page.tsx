import type { Metadata } from "next";
import Link from "next/link";
import ArchiveState from "@/Components/ArchiveState";
import NNNEmailRequest from "@/Components/NNNEmailRequest";
import ShareLinks from "@/Components/ShareLinks";
import { shareMetadata } from "@/lib/share";
import { getNNNEdition, nnnEditionTitle } from "@/lib/publications";

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
  const description = "Get this issue of News and Nonsense by email with your @dau.ac.in address.";

  return shareMetadata({ title, description, path: `/NNN/${result.edition.id}` });
}

// NNN is shared with the DAU community only. This page never shows the issue
// itself; it sends the PDF to a college inbox.
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
  const editionTitle = nnnEditionTitle(edition);
  const emailEnabled = process.env.NNN_EMAIL_ENABLED === "true";

  return (
    <main id="main-content" className="site-main reader-page nnn-request-page">
      <header className="reader-header reader-header--nnn">
        <Link className="type-link" href="/NNN">
          <span aria-hidden="true">←</span> NNN archive
        </Link>
        <h1>{editionTitle}</h1>
        <ShareLinks title={`NNN, ${editionTitle}`} path={`/NNN/${edition.id}`} />
      </header>

      {emailEnabled ? (
        <NNNEmailRequest editionId={edition.id} title={editionTitle} />
      ) : (
        <ArchiveState
          tone="pending"
          title="Email delivery is being set up."
          message="NNN is shared with the DAU community by email. Check back soon to request this issue."
        />
      )}
    </main>
  );
}
