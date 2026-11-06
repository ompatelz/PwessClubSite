import type { Metadata } from "next";
import GalleryManager from "@/Components/staff/GalleryManager";
import StaffShell from "@/Components/staff/StaffShell";
import { GALLERY_COLUMNS, groupByBatch, type GalleryPhoto } from "@/lib/gallery";
import { getStaffSession } from "@/lib/staff";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery · Staff desk",
  robots: { index: false, follow: false },
};

export default async function StaffGalleryPage() {
  const session = await getStaffSession();
  if (session.state !== "staff") return <StaffShell session={session} section="gallery">{null}</StaffShell>;

  const { data, error } = await session.supabase.from("gallery_photos").select(GALLERY_COLUMNS);
  const photos = (data ?? []) as GalleryPhoto[];
  const urls = Object.fromEntries(
    photos.map((photo) => [photo.id, session.supabase.storage.from("gallery").getPublicUrl(photo.thumb_path).data.publicUrl]),
  );

  return (
    <StaffShell session={session} section="gallery">
      <section className="staff-section" aria-labelledby="gallery-title">
        <div className="staff-section__head">
          <h1 id="gallery-title">Past members gallery</h1>
          <a className="staff-link-button" href="/Past-members" target="_blank" rel="noreferrer">View public page</a>
        </div>
        {error && <p className="staff-error" role="alert">The gallery could not be loaded. Refresh the page to try again.</p>}
        <GalleryManager batches={groupByBatch(photos)} urls={urls} canEdit={session.role !== "writer"} />
      </section>
    </StaffShell>
  );
}
