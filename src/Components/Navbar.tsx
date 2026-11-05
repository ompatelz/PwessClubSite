import Link from "next/link";
import ActiveNavLink from "./ActiveNavLink";
import { teaEnabled } from "@/lib/tea";

// Newspaper masthead: nameplate on the left, sections on the right, each section
// marked with its format ink. Phones get the same links in a menu.
export default function Navbar() {
  const tea = teaEnabled();

  return (
    <header className="masthead">
      <div className="masthead__bar">
        <Link href="/" className="masthead__nameplate" aria-label="The Press Club home">
          <span className="masthead__name">The Press Club</span>
          <span className="masthead__school">Dhirubhai Ambani University</span>
        </Link>

        <nav className="masthead__nav" aria-label="Primary navigation">
          <span className="masthead__group" role="group" aria-label="Publications">
            <ActiveNavLink href="/Entelechy" className="masthead__link masthead__link--entelechy">Entelechy</ActiveNavLink>
            <ActiveNavLink href="/NNN" className="masthead__link masthead__link--nnn">NNN</ActiveNavLink>
          </span>
          <span className="masthead__group" role="group" aria-label="Between editions">
            <ActiveNavLink href="/Blog" className="masthead__link masthead__link--blog">Blog</ActiveNavLink>
            {tea && <ActiveNavLink href="/Tea" className="masthead__link masthead__link--tea">Campus Tea</ActiveNavLink>}
          </span>
          <ActiveNavLink href="/Editorial" className="masthead__link masthead__link--plain">How we publish</ActiveNavLink>
        </nav>

        <details className="masthead__menu">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            <ActiveNavLink href="/">Front page</ActiveNavLink>
            <span className="masthead__menu-label">Publications</span>
            <ActiveNavLink href="/Entelechy" className="masthead__link--entelechy">Entelechy</ActiveNavLink>
            <ActiveNavLink href="/NNN" className="masthead__link--nnn">News and Nonsense</ActiveNavLink>
            <span className="masthead__menu-label">Between editions</span>
            <ActiveNavLink href="/Blog" className="masthead__link--blog">Blog</ActiveNavLink>
            {tea && <ActiveNavLink href="/Tea" className="masthead__link--tea">Campus Tea</ActiveNavLink>}
            <span className="masthead__menu-label">About</span>
            <ActiveNavLink href="/Editorial">How we publish</ActiveNavLink>
          </nav>
        </details>
      </div>
    </header>
  );
}
