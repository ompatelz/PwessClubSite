-- Page images for the edition reader. A separate public bucket, so the existing
-- PDF-only Entelechy and NNN buckets keep their rules unchanged.
-- Layout: edition-pages/<Entelechy|NNN>/<row id>/{manifest.json,page-001-800.webp,...}
-- Uploads happen from the Supabase dashboard (or with the service role); the public
-- can only read, because there is no insert, update or delete policy for anon.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('edition-pages', 'edition-pages', true, 5242880, array['image/webp', 'application/json']::text[])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
