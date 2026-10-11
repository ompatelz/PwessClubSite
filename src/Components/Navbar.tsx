import Link from "next/link";

export default function Navbar() {
  return (
    <header className="nav-pill-shell">
      <nav className="nav-pill" aria-label="Primary navigation">
        <Link href="/" className="nav-pill__brand" aria-label="The Press Club home">
          Press Club <span aria-hidden="true">/ DAU</span>
        </Link>

        <div className="nav-pill__links">
          <Link href="/">Home</Link>
          <Link href="/NNN">NNN</Link>
          <Link href="/Entelechy">Entelechy</Link>
        </div>

        <details className="nav-pill__menu">
          <summary>Menu</summary>
          <div className="nav-pill__sheet">
            <Link href="/">Home</Link>
            <Link href="/NNN">NNN</Link>
            <Link href="/Entelechy">Entelechy</Link>
          </div>
        </details>
      </nav>
    </header>
  );
}
