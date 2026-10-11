import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer foot-statement">
      <p className="foot-statement__line">
        What happens here should not disappear.
      </p>
      <div className="foot-statement__meta">
        <span>The Press Club · Dhirubhai Ambani University</span>
        <nav aria-label="Footer navigation">
          <Link href="/">Home</Link>
          <Link href="/NNN">NNN</Link>
          <Link href="/Entelechy">Entelechy</Link>
        </nav>
      </div>
    </footer>
  );
}
