import Link from "next/link";

export default function Navbar() {
  return (
    <header className="site-rail">
      <Link href="/" className="site-rail__brand" aria-label="The Press Club home">
        Press Club
      </Link>

      <nav className="site-rail__nav" aria-label="Primary navigation">
        <Link href="/">Home</Link>
        <Link href="/NNN">NNN</Link>
        <Link href="/Entelechy">Entelechy</Link>
      </nav>

      <p className="site-rail__seal" aria-hidden="true">DAU</p>

      <details className="site-rail__menu">
        <summary>Menu</summary>
        <nav aria-label="Mobile navigation">
          <Link href="/">Home</Link>
          <Link href="/NNN">NNN</Link>
          <Link href="/Entelechy">Entelechy</Link>
        </nav>
      </details>
    </header>
  );
}
