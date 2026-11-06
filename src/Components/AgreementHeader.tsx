import Link from "next/link";

export const AGREEMENT_PDF_URL = "/documents/media-consent-agreement.pdf";

// Shared header for the agreement's two views: readable text and original pages.
export default function AgreementHeader({ view }: { view: "text" | "pages" }) {
  return (
    <header className="reader-header reader-header--document agreement-header">
      <Link className="type-link" href="/">
        <span aria-hidden="true">←</span> Press Club home
      </Link>
      <h1>Media Consent &amp; Editorial Independence Agreement</h1>
      <nav className="agreement-views" aria-label="Ways to read the agreement">
        <Link href="/Media-Consent" aria-current={view === "text" ? "page" : undefined}>Read as text</Link>
        <Link href="/Media-Consent/pages" aria-current={view === "pages" ? "page" : undefined}>Original pages</Link>
        <a href={AGREEMENT_PDF_URL} download>Download PDF</a>
      </nav>
    </header>
  );
}
