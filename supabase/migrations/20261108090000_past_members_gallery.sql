-- Past members gallery: photos of each Press Club batch.
-- Everyone can see the gallery. Editors and the convenor add, edit and remove
-- photos from the staff desk. The desk resizes photos in the browser before upload.

create table if not exists public.gallery_photos (
  id bigint generated always as identity primary key,
  batch text not null check (char_length(trim(batch)) between 2 and 40),
  people text check (people is null or char_length(people) <= 400),
  caption text check (caption is null or char_length(caption) <= 300),
  image_path text not null check (char_length(image_path) between 5 and 300),
  thumb_path text not null check (char_length(thumb_path) between 5 and 300),
  width integer not null check (width between 1 and 10000),
  height integer not null check (height between 1 and 10000),
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists gallery_photos_batch_idx on public.gallery_photos (batch, created_at);

alter table public.gallery_photos enable row level security;
revoke all on table public.gallery_photos from anon, authenticated;
grant select on table public.gallery_photos to anon, authenticated;
grant insert, update, delete on table public.gallery_photos to authenticated;

drop policy if exists "Anyone can see the gallery" on public.gallery_photos;
create policy "Anyone can see the gallery"
  on public.gallery_photos for select to anon, authenticated
  using (true);

drop policy if exists "Editors add gallery photos" on public.gallery_photos;
create policy "Editors add gallery photos"
  on public.gallery_photos for insert to authenticated
  with check (public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Editors edit gallery photos" on public.gallery_photos;
create policy "Editors edit gallery photos"
  on public.gallery_photos for update to authenticated
  using (public.staff_role() in ('convenor', 'editor'))
  with check (public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Editors remove gallery photos" on public.gallery_photos;
create policy "Editors remove gallery photos"
  on public.gallery_photos for delete to authenticated
  using (public.staff_role() in ('convenor', 'editor'));

-- Who added a photo is recorded by the database, not the browser.
create or replace function public.stamp_gallery_photo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := nullif(public.staff_email(), '');
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.image_path := old.image_path;
    new.thumb_path := old.thumb_path;
  end if;
  new.batch := trim(regexp_replace(new.batch, '\s+', ' ', 'g'));
  return new;
end;
$$;

revoke all on function public.stamp_gallery_photo() from public, anon, authenticated;

drop trigger if exists gallery_photos_stamp on public.gallery_photos;
create trigger gallery_photos_stamp
  before insert or update on public.gallery_photos
  for each row execute function public.stamp_gallery_photo();

-- Photo storage: public to view, editors upload. Only resized WebP images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 3145728, array['image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 3145728, allowed_mime_types = array['image/webp'];

drop policy if exists "Editors upload gallery photos" on storage.objects;
create policy "Editors upload gallery photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Editors see gallery files" on storage.objects;
create policy "Editors see gallery files"
  on storage.objects for select to authenticated
  using (bucket_id = 'gallery' and public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Editors remove gallery files" on storage.objects;
create policy "Editors remove gallery files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and public.staff_role() in ('convenor', 'editor'));
