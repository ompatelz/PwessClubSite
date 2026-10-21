-- Anonymous submissions. Only the server-side service role can access this table.
-- Do not add anon or authenticated RLS policies for the review queue.
create table if not exists public.tea_posts (
  id uuid primary key default gen_random_uuid(),
  submitted_title text not null check (char_length(submitted_title) between 4 and 120),
  submitted_body text not null check (char_length(submitted_body) between 20 and 5000),
  edited_title text not null check (char_length(edited_title) between 4 and 120),
  edited_body text not null check (char_length(edited_body) between 20 and 5000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint tea_published_date check (status <> 'published' or published_at is not null)
);

alter table public.tea_posts enable row level security;
revoke all on table public.tea_posts from anon, authenticated;
grant all on table public.tea_posts to service_role;
create index if not exists tea_posts_review_order on public.tea_posts (created_at desc);
create index if not exists tea_posts_public_order on public.tea_posts (published_at desc)
  where status = 'published';
