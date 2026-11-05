import Link from "next/link";
import { formatDateline, getFrontPage } from "@/lib/front-page";
import { nnnEditionTitle } from "@/lib/publications";
import { formatStoryDate, NEW_POST_WINDOW_MS } from "@/lib/stories";
import { teaEnabled } from "@/lib/tea";

// The riso studio home page, now carrying what is actually out: the hero still
// explains the Press Club, and each publication block shows its latest issue.
// Re-read every 5 minutes so a new edition or post appears without a redeploy.
export const revalidate = 300;

export default async function Home() {
  const now = new Date();
  const { entelechy, nnn, posts } = await getFrontPage();
  const [latestNNN, ...earlierNNN] = nnn;
  const tea = teaEnabled();

  return (
    <main id="main-content" className="site-main home-page">
      <div className="front-dateline">
        <time dateTime={now.toISOString().slice(0, 10)}>{formatDateline(now)}</time>
        {(entelechy || latestNNN) && (
          <p className="front-dateline__latest">
            <span>Latest</span>
            {entelechy && <Link href={`/Entelechy/${entelechy.id}`}>Entelechy {entelechy.edition}</Link>}
            {latestNNN && <Link href={`/NNN/${latestNNN.id}`}>NNN {nnnEditionTitle(latestNNN)}</Link>}
          </p>
        )}
      </div>

      <section className="studio-hero" aria-labelledby="home-title">
        <div className="studio-hero__copy">
          <h1 id="home-title">A campus, read at every speed.</h1>
          <p>
            The Press Club at DAU publishes the quick pulse and the long view:
            signed stories on the blog{tea ? ", anonymous Campus Tea" : ""}, a monthly newspaper, and a flagship magazine.
          </p>
        </div>
        <div className="hero-issues" aria-label="Latest from our two publications">
          <Link className="hero-issue hero-issue--entelechy" href={entelechy ? `/Entelechy/${entelechy.id}` : "/Entelechy"}>
            <span className="hero-issue__label">Flagship magazine</span>
            <strong>Entelechy</strong>
            <span className="hero-issue__latest">
              {entelechy ? `Read Edition ${entelechy.edition}` : "Browse the archive"} <span aria-hidden="true">→</span>
            </span>
          </Link>
          <Link className="hero-issue hero-issue--nnn" href={latestNNN ? `/NNN/${latestNNN.id}` : "/NNN"}>
            <span className="hero-issue__label">Monthly newspaper</span>
            <strong>News and Nonsense</strong>
            <span className="hero-issue__latest">
              {latestNNN ? `Read ${nnnEditionTitle(latestNNN)}` : "Browse the archive"} <span aria-hidden="true">→</span>
            </span>
          </Link>
        </div>
      </section>

      <section className="publication-studios" aria-label="Press Club publications">
        <article className="publication-studio publication-studio--entelechy">
          <div className="publication-studio__poster" aria-hidden="true">
            <span>EN</span><span>TE</span><span>LECHY</span>
          </div>
          <div className="publication-studio__copy">
            <p className="kicker kicker--entelechy">The flagship</p>
            <h2>Entelechy</h2>
            <p>Long-form writing and creative work, gathered into the college magazine edition by edition.</p>
            {entelechy && (
              <p className="studio-latest">
                <span>Latest</span>
                <strong>Edition {entelechy.edition}</strong>
              </p>
            )}
            <div className="front-actions">
              {entelechy && (
                <Link className="front-button front-button--entelechy" href={`/Entelechy/${entelechy.id}`}>
                  Read Edition {entelechy.edition} <span aria-hidden="true">→</span>
                </Link>
              )}
              <Link className="studio-link" href="/Entelechy">All editions</Link>
            </div>
          </div>
        </article>

        <article className="publication-studio publication-studio--nnn">
          <div className="publication-studio__poster" aria-hidden="true">
            <span>N</span><span>N</span><span>N</span>
          </div>
          <div className="publication-studio__copy">
            <p className="kicker kicker--nnn">Every month</p>
            <h2>News and Nonsense</h2>
            <p>Campus news, observations, and everything between the serious and the strange.</p>
            {latestNNN && (
              <p className="studio-latest">
                <span>Latest</span>
                <strong>{nnnEditionTitle(latestNNN)}</strong>
                {earlierNNN.length > 0 && (
                  <span className="studio-latest__earlier">
                    Earlier:{" "}
                    {earlierNNN.map((edition, index) => (
                      <span key={edition.id}>
                        {index > 0 && ", "}
                        <Link href={`/NNN/${edition.id}`}>{nnnEditionTitle(edition)}</Link>
                      </span>
                    ))}
                  </span>
                )}
              </p>
            )}
            <div className="front-actions">
              {latestNNN && (
                <Link className="front-button front-button--nnn" href={`/NNN/${latestNNN.id}`}>
                  Read {nnnEditionTitle(latestNNN)} <span aria-hidden="true">→</span>
                </Link>
              )}
              <Link className="studio-link" href="/NNN">All editions</Link>
            </div>
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
            Signed blogs from Press Club writers carry their name and date
            {tea ? ". Campus Tea takes anonymous posts, and an editor reads each one before it goes up." : ", and appear here as soon as they are published."}
          </p>
          <div className="home-stories__actions">
            <Link className="studio-link" href="/Blog">
              Read the blog <span aria-hidden="true">→</span>
            </Link>
            {tea && (
              <Link className="studio-link" href="/Tea">
                Open Campus Tea <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="front-blog" aria-labelledby="front-blog-title">
        <div className="front-section-head">
          <div>
            <p className="kicker kicker--blog">Blog · Signed stories</p>
            <h2 id="front-blog-title">Newest on the blog</h2>
          </div>
          <Link className="front-text-link" href="/Blog">All posts <span aria-hidden="true">→</span></Link>
        </div>

        {posts.length === 0 ? (
          <p className="front-empty">The first signed story is still on the desk. It will appear here with its writer and date.</p>
        ) : (
          <ol className="headline-tiles">
            {posts.map((post) => {
              const fresh = now.getTime() - new Date(post.published_at).getTime() < NEW_POST_WINDOW_MS;
              return (
                <li key={post.id} className={fresh ? "headline-tile headline-tile--fresh" : "headline-tile"}>
                  <Link href={`/Blog/${post.slug}`}>
                    <span className="headline-tile__meta">
                      <span>{post.author}</span>
                      <time dateTime={post.published_at}>{formatStoryDate(post.published_at)}</time>
                    </span>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <span className="headline-tile__action">Read <span aria-hidden="true">→</span></span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="club-note" aria-labelledby="club-note-title">
        <div>
          <h2 id="club-note-title">Made on campus. Kept in print.</h2>
          <Link className="studio-link" href="/Editorial">How we publish <span aria-hidden="true">→</span></Link>
        </div>
        <p>One newsroom works at two speeds. Entelechy preserves the work worth returning to; NNN follows the month as campus life unfolds.</p>
      </section>
    </main>
  );
}
