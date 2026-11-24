-- Reviewed member replies, one upvote per member, and a private reports queue.
-- No direct browser access: all writes use the server after identity checks.
begin;
create table public.tea_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.tea_posts(id) on delete cascade,
  parent_id uuid,
  member_email text not null,
  author_name text not null check (char_length(author_name) between 1 and 200),
  submitted_body text not null check (char_length(btrim(submitted_body)) between 2 and 2000),
  body text not null check (char_length(btrim(body)) between 2 and 2000),
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  depth integer not null default 0 check (depth between 0 and 4),
  rules_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  reviewed_by text,
  unique(id,post_id),
  foreign key(parent_id,post_id) references public.tea_comments(id,post_id),
  check (status <> 'published' or published_at is not null)
);
create index tea_comments_thread on public.tea_comments(post_id,parent_id,published_at);
create index tea_comments_queue on public.tea_comments(status,created_at);
create table public.tea_votes (
  post_id uuid not null references public.tea_posts(id) on delete cascade,
  member_email text not null,
  created_at timestamptz not null default now(),
  primary key(post_id,member_email)
);
create table public.tea_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.tea_posts(id) on delete cascade,
  comment_id uuid,
  reason text not null check (reason in ('Harassment or hate','Private information','Unverified allegation','Spam or impersonation','Other rule violation')),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  foreign key(comment_id,post_id) references public.tea_comments(id,post_id)
);
create index tea_reports_queue on public.tea_reports(status,created_at);
alter table public.tea_comments enable row level security;
alter table public.tea_votes enable row level security;
alter table public.tea_reports enable row level security;
revoke all on public.tea_comments,public.tea_votes,public.tea_reports from anon,authenticated;
grant all on public.tea_comments,public.tea_votes,public.tea_reports to service_role;

-- Validate the parent chain in the database as well as at the API boundary.
create function public.check_tea_comment() returns trigger language plpgsql set search_path = '' as $$
declare p public.tea_comments; ancestor uuid; hops integer := 0;
begin
  if tg_op = 'UPDATE' then
    if new.post_id <> old.post_id or new.parent_id is distinct from old.parent_id
      or new.member_email <> old.member_email or new.author_name <> old.author_name
      or new.submitted_body <> old.submitted_body or new.rules_version <> old.rules_version then
      raise exception 'Reply identity, original and thread cannot change.';
    end if;
  end if;
  if tg_op = 'INSERT' or new.status = 'published' then
    perform 1 from public.tea_posts where id = new.post_id and status = 'published' and published_at <= now() for share;
    if not found then raise exception 'Thread is not available.'; end if;
    ancestor := new.parent_id;
    while ancestor is not null loop
      select * into p from public.tea_comments where id = ancestor and post_id = new.post_id for share;
      if not found or p.status <> 'published' or p.published_at > now() then raise exception 'Parent reply is not public.'; end if;
      hops := hops + 1;
      if hops > 4 then raise exception 'Maximum reply depth reached.'; end if;
      ancestor := p.parent_id;
    end loop;
    new.depth := hops;
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke all on function public.check_tea_comment() from public,anon,authenticated;
create trigger tea_comments_check before insert or update on public.tea_comments for each row execute function public.check_tea_comment();

-- Only this projection can leave the server. Recursive traversal hides every
-- descendant of an unpublished parent. Pagination selects whole root threads.
create function public.tea_public_comments(p_post_id uuid,p_offset integer default 0)
returns table(id uuid,parent_id uuid,author_name text,body text,published_at timestamptz,depth integer)
language sql stable security definer set search_path = '' as $$
  with recursive roots as (
    select c.* from public.tea_comments c join public.tea_posts p on p.id=c.post_id
    where c.post_id=p_post_id and c.parent_id is null and c.status='published'
      and c.published_at<=now() and p.status='published' and p.published_at<=now()
    order by c.published_at,c.id limit 20 offset greatest(p_offset,0)
  ), visible as (
    select r.id,r.parent_id,r.author_name,r.body,r.published_at,r.depth from roots r
    union all
    select c.id,c.parent_id,c.author_name,c.body,c.published_at,c.depth
      from public.tea_comments c join visible v on c.parent_id=v.id
      where c.post_id=p_post_id and c.status='published' and c.published_at<=now() and c.depth<=4
  ) select * from visible order by published_at,id
$$;
create function public.tea_discussion_counts(p_post_ids uuid[])
returns table(post_id uuid,votes bigint,replies bigint)
language sql stable security definer set search_path = '' as $$
  with recursive visible as (
    select c.id,c.post_id from public.tea_comments c join public.tea_posts p on p.id=c.post_id
    where c.post_id=any(p_post_ids) and c.parent_id is null and c.status='published' and c.published_at<=now()
      and p.status='published' and p.published_at<=now()
    union all
    select c.id,c.post_id from public.tea_comments c join visible v on c.parent_id=v.id and c.post_id=v.post_id
    where c.status='published' and c.published_at<=now()
  ) select p.id,(select count(*) from public.tea_votes v where v.post_id=p.id),
    (select count(*) from visible c where c.post_id=p.id)
    from public.tea_posts p where p.id=any(p_post_ids) and p.status='published' and p.published_at<=now()
$$;
revoke all on function public.tea_public_comments(uuid,integer),public.tea_discussion_counts(uuid[]) from public,anon,authenticated;
grant execute on function public.tea_public_comments(uuid,integer),public.tea_discussion_counts(uuid[]) to service_role;
commit;
