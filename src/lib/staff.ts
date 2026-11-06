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
      name: string;
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
    .select("email,name,role,active")
    .eq("email", email)
    .maybeSingle();

  if (!member || !member.active) return { state: "not-staff", email };
  return { state: "staff", email, name: member.name, role: member.role as StaffRole, supabase };
}
