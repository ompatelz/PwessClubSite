import type { Metadata } from "next";
import ProfileForm from "@/Components/staff/ProfileForm";
import StaffShell from "@/Components/staff/StaffShell";
import { getStaffSession } from "@/lib/staff";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your name · Staff desk",
  robots: { index: false, follow: false },
};

export default async function StaffProfilePage() {
  const session = await getStaffSession();
  if (session.state !== "staff") return <StaffShell session={session} section="profile">{null}</StaffShell>;

  return (
    <StaffShell session={session} section="profile">
      <section className="staff-section staff-section--narrow" aria-label="Your name">
        <ProfileForm email={session.email} name={session.realName} penName={session.penName} firstTime={false} />
      </section>
    </StaffShell>
  );
}
