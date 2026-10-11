
import Link from "next/link";

export default function Home() {
  return (
    <main id="main-content" className="site-main home-page">
      <section className="marquee-hero" aria-labelledby="home-title">
        <h1 id="home-title">The campus keeps talking.</h1>
      </section>

      <section className="publication-portals" aria-labelledby="publications-title">
        <div className="publication-portals__intro">
          <h2 id="publications-title">Two publications. Two speeds.</h2>
          <p>
            The Press Club at DAU records the month as it unfolds, then returns
            to the ideas and creative work worth keeping.
          </p>
        </div>

        <article className="publication-portal publication-portal--nnn">
          <div className="publication-portal__index" aria-hidden="true">01</div>
          <div className="publication-portal__copy">
            <p className="publication-portal__cadence">Monthly newspaper</p>
            <h3>News and Nonsense</h3>
            <p>
              Campus news, observations, and everything between the serious
              and the strange.
            </p>
          </div>
          <Link className="portal-link" href="/NNN">
            Open NNN archive <span aria-hidden="true">↗</span>
          </Link>
        </article>

        <article className="publication-portal publication-portal--entelechy">
          <div className="publication-portal__index" aria-hidden="true">02</div>
          <div className="publication-portal__copy">
            <p className="publication-portal__cadence">Flagship magazine</p>
            <h3>Entelechy</h3>
            <p>
              Long-form writing and creative work, gathered into the college
              magazine.
            </p>
          </div>
          <Link className="portal-link" href="/Entelechy">
            Open Entelechy archive <span aria-hidden="true">↗</span>
          </Link>
        </article>
      </section>

      <section className="club-note" aria-labelledby="club-note-title">
        <h2 id="club-note-title">One newsroom, two kinds of attention.</h2>
        <p>
          NNN follows the month. Entelechy slows down. Together, they keep a
          record of what the campus reported, questioned, wrote, and made.
        </p>
      </section>
    </main>
  );
}
