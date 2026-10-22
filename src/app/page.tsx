
import Link from "next/link";

export default function Home() {
  return (
    <main id="main-content" className="site-main home-page">
      <section className="studio-hero" aria-labelledby="home-title">
        <div className="studio-hero__copy">
          <h1 id="home-title">A campus, read at every speed.</h1>
          <p>
            The Press Club at DAU publishes the quick pulse and the long view:
            current stories, anonymous Tea, a monthly newspaper, and a flagship magazine.
          </p>
        </div>
        <div className="studio-hero__proof" aria-label="Our two publications">
          <Link href="/NNN">
            <span>Monthly</span>
            <strong>NNN</strong>
          </Link>
          <Link href="/Entelechy">
            <span>Flagship</span>
            <strong>Entelechy</strong>
          </Link>
        </div>
      </section>

      <section className="publication-studios" aria-label="Press Club publications">
        <article className="publication-studio publication-studio--nnn">
          <div className="publication-studio__poster" aria-hidden="true">
            <span>N</span><span>N</span><span>N</span>
          </div>
          <div className="publication-studio__copy">
            <p className="publication-studio__cadence">Every month</p>
            <h2>News and Nonsense</h2>
            <p>Campus news, observations, and everything between the serious and the strange.</p>
            <Link className="studio-link" href="/NNN">
              Read NNN <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </article>

        <article className="publication-studio publication-studio--entelechy">
          <div className="publication-studio__poster" aria-hidden="true">
            <span>EN</span><span>TE</span><span>LECHY</span>
          </div>
          <div className="publication-studio__copy">
            <p className="publication-studio__cadence">The flagship</p>
            <h2>Entelechy</h2>
            <p>Long-form writing and creative work, gathered into the college magazine.</p>
            <Link className="studio-link" href="/Entelechy">
              Read Entelechy <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </article>
      </section>

      <section className="home-stories" aria-labelledby="home-stories-title">
        <div>
          <p className="publication-studio__cadence">Between editions</p>
          <h2 id="home-stories-title">The campus keeps talking.</h2>
        </div>
        <div className="home-stories__copy">
          <p>
            Read signed blogs from the Press Club, or head to Campus Tea for
            anonymous posts reviewed before publication.
          </p>
          <div className="home-stories__actions">
            <Link className="studio-link" href="/Blog">
              Read the blog <span aria-hidden="true">→</span>
            </Link>
            <Link className="studio-link" href="/Tea">
              Open Campus Tea <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="club-note" aria-labelledby="club-note-title">
        <h2 id="club-note-title">Made on campus. Kept in print.</h2>
        <p>
          One newsroom works at two speeds. NNN follows the month; Entelechy
          pauses long enough to preserve the work worth returning to.
        </p>
      </section>
    </main>
  );
}
