import Link from "next/link";
import ActiveNavLink from "./ActiveNavLink";

export default function Navbar() {
  return (
    <header className="site-rail">
      <Link href="/" className="site-rail__brand" aria-label="The Press Club home">
        Press Club
      </Link>

      <nav className="site-rail__nav" aria-label="Primary navigation">
        <ActiveNavLink href="/">Home</ActiveNavLink>
        <span className="site-rail__group" role="group" aria-label="Publications">
          <ActiveNavLink href="/Entelechy">Entelechy</ActiveNavLink>
          <ActiveNavLink href="/NNN">NNN</ActiveNavLink>
        </span>
        <span className="site-rail__group" role="group" aria-label="Between editions">
          <ActiveNavLink href="/Blog">Blog</ActiveNavLink>
          {process.env.TEA_ENABLED === "true" && <ActiveNavLink href="/Tea">Tea</ActiveNavLink>}
        </span>
      </nav>

      <p className="site-rail__seal" aria-hidden="true">DAU</p>

      <details className="site-rail__menu">
        <summary>Menu</summary>
        <nav aria-label="Mobile navigation">
          <ActiveNavLink href="/">Home</ActiveNavLink>
          <span className="site-rail__menu-label">Publications</span>
          <ActiveNavLink href="/Entelechy">Entelechy</ActiveNavLink>
          <ActiveNavLink href="/NNN">News and Nonsense</ActiveNavLink>
          <span className="site-rail__menu-label">Between editions</span>
          <ActiveNavLink href="/Blog">Blog</ActiveNavLink>
          {process.env.TEA_ENABLED === "true" && <ActiveNavLink href="/Tea">Campus Tea</ActiveNavLink>}
        </nav>
      </details>
    </header>
  );
}
