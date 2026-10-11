
import Link from "next/link";

export default function Home() {
  return (
    <main id="main-content" className="site-main home-page">
      <section className="studio-hero" aria-labelledby="home-title">
        <div className="studio-hero__copy">
          <h1 id="home-title">Two ways to read the campus.</h1>
          <p>
            The Press Club at DAU publishes the quick pulse and the long view:
            a monthly newspaper and a flagship college magazine.
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
