import type { Metadata } from "next";
import MembersManager from "@/Components/staff/MembersManager";
import StaffShell from "@/Components/staff/StaffShell";
import { getStaffSession } from "@/lib/staff";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team · Staff desk",
  robots: { index: false, follow: false },
};

export default async function StaffMembersPage() {
  const session = await getStaffSession();
  if (session.state !== "staff") return <StaffShell session={session} section="members">{null}</StaffShell>;

  const { data, error } = await session.supabase
    .from("staff_members")
    .select("email,name,pen_name,role,active,added_by,created_at,profile_completed_at")
    .order("active", { ascending: false })
    .order("role", { ascending: true })
    .order("name", { ascending: true });

  return (
    <StaffShell session={session} section="members">
      <section className="staff-section" aria-labelledby="members-title">
        <h1 id="members-title">Team</h1>
        {session.role !== "convenor" && <p className="staff-hint">Only the convenor can add members or change roles.</p>}
        {error && <p className="staff-error" role="alert">The team list could not be loaded. Refresh the page to try again.</p>}
        <MembersManager members={data ?? []} isConvenor={session.role === "convenor"} me={session.email} />
      </section>
    </StaffShell>
  );
}
