-- Keep public Tea reads behind RLS and expose only the fields rendered on the site.
grant select (id, edited_title, edited_body, published_at)
  on table public.tea_posts to anon, authenticated;

create policy "Published Tea posts are publicly readable"
  on public.tea_posts
  for select
  to anon, authenticated
  using (status = 'published' and published_at <= now());

-- Durable abuse control for server-side routes. No browser role can inspect or
-- mutate limiter records, and callers only receive an allow/deny boolean.
create table if not exists public.request_rate_limits (
  rate_key text primary key,
  request_count integer not null check (request_count > 0),
  reset_at timestamptz not null
);

alter table public.request_rate_limits enable row level security;
revoke all on table public.request_rate_limits from anon, authenticated;
grant all on table public.request_rate_limits to service_role;

create or replace function public.consume_request_rate_limit(
  rate_key text,
  request_limit integer,
  window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  next_count integer;
begin
  if request_limit < 1 or window_seconds < 1 or char_length(rate_key) <> 64 then
    return false;
  end if;

  insert into public.request_rate_limits as limits (rate_key, request_count, reset_at)
  values (rate_key, 1, now() + make_interval(secs => window_seconds))
  on conflict (rate_key) do update
    set request_count = case
          when limits.reset_at <= now() then 1
          else limits.request_count + 1
        end,
        reset_at = case
          when limits.reset_at <= now() then now() + make_interval(secs => window_seconds)
          else limits.reset_at
        end
  returning request_count into next_count;

  delete from public.request_rate_limits
    where reset_at < now() - interval '1 day';

  return next_count <= request_limit;
end;
$$;

revoke all on function public.consume_request_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_request_rate_limit(text, integer, integer) to service_role;

create table if not exists public.revoked_reviewer_sessions (
  session_hash text primary key check (char_length(session_hash) = 64),
  expires_at timestamptz not null
);

alter table public.revoked_reviewer_sessions enable row level security;
revoke all on table public.revoked_reviewer_sessions from anon, authenticated;
grant all on table public.revoked_reviewer_sessions to service_role;
