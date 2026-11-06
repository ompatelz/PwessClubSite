import type { Metadata } from "next";
import ArchiveState from "@/Components/ArchiveState";
import GalleryGrid from "@/Components/GalleryGrid";
import { galleryUrl, getGallery } from "@/lib/gallery";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Past members",
  description: "The people who made the DAU Press Club, batch by batch.",
};

export default async function PastMembersPage() {
  const gallery = await getGallery();

  return (
    <main id="main-content" className="site-main gallery-page">
      <header className="gallery-header">
        <h1>Past members.</h1>
        <p>
          Every edition was made by a batch of students who reported, edited, designed and
          argued over commas. These are the people behind the Press Club, year by year.
        </p>
      </header>

      {gallery.status !== "ok" ? (
        <ArchiveState
          title="The gallery could not be reached."
          message="Please check back soon."
        />
      ) : gallery.batches.length === 0 ? (
        <ArchiveState
          title="No batch photos yet."
          message="Photos of past Press Club batches will appear here as they are added."
        />
      ) : (
        <>
          {gallery.batches.length > 1 && (
            <nav className="gallery-batches" aria-label="Jump to a batch">
              {gallery.batches.map(({ batch }) => (
                <a key={batch} href={`#batch-${encodeURIComponent(batch)}`}>{batch}</a>
              ))}
            </nav>
          )}
          {gallery.batches.map(({ batch, photos }) => (
            <section key={batch} id={`batch-${encodeURIComponent(batch)}`} className="gallery-batch" aria-labelledby={`batch-title-${encodeURIComponent(batch)}`}>
              <h2 id={`batch-title-${encodeURIComponent(batch)}`}>
                {batch} <span>{photos.length} {photos.length === 1 ? "photo" : "photos"}</span>
              </h2>
              <GalleryGrid
                photos={photos.map((photo) => ({
                  id: photo.id,
                  thumb: galleryUrl(photo.thumb_path),
                  full: galleryUrl(photo.image_path),
                  width: photo.width,
                  height: photo.height,
                  people: photo.people,
                  caption: photo.caption,
                  batch: photo.batch,
                }))}
              />
            </section>
          ))}
        </>
      )}
    </main>
  );
}
