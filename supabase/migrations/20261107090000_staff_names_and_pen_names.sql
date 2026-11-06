-- Members choose their own name, and optionally a pen name, the first time they
-- sign in. The convenor only needs a member's DAU address to give them access.
--
-- name                  the member's real name; empty until they set it
-- pen_name              optional; used as the default byline on their posts
-- profile_completed_at  when the member last confirmed their names; empty means
--                       the desk asks for them before anything else

alter table public.staff_members alter column name drop not null;
alter table public.staff_members drop constraint if exists staff_members_name_check;
alter table public.staff_members
  add constraint staff_members_name_check
  check (name is null or char_length(trim(name)) between 2 and 100);

alter table public.staff_members
  add column if not exists pen_name text,
  add column if not exists profile_completed_at timestamptz;

alter table public.staff_members drop constraint if exists staff_members_pen_name_check;
alter table public.staff_members
  add constraint staff_members_pen_name_check
  check (pen_name is null or char_length(trim(pen_name)) between 2 and 60);

-- Members already on the list (with a name the convenor typed) keep it and are
-- still asked once to confirm it and add a pen name if they want one.

-- A member sets their own names. Only these fields change, only on their own row,
-- and only while their access is active; role and access stay with the convenor.
create or replace function public.set_my_staff_profile(new_name text, new_pen_name text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name text := nullif(trim(regexp_replace(coalesce(new_name, ''), '\s+', ' ', 'g')), '');
  clean_pen text := nullif(trim(regexp_replace(coalesce(new_pen_name, ''), '\s+', ' ', 'g')), '');
begin
  if public.staff_role() is null then
    raise exception 'Only active Press Club members can set a name here.'
      using errcode = 'insufficient_privilege';
  end if;
  if clean_name is null or char_length(clean_name) not between 2 and 100 then
    raise exception 'Add your name (2 to 100 characters).' using errcode = 'check_violation';
  end if;
  if clean_pen is not null and char_length(clean_pen) not between 2 and 60 then
    raise exception 'A pen name needs 2 to 60 characters.' using errcode = 'check_violation';
  end if;

  update public.staff_members
     set name = clean_name,
         pen_name = clean_pen,
         profile_completed_at = now()
   where email = public.staff_email()
     and active;
end;
$$;

revoke all on function public.set_my_staff_profile(text, text) from public, anon;
grant execute on function public.set_my_staff_profile(text, text) to authenticated;
