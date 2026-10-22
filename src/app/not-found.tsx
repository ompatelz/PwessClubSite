import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main id="main-content" className="site-main">
      <div className="story-empty">
        <strong>That page is not in this edition.</strong>
        <span>The link may be old, or the page may have moved.</span>
        <Link className="type-link" href="/">Return to the front page</Link>
      </div>
    </main>
  );
}
