import type { Metadata } from "next";
import Link from "next/link";
import { teaEnabled } from "@/lib/tea";

export const metadata: Metadata = {
  title: "How we publish",
  description: "How the DAU Press Club handles bylines, editions, editorial review and complaints.",
};

export default function EditorialPage() {
  // Campus Tea is only described while it is switched on, so the page never
  // explains a feature visitors cannot use.
  const tea = teaEnabled();

  return (
    <main id="main-content" className="site-main editorial-page">
      <header className="editorial-header">
        <h1>How we publish.</h1>
        <p>
          {tea ? "Four" : "Three"} formats, one newsroom. The byline, review process, and pace change;
          the responsibility to publish carefully does not.
        </p>
      </header>

      <div className="editorial-principles">
        <section>
          <h2>Entelechy</h2>
          <p>Our flagship magazine preserves long-form writing and creative work edition by edition.</p>
        </section>
        <section>
          <h2>News and Nonsense</h2>
          <p>NNN follows campus life issue by issue. Its archive keeps each published issue intact.</p>
        </section>
        <section>
          <h2>Blog</h2>
          <p>Blog articles are signed. Every published story carries its writer and publication date.</p>
        </section>
        {tea && (
          <section>
            <h2>Campus Tea</h2>
            <p>Tea submissions are anonymous to public readers and reach the Press Club review desk before publication. Editors may revise a submission or decide not to publish it.</p>
          </section>
        )}
      </div>

      <section className="editorial-note">
        <h2>Consent and editorial independence</h2>
        <p>
          Our Media Consent Agreement sets out how we attribute quotes, offer a right of reply,
          keep editorial independence and handle complaints.
        </p>
        <Link className="studio-link" href="/Media-Consent">Read the agreement <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
