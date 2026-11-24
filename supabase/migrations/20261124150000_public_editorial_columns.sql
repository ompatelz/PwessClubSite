-- Public projections exclude internal staff addresses. A Google login alone
-- is not staff membership, so authenticated full reads also need staff RLS.
begin;
revoke select on public.blog_posts,public.gallery_photos from anon;
revoke select (created_by,updated_by) on public.blog_posts from anon;
revoke select (created_by) on public.gallery_photos from anon;
grant select (id,slug,title,excerpt,body,author,status,published_at,created_at,updated_at)
  on public.blog_posts to anon;
grant select (id,batch,people,caption,image_path,thumb_path,width,height,created_at)
  on public.gallery_photos to anon;
alter policy "Public can read published blog posts" on public.blog_posts to anon;
alter policy "Anyone can see the gallery" on public.gallery_photos to anon;
-- Existing Staff can read every post policy still permits the authenticated desk.
create policy "Active staff can read gallery metadata" on public.gallery_photos
  for select to authenticated using (public.staff_role() is not null);
commit;
