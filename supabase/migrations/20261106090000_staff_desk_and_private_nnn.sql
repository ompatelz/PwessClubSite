-- Staff desk and college-only NNN.
--
-- Press Club members sign in with their DAU Google account (Supabase Auth). The
-- convenor keeps the staff list. Every permission below is enforced by the
-- database, so the website cannot grant more than these rules allow.
--
-- Roles:
--   convenor  manages the staff list; can do everything an editor can
--   editor    publishes and edits any post; adds and edits editions
--   writer    writes posts and submits them for review; cannot publish

-- 1. Staff list ---------------------------------------------------------------

create table if not exists public.staff_members (
  email text primary key
    check (email = lower(email) and email ~ '^[a-z0-9._%+-]+@dau\.ac\.in$'),
  name text not null check (char_length(trim(name)) between 2 and 100),
  role text not null check (role in ('convenor', 'editor', 'writer')),
  active boolean not null default true,
  added_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_members enable row level security;
revoke all on table public.staff_members from anon, authenticated;
grant select, insert, update, delete on table public.staff_members to authenticated;

-- The signed-in person's staff role, or null if they are not active staff.
-- Uses the email in the verified sign-in token and only accepts DAU addresses.
create or replace function public.staff_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.staff_members m
  where m.active
    and m.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and lower(coalesce(auth.jwt() ->> 'email', '')) like '%@dau.ac.in'
$$;

revoke all on function public.staff_role() from public, anon;
grant execute on function public.staff_role() to authenticated;

create or replace function public.staff_email()
returns text
language sql
stable
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

drop policy if exists "Staff can see the staff list" on public.staff_members;
create policy "Staff can see the staff list"
  on public.staff_members for select to authenticated
  using (public.staff_role() is not null);

drop policy if exists "Convenor adds members" on public.staff_members;
create policy "Convenor adds members"
  on public.staff_members for insert to authenticated
  with check (public.staff_role() = 'convenor');

drop policy if exists "Convenor edits members" on public.staff_members;
create policy "Convenor edits members"
  on public.staff_members for update to authenticated
  using (public.staff_role() = 'convenor')
  with check (public.staff_role() = 'convenor');

drop policy if exists "Convenor removes members" on public.staff_members;
create policy "Convenor removes members"
  on public.staff_members for delete to authenticated
  using (public.staff_role() = 'convenor');

-- Stamp who added or changed a member, and when.
create or replace function public.stamp_staff_member()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.added_by := coalesce(nullif(public.staff_email(), ''), new.added_by);
    new.email := lower(trim(new.email));
  else
    new.email := old.email;
    new.added_by := old.added_by;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists staff_members_stamp on public.staff_members;
create trigger staff_members_stamp
  before insert or update on public.staff_members
  for each row execute function public.stamp_staff_member();

-- The club must always keep at least one active convenor.
create or replace function public.keep_one_convenor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.staff_members where role = 'convenor' and active) then
    raise exception 'The Press Club needs at least one active convenor.'
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

-- Trigger-only functions: nobody needs to call these directly.
revoke all on function public.keep_one_convenor() from public, anon, authenticated;
revoke all on function public.stamp_staff_member() from public, anon, authenticated;

drop trigger if exists staff_members_keep_convenor on public.staff_members;
create trigger staff_members_keep_convenor
  after update or delete on public.staff_members
  for each statement execute function public.keep_one_convenor();

-- 2. Blog posts ---------------------------------------------------------------

alter table public.blog_posts
  add column if not exists created_by text,
  add column if not exists updated_by text;

-- "review" means a writer has submitted the post and an editor has not published it yet.
alter table public.blog_posts drop constraint if exists blog_posts_status_check;
alter table public.blog_posts
  add constraint blog_posts_status_check
  check (status in ('draft', 'review', 'published', 'archived'));

-- Drafts may be unfinished: the summary and body only need their full length
-- once a post is submitted for review or published.
alter table public.blog_posts drop constraint if exists blog_posts_excerpt_check;
alter table public.blog_posts
  add constraint blog_posts_excerpt_check
  check (char_length(trim(excerpt)) <= 320 and (status = 'draft' or char_length(trim(excerpt)) >= 20));
alter table public.blog_posts drop constraint if exists blog_posts_body_check;
alter table public.blog_posts
  add constraint blog_posts_body_check
  check (status = 'draft' or char_length(trim(body)) >= 40);

grant insert, update, delete on table public.blog_posts to authenticated;

create or replace function public.stamp_blog_post()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(nullif(public.staff_email(), ''), new.created_by);
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_by := coalesce(nullif(public.staff_email(), ''), new.updated_by);
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.stamp_blog_post() from public, anon, authenticated;

drop trigger if exists blog_posts_stamp on public.blog_posts;
create trigger blog_posts_stamp
  before insert or update on public.blog_posts
  for each row execute function public.stamp_blog_post();

drop policy if exists "Staff can read every post" on public.blog_posts;
create policy "Staff can read every post"
  on public.blog_posts for select to authenticated
  using (public.staff_role() is not null);

drop policy if exists "Editors create any post" on public.blog_posts;
create policy "Editors create any post"
  on public.blog_posts for insert to authenticated
  with check (public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Writers create unpublished posts" on public.blog_posts;
create policy "Writers create unpublished posts"
  on public.blog_posts for insert to authenticated
  with check (public.staff_role() = 'writer' and status in ('draft', 'review'));

drop policy if exists "Editors edit any post" on public.blog_posts;
create policy "Editors edit any post"
  on public.blog_posts for update to authenticated
  using (public.staff_role() in ('convenor', 'editor'))
  with check (public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Writers edit their own unpublished posts" on public.blog_posts;
create policy "Writers edit their own unpublished posts"
  on public.blog_posts for update to authenticated
  using (public.staff_role() = 'writer' and created_by = public.staff_email() and status in ('draft', 'review'))
  with check (public.staff_role() = 'writer' and created_by = public.staff_email() and status in ('draft', 'review'));

drop policy if exists "Editors delete posts" on public.blog_posts;
create policy "Editors delete posts"
  on public.blog_posts for delete to authenticated
  using (public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Writers delete their own drafts" on public.blog_posts;
create policy "Writers delete their own drafts"
  on public.blog_posts for delete to authenticated
  using (public.staff_role() = 'writer' and created_by = public.staff_email() and status = 'draft');

-- 3. Editions -----------------------------------------------------------------

grant insert, update, delete on table public."Entelechy" to authenticated;
grant insert, update, delete on table public."NNN" to authenticated;

drop policy if exists "Editors add Entelechy editions" on public."Entelechy";
create policy "Editors add Entelechy editions"
  on public."Entelechy" for insert to authenticated
  with check (public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Editors edit Entelechy editions" on public."Entelechy";
create policy "Editors edit Entelechy editions"
  on public."Entelechy" for update to authenticated
  using (public.staff_role() in ('convenor', 'editor'))
  with check (public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Editors remove Entelechy editions" on public."Entelechy";
create policy "Editors remove Entelechy editions"
  on public."Entelechy" for delete to authenticated
  using (public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Editors add NNN editions" on public."NNN";
create policy "Editors add NNN editions"
  on public."NNN" for insert to authenticated
  with check (public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Editors edit NNN editions" on public."NNN";
create policy "Editors edit NNN editions"
  on public."NNN" for update to authenticated
  using (public.staff_role() in ('convenor', 'editor'))
  with check (public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Editors remove NNN editions" on public."NNN";
create policy "Editors remove NNN editions"
  on public."NNN" for delete to authenticated
  using (public.staff_role() in ('convenor', 'editor'));

-- 4. NNN is for the DAU community only ----------------------------------------
-- Visitors may see which issues exist, but never where the PDF is stored, and
-- the NNN storage bucket is private. Issues reach readers only by email to a
-- @dau.ac.in address, sent by the server.

revoke select on table public."NNN" from anon, authenticated;
grant select (id, "Month", "Year", created_at) on table public."NNN" to anon, authenticated;
grant select ("Pdf_url") on table public."NNN" to authenticated;

update storage.buckets set public = false where id = 'NNN';

-- 5. Uploads ------------------------------------------------------------------

drop policy if exists "Editors upload edition files" on storage.objects;
create policy "Editors upload edition files"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('Entelechy', 'NNN', 'edition-pages') and public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Editors replace edition files" on storage.objects;
create policy "Editors replace edition files"
  on storage.objects for update to authenticated
  using (bucket_id in ('Entelechy', 'NNN', 'edition-pages') and public.staff_role() in ('convenor', 'editor'))
  with check (bucket_id in ('Entelechy', 'NNN', 'edition-pages') and public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Editors remove edition files" on storage.objects;
create policy "Editors remove edition files"
  on storage.objects for delete to authenticated
  using (bucket_id in ('Entelechy', 'NNN', 'edition-pages') and public.staff_role() in ('convenor', 'editor'));

drop policy if exists "Editors see private NNN files" on storage.objects;
create policy "Editors see private NNN files"
  on storage.objects for select to authenticated
  using (bucket_id = 'NNN' and public.staff_role() in ('convenor', 'editor'));
