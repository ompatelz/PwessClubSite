import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import AgreementHeader, { AGREEMENT_PDF_URL } from "@/Components/AgreementHeader";
import PDFWrapper from "@/Components/PDF_wrapper";
import PageImageReader from "@/Components/PageImageReader";
import { parseEditionPagesManifest } from "@/lib/edition-pages-manifest";

export const metadata: Metadata = {
  title: "Media Consent & Editorial Independence Agreement: original pages",
  description: "The DAU Press Club's media consent agreement as it appears in the signed document.",
  alternates: { canonical: "/Media-Consent/pages" },
};

const documentUrl = AGREEMENT_PDF_URL;
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

export default async function MediaConsentPagesPage() {
  const pages = await getAgreementPages();

  return (
    <main id="main-content" className="site-main reader-page">
      <AgreementHeader view="pages" />
      {pages
        ? <PageImageReader pages={pages} pdfUrl={documentUrl} title="Media Consent Agreement" />
        : <PDFWrapper url={documentUrl} />}
    </main>
  );
}
