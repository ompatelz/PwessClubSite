import type { Metadata } from "next";
import Link from "next/link";
import { CLUB_EMAIL_PARTS, mailtoClub, socialLinks } from "@/lib/club-links";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write to the DAU Press Club: story tips, corrections, contributions and joining the club.",
};

const REASONS = [
  { title: "Story tips", text: "Something on campus we should cover? Tell us what happened and who we can talk to.", subject: "Story tip" },
  { title: "Corrections", text: "If we got something wrong, tell us the page and what needs fixing. We correct errors openly.", subject: "Correction request" },
  { title: "Write for us", text: "Pitch a blog post or send writing, poetry or art for the next Entelechy.", subject: "Contribution" },
  { title: "Join the club", text: "Want to report, edit, design or photograph? We take new members every year.", subject: "Joining the Press Club" },
];

export default function ContactPage() {
  const social = socialLinks();

  return (
    <main id="main-content" className="site-main contact-page">
      <header className="contact-header">
        <h1>Contact the Press Club.</h1>
        <p>
          Email reaches the editors directly. We usually reply within a few days, faster
          during an edition week.
        </p>
        <a className="contact-email" href={mailtoClub()}>
          <span className="contact-email__label">Email</span>
          <span className="contact-email__address">{CLUB_EMAIL_PARTS[0]}@<wbr />{CLUB_EMAIL_PARTS[1]}</span>
        </a>
      </header>

      <section className="contact-reasons" aria-labelledby="contact-reasons-title">
        <h2 id="contact-reasons-title">What to write about</h2>
        <ul>
          {REASONS.map((reason) => (
            <li key={reason.title}>
              <h3>{reason.title}</h3>
              <p>{reason.text}</p>
              <a className="studio-link" href={mailtoClub(reason.subject)}>
                Email about this <span aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {social.length > 0 && (
        <section className="contact-social" aria-labelledby="contact-social-title">
          <h2 id="contact-social-title">Follow along</h2>
          <ul>
            {social.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  <strong>{link.label}</strong>
                  <span>{link.note}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="contact-staff" aria-labelledby="contact-staff-title">
        <h2 id="contact-staff-title">Press Club members</h2>
        <p>Write, publish and add editions from the staff desk with your DAU Google account.</p>
        <Link className="studio-link" href="/press-club">Staff sign in <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
