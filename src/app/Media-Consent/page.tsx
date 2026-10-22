import type { Metadata } from "next";
import Link from "next/link";
import PDFWrapper from "@/Components/PDF_wrapper";

export const metadata: Metadata = {
  title: "Media Consent & Editorial Independence Agreement",
  description:
    "Read the DAU Press Club's terms for interviews, attribution, editorial independence, right of reply, and grievance handling.",
};

const documentUrl = "/documents/media-consent-agreement.pdf";

export default function MediaConsentPage() {
  return (
    <main id="main-content" className="site-main reader-page">
      <header className="reader-header reader-header--document">
        <Link className="type-link" href="/">
          <span aria-hidden="true">←</span> Press Club home
        </Link>
        <h1>Media Consent &amp; Editorial Independence Agreement</h1>
        <p>Press Club · official reading copy</p>
      </header>
      <PDFWrapper url={documentUrl} />
    </main>
  );
}
