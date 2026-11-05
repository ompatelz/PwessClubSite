import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <p className="site-footer__wordmark">The Press Club</p>
      <p className="site-footer__statement">
        Campus reporting in the moment. College culture for the long view.
      </p>
      <div className="site-footer__meta">
        <span>Dhirubhai Ambani University</span>
        <nav aria-label="Footer navigation">
          <Link href="/Entelechy">Entelechy</Link>
          <Link href="/NNN">NNN</Link>
          <Link href="/Blog">Blog</Link>
          <Link href="/Editorial">How we publish</Link>
          <Link href="/Media-Consent">Media consent</Link>
          {process.env.TEA_ENABLED === "true" && <Link href="/Tea">Campus Tea</Link>}
          {process.env.TEA_ENABLED === "true" && <Link href="/press-club">Staff desk</Link>}
        </nav>
      </div>
    </footer>
  );
}
