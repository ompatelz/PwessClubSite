import { getSupabaseClient } from "@/lib/supabase";

export type GalleryPhoto = {
  id: number;
  batch: string;
  people: string | null;
  caption: string | null;
  image_path: string;
  thumb_path: string;
  width: number;
  height: number;
  created_at: string;
};

export const GALLERY_COLUMNS = "id,batch,people,caption,image_path,thumb_path,width,height,created_at";

export type GalleryBatch = { batch: string; photos: GalleryPhoto[] };

// Newest batch first ("2025–26" before "2024–25"); photos in the order they were added.
export function groupByBatch(photos: GalleryPhoto[]): GalleryBatch[] {
  const batches = new Map<string, GalleryPhoto[]>();
  for (const photo of photos) {
    const list = batches.get(photo.batch) ?? [];
    list.push(photo);
    batches.set(photo.batch, list);
  }
  return [...batches.entries()]
    .sort(([a], [b]) => b.localeCompare(a, "en", { numeric: true }))
    .map(([batch, list]) => ({
      batch,
      photos: list.sort((a, b) => a.created_at.localeCompare(b.created_at)),
    }));
}

export async function getGallery() {
  const supabase = getSupabaseClient();
  if (!supabase) return { status: "unconfigured" as const, batches: [] };
  const { data, error } = await supabase.from("gallery_photos").select(GALLERY_COLUMNS);
  if (error) return { status: "error" as const, batches: [] };
  return { status: "ok" as const, batches: groupByBatch((data ?? []) as GalleryPhoto[]) };
}

export function galleryUrl(path: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return path;
  return supabase.storage.from("gallery").getPublicUrl(path).data.publicUrl;
}
