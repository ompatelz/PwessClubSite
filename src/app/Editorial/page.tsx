import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How we publish",
  description: "How the DAU Press Club handles authorship, anonymous Tea, editions, and editorial review.",
};

export default function EditorialPage() {
  return (
    <main id="main-content" className="site-main editorial-page">
      <header className="editorial-header">
        <h1>How we publish.</h1>
        <p>
          Four formats, one newsroom. The byline, review process, and pace change;
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
          <p>NNN follows campus life month by month. Its archive keeps each published issue intact.</p>
        </section>
        <section>
          <h2>Blog</h2>
          <p>Blog articles are signed. Every published story carries its writer and publication date.</p>
        </section>
        <section>
          <h2>Campus Tea</h2>
          <p>Tea submissions are anonymous to public readers and reach the Press Club review desk before publication. Editors may revise a submission or decide not to publish it.</p>
        </section>
      </div>

      <section className="editorial-note">
        <h2>Consent and editorial independence</h2>
        <p>Our reading copy explains attribution, right of reply, editorial independence, and grievance handling.</p>
        <Link className="studio-link" href="/Media-Consent">Read the agreement <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
