import type { Metadata } from "next";
import EditionsManager from "@/Components/staff/EditionsManager";
import StaffShell from "@/Components/staff/StaffShell";
import { canPublish, getStaffSession } from "@/lib/staff";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editions · Staff desk",
  robots: { index: false, follow: false },
};

export default async function StaffEditionsPage() {
  const session = await getStaffSession();
  if (session.state !== "staff") return <StaffShell session={session} section="editions">{null}</StaffShell>;

  const [entelechy, nnn] = await Promise.all([
    session.supabase.from("Entelechy").select("id,edition,pdf_url,created_at").order("edition", { ascending: false }),
    session.supabase.from("NNN").select("id,Month,Year,Pdf_url,created_at").order("Year", { ascending: false }).order("Month", { ascending: false }),
  ]);

  // Which Entelechy editions already have page images (a manifest in their folder).
  // Only editors and the convenor can list that bucket, and only they see the
  // "Make page images" button, so writers skip the check.
  const canEdit = canPublish(session.role);
  const editions = canEdit
    ? await Promise.all(
        (entelechy.data ?? []).map(async (edition) => {
          const { data } = await session.supabase.storage
            .from("edition-pages")
            .list(`Entelechy/${edition.id}`, { limit: 10, search: "manifest" });
          return { ...edition, hasPages: Boolean(data?.some((item) => item.name === "manifest.json")) };
        }),
      )
    : entelechy.data ?? [];

  return (
    <StaffShell session={session} section="editions">
      <section className="staff-section" aria-labelledby="editions-title">
        <h1 id="editions-title">Editions</h1>
        {(entelechy.error || nnn.error) && <p className="staff-error" role="alert">Editions could not be loaded. Refresh the page to try again.</p>}
        <EditionsManager entelechy={editions} nnn={nnn.data ?? []} canEdit={canEdit} />
      </section>
    </StaffShell>
  );
}
