-- Editors need to read edition files, not only write them. Supabase Storage asks
-- for SELECT as well as INSERT and UPDATE when an upload replaces a file (the
-- staff desk uploads page images with upsert), and listing a folder (used to
-- clear an edition's page images when it is removed) is a SELECT too.
-- Visitors are unaffected: Entelechy and edition-pages stay public buckets, and
-- NNN stays private.

drop policy if exists "Editors see private NNN files" on storage.objects;
drop policy if exists "Editors see edition files" on storage.objects;

create policy "Editors see edition files"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('Entelechy', 'NNN', 'edition-pages')
    and public.staff_role() in ('convenor', 'editor')
  );
