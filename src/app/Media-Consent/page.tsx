import type { Metadata } from "next";
import type { ReactNode } from "react";
import AgreementHeader from "@/Components/AgreementHeader";
import {
  AGREEMENT_INTRO,
  AGREEMENT_PUBLISHER,
  AGREEMENT_SECTIONS,
  type AgreementBlock,
} from "@/content/media-consent-agreement";

export const metadata: Metadata = {
  title: "Media Consent & Editorial Independence Agreement",
  description:
    "Read the DAU Press Club's terms for interviews, attribution, editorial independence, right of reply, and grievance handling.",
  alternates: { canonical: "/Media-Consent" },
};

// Text set in bold in the PDF is marked **like this** in the content file.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) =>
    part.startsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part,
  );
}

function Block({ block }: { block: AgreementBlock }) {
  if (block.type === "h3") return <h3 id={block.id}>{block.text}</h3>;
  if (block.type === "ul") {
    return <ul>{block.items.map((item, index) => <li key={index}>{inline(item)}</li>)}</ul>;
  }
  return <p>{inline(block.text)}</p>;
}

function Contents() {
  return (
    <ol>
      {AGREEMENT_SECTIONS.map((section) => (
        <li key={section.id}>
          <a href={`#${section.id}`}>
            <span>{section.number}</span> {section.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

// The readable web version: same wording as the PDF, as real text that phones can
// reflow, readers can search and select, and screen readers can follow.
export default function MediaConsentPage() {
  return (
    <main id="main-content" className="site-main reader-page agreement-page">
      <AgreementHeader view="text" />

      <div className="agreement-layout">
        <nav className="agreement-contents" aria-label="Agreement sections">
          {/* Folded on phones so the text comes first; always open beside the text on wide screens. */}
          <details className="agreement-contents__fold">
            <summary>Contents · 16 sections</summary>
            <Contents />
          </details>
          <div className="agreement-contents__panel">
            <p>Contents</p>
            <Contents />
          </div>
        </nav>

        <article className="agreement-text" aria-labelledby="agreement-title">
          <header className="agreement-text__header">
            <p className="kicker">{AGREEMENT_PUBLISHER}</p>
            <h2 id="agreement-title">Media Consent and Editorial Independence Agreement</h2>
          </header>
          <p className="agreement-text__intro">{inline(AGREEMENT_INTRO)}</p>

          {AGREEMENT_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`}>
                <span className="agreement-text__number">{section.number}.</span> {section.title}
              </h2>
              {section.blocks.map((block, index) => <Block key={index} block={block} />)}
            </section>
          ))}

          <p className="agreement-text__source">
            This text matches the signed PDF word for word. If the two ever differ, the PDF is the official version.
          </p>
        </article>
      </div>
    </main>
  );
}
