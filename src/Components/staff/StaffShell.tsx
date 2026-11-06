import Link from "next/link";
import type { ReactNode } from "react";
import ProfileForm from "@/Components/staff/ProfileForm";
import SignInPanel from "@/Components/staff/SignInPanel";
import { ROLE_LABELS, type StaffSession } from "@/lib/staff";
import { teaEnabled } from "@/lib/tea";
import "@/app/staff-desk.css";

type Section = "posts" | "editions" | "members" | "profile";

function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className="staff-link-button">Sign out</button>
    </form>
  );
}

// Everything on the staff desk renders inside this shell. When the visitor is
// not active staff it shows the right message instead of the page's content.
export default function StaffShell({
  session,
  section,
  signInFailed,
  children,
}: {
  session: StaffSession;
  section: Section;
  signInFailed?: boolean;
  children: ReactNode;
}) {
  if (session.state !== "staff") {
    return (
      <main id="main-content" className="site-main staff-desk staff-desk--gate">
        <header className="staff-gate">
          <p className="kicker">The Press Club</p>
          <h1>Staff desk</h1>
          {session.state === "unconfigured" && <p>The staff desk is not connected in this environment.</p>}
          {session.state === "signed-out" && (
            <>
              <p>Write and publish blog posts, add Entelechy and NNN editions, and manage the team.</p>
              <SignInPanel failed={signInFailed} />
            </>
          )}
          {session.state === "not-staff" && (
            <>
              <p>
                You&apos;re signed in as <strong>{session.email}</strong>, which isn&apos;t on the Press Club staff list.
                Ask the convenor to add this address, then sign in again.
              </p>
              <SignOutButton />
            </>
          )}
        </header>
      </main>
    );
  }

  const tabs: { id: Section | "tea"; label: string; href: string }[] = [
    { id: "posts", label: "Blog posts", href: "/press-club" },
    { id: "editions", label: "Editions", href: "/press-club/editions" },
    { id: "members", label: "Team", href: "/press-club/members" },
  ];
  if (teaEnabled()) tabs.push({ id: "tea", label: "Campus Tea", href: "/press-club/tea" });

  // New members (and anyone whose name isn't set) say who they are first.
  if (session.needsProfile) {
    return (
      <main id="main-content" className="site-main staff-desk">
        <section className="staff-section staff-section--narrow" aria-label="Your name">
          <ProfileForm email={session.email} name={session.realName} penName={session.penName} firstTime />
          <SignOutButton />
        </section>
      </main>
    );
  }

  return (
    <main id="main-content" className="site-main staff-desk">
      <header className="staff-bar">
        <div className="staff-bar__who">
          <p className="kicker">Staff desk</p>
          <p className="staff-bar__name">
            {session.name} <span className={`staff-role staff-role--${session.role}`}>{ROLE_LABELS[session.role]}</span>
          </p>
          {session.penName && <p className="staff-bar__pen">Writes as {session.penName}</p>}
        </div>
        <nav className="staff-tabs" aria-label="Staff desk sections">
          {tabs.map((tab) => (
            <Link key={tab.id} href={tab.href} aria-current={tab.id === section ? "page" : undefined}>{tab.label}</Link>
          ))}
        </nav>
        <div className="staff-bar__account">
          <Link href="/press-club/profile" className="staff-link-button" aria-current={section === "profile" ? "page" : undefined}>Your name</Link>
          <SignOutButton />
        </div>
      </header>
      {children}
    </main>
  );
}
