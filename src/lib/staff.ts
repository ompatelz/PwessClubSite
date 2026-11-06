import { getServerSupabase } from "@/lib/supabase/server";

import type { StaffRole } from "@/lib/staff-roles";

export { ROLE_LABELS, canPublish, type StaffRole } from "@/lib/staff-roles";

export type StaffSession =
  | { state: "unconfigured" }
  | { state: "signed-out" }
  | { state: "not-staff"; email: string }
  | {
      state: "staff";
      email: string;
      /** What the desk calls the member: their name, or their address until they set one. */
      name: string;
      realName: string | null;
      penName: string | null;
      /** The default byline on their posts: the pen name if they chose one. */
      byline: string;
      /** True until the member has confirmed their name on the desk. */
      needsProfile: boolean;
      role: StaffRole;
      supabase: NonNullable<Awaited<ReturnType<typeof getServerSupabase>>>;
    };

// Who is using the staff desk. The sign-in token is verified (getClaims), and the
// staff list is read with the member's own session, so a removed or deactivated
// member is treated as not staff straight away.
export async function getStaffSession(): Promise<StaffSession> {
  const supabase = await getServerSupabase();
  if (!supabase) return { state: "unconfigured" };

  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email.toLowerCase() : "";
  if (!email) return { state: "signed-out" };

  const { data: member } = await supabase
    .from("staff_members")
    .select("email,name,pen_name,role,active,profile_completed_at")
    .eq("email", email)
    .maybeSingle();

  if (!member || !member.active) return { state: "not-staff", email };

  const realName: string | null = member.name ?? null;
  const penName: string | null = member.pen_name ?? null;
  const name = realName ?? email;
  return {
    state: "staff",
    email,
    name,
    realName,
    penName,
    byline: penName ?? realName ?? "",
    needsProfile: !member.profile_completed_at || !realName,
    role: member.role as StaffRole,
    supabase,
  };
}
