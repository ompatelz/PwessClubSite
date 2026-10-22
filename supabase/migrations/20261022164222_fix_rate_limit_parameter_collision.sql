-- Avoid PostgreSQL treating the rate_key function argument as an ambiguous
-- reference to the request_rate_limits.rate_key column in ON CONFLICT.
create or replace function public.consume_request_rate_limit(
  rate_key text,
  request_limit integer,
  window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_count integer;
begin
  if request_limit < 1 or window_seconds < 1 or char_length(rate_key) <> 64 then
    return false;
  end if;

  insert into public.request_rate_limits as limits (rate_key, request_count, reset_at)
  values (rate_key, 1, now() + make_interval(secs => window_seconds))
  on conflict on constraint request_rate_limits_pkey do update
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

revoke all on function public.consume_request_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_request_rate_limit(text, integer, integer)
  to service_role;
