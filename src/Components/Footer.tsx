import Link from "next/link";
import { CLUB_EMAIL_PARTS, mailtoClub, socialLinks } from "@/lib/club-links";

export default function Footer() {
  const social = socialLinks();

  return (
    <footer className="site-footer">
      <p className="site-footer__wordmark">The Press Club</p>
      <p className="site-footer__statement">
        Campus reporting in the moment. College culture for the long view.
      </p>

      <div className="site-footer__contact">
        <p className="site-footer__label">Contact</p>
        <a href={mailtoClub()} className="site-footer__email">{CLUB_EMAIL_PARTS[0]}@<wbr />{CLUB_EMAIL_PARTS[1]}</a>
        {social.length > 0 && (
          <ul className="site-footer__social" aria-label="The Press Club on social media">
            {social.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="site-footer__meta">
        <span>Dhirubhai Ambani University</span>
        <nav aria-label="Footer navigation">
          <Link href="/Entelechy">Entelechy</Link>
          <Link href="/NNN">NNN</Link>
          <Link href="/Blog">Blog</Link>
          <Link href="/Past-members">Past members</Link>
          <Link href="/Editorial">How we publish</Link>
          <Link href="/Media-Consent">Media consent</Link>
          <Link href="/Contact">Contact</Link>
          {process.env.TEA_ENABLED === "true" && <Link href="/Tea">Campus Tea</Link>}
          <Link href="/press-club" className="site-footer__staff">Staff sign in</Link>
        </nav>
      </div>
    </footer>
  );
}
