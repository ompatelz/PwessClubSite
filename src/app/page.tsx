import Link from "next/link";
import { formatDateline, getFrontPage } from "@/lib/front-page";
import { nnnEditionTitle } from "@/lib/publications";
import { formatStoryDate, NEW_POST_WINDOW_MS } from "@/lib/stories";
import { teaEnabled } from "@/lib/tea";

// The front page shows what is actually out, like every student paper's home page:
// re-read every 5 minutes so a new edition or post appears without a redeploy.
export const revalidate = 300;

export default async function FrontPage() {
  const now = new Date();
  const { entelechy, nnn, posts } = await getFrontPage();
  const [latestNNN, ...earlierNNN] = nnn;
  const tea = teaEnabled();

  return (
    <main id="main-content" className="site-main front-page">
      <div className="front-dateline">
        <time dateTime={now.toISOString().slice(0, 10)}>{formatDateline(now)}</time>
        <p className="front-dateline__motto">A campus, read at every speed.</p>
        {(entelechy || latestNNN) && (
          <p className="front-dateline__latest">
            <span>Latest</span>
            {entelechy && <Link href={`/Entelechy/${entelechy.id}`}>Entelechy {entelechy.edition}</Link>}
            {latestNNN && <Link href={`/NNN/${latestNNN.id}`}>NNN {nnnEditionTitle(latestNNN)}</Link>}
          </p>
        )}
      </div>

      <div className="front-lead">
        <section className="front-entelechy" aria-labelledby="front-entelechy-title">
          <Link
            href={entelechy ? `/Entelechy/${entelechy.id}` : "/Entelechy"}
            className="front-cover"
            aria-hidden="true"
            tabIndex={-1}
          >
            <span className="front-cover__word">
              <span>EN</span><span>TE</span><span>LECHY</span>
            </span>
            {entelechy && <span className="front-cover__issue">No. {entelechy.edition}</span>}
          </Link>
          <div className="front-entelechy__copy">
            <p className="kicker kicker--entelechy">Entelechy · The flagship magazine</p>
            <h1 id="front-entelechy-title">
              {entelechy ? `Edition ${entelechy.edition}` : "The next edition is on the way"}
            </h1>
            <p className="front-dek">
              Long-form writing and creative work from across the college, gathered edition by edition.
            </p>
            <div className="front-actions">
              {entelechy && (
                <Link className="front-button front-button--entelechy" href={`/Entelechy/${entelechy.id}`}>
                  Read Edition {entelechy.edition} <span aria-hidden="true">→</span>
                </Link>
              )}
              <Link className="front-text-link" href="/Entelechy">All editions</Link>
            </div>
          </div>
        </section>

        <section className="front-nnn" aria-labelledby="front-nnn-title">
          <p className="kicker kicker--nnn">News and Nonsense · The newspaper</p>
          <h2 id="front-nnn-title">
            {latestNNN ? <Link href={`/NNN/${latestNNN.id}`}>{nnnEditionTitle(latestNNN)}</Link> : "First issue coming soon"}
          </h2>
          <p>Campus news, observations, and everything between the serious and the strange.</p>
          {latestNNN && (
            <Link className="front-button front-button--nnn" href={`/NNN/${latestNNN.id}`}>
              Read this edition <span aria-hidden="true">→</span>
            </Link>
          )}
          {earlierNNN.length > 0 && (
            <div className="front-nnn__earlier">
              <span>Earlier</span>
              <ul>
                {earlierNNN.map((edition) => (
                  <li key={edition.id}>
                    <Link href={`/NNN/${edition.id}`}>{nnnEditionTitle(edition)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link className="front-text-link" href="/NNN">All NNN editions</Link>
        </section>
      </div>

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

      {tea && (
        <section className="front-tea" aria-labelledby="front-tea-title">
          <p className="kicker kicker--tea">Campus Tea</p>
          <h2 id="front-tea-title">Anonymous posts, read by an editor before they go up.</h2>
          <Link className="front-text-link" href="/Tea">Open Campus Tea <span aria-hidden="true">→</span></Link>
        </section>
      )}

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
