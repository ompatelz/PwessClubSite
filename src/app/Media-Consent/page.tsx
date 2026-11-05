import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import PDFWrapper from "@/Components/PDF_wrapper";
import PageImageReader from "@/Components/PageImageReader";
import { parseEditionPagesManifest } from "@/lib/edition-pages-manifest";

export const metadata: Metadata = {
  title: "Media Consent & Editorial Independence Agreement",
  description:
    "Read the DAU Press Club's terms for interviews, attribution, editorial independence, right of reply, and grievance handling.",
};

const documentUrl = "/documents/media-consent-agreement.pdf";
// Page images made with: npm run edition:pages -- public/documents/media-consent-agreement.pdf
//   public/documents/media-consent-agreement-pages --widths=1000,1600
// Re-run that command whenever the PDF changes.
const pagesFolder = "/documents/media-consent-agreement-pages/";

// Read once at build time; if the images are missing the PDF reader is used instead.
async function getAgreementPages() {
  try {
    const raw = await readFile(join(process.cwd(), "public", pagesFolder, "manifest.json"), "utf8");
    return parseEditionPagesManifest(JSON.parse(raw), pagesFolder);
  } catch {
    return null;
  }
}

export default async function MediaConsentPage() {
  const pages = await getAgreementPages();

  return (
    <main id="main-content" className="site-main reader-page">
      <header className="reader-header reader-header--document">
        <Link className="type-link" href="/">
          <span aria-hidden="true">←</span> Press Club home
        </Link>
        <h1>Media Consent &amp; Editorial Independence Agreement</h1>
        <p>Press Club · official reading copy</p>
      </header>
      {pages
        ? <PageImageReader pages={pages} pdfUrl={documentUrl} title="Media Consent Agreement" />
        : <PDFWrapper url={documentUrl} />}
    </main>
  );
}
