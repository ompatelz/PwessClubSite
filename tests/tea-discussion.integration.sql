-- Run in a test database after the migration. All fixture rows roll back.
begin;
do $$
declare p uuid := gen_random_uuid(); q uuid := gen_random_uuid(); r uuid := gen_random_uuid();
  child uuid := gen_random_uuid(); pending uuid := gen_random_uuid(); n integer;
begin
  if has_table_privilege('anon','public.tea_comments','select') or has_table_privilege('authenticated','public.tea_comments','insert')
    or has_table_privilege('anon','public.tea_reports','select') or has_table_privilege('authenticated','public.tea_votes','select')
    or has_function_privilege('anon','public.tea_public_comments(uuid,integer)','execute') then
    raise exception 'Private discussion data is accessible to browser roles';
  end if;
  insert into public.tea_posts(id,submitted_title,submitted_body,edited_title,edited_body,status,published_at)
  values (p,'Test fixture','Transaction-only fixture.','Test fixture','Transaction-only fixture.','published',now()),
    (q,'Other fixture','Transaction-only fixture.','Other fixture','Transaction-only fixture.','published',now());
  insert into public.tea_comments(id,post_id,member_email,author_name,submitted_body,body,rules_version,status,published_at)
    values(r,p,'fixture@dau.ac.in','Fixture','Root reply','Root reply','2026-11-24','published',now()),
      (pending,p,'fixture@dau.ac.in','Fixture','Pending reply','Pending reply','2026-11-24','pending',null);
  insert into public.tea_comments(id,post_id,parent_id,member_email,author_name,submitted_body,body,rules_version,status,published_at)
    values(child,p,r,'fixture@dau.ac.in','Fixture','Nested reply','Nested reply','2026-11-24','published',now());
  select count(*) into n from public.tea_public_comments(p,0);
  if n<>2 then raise exception 'Pending visibility or nesting failed: %',n; end if;
  if exists(select 1 from public.tea_public_comments(p,0) where id=child and depth<>1) then raise exception 'Incorrect nesting depth'; end if;
  begin
    insert into public.tea_comments(post_id,parent_id,member_email,author_name,submitted_body,body,rules_version)
      values(q,r,'fixture@dau.ac.in','Fixture','Cross thread','Cross thread','2026-11-24');
    raise exception 'Cross-thread parent accepted';
  exception when foreign_key_violation then null; when raise_exception then
    if sqlerrm <> 'Parent reply is not public.' then raise; end if;
  end;
  begin
    insert into public.tea_comments(post_id,parent_id,member_email,author_name,submitted_body,body,rules_version)
      values(p,pending,'fixture@dau.ac.in','Fixture','Hidden parent','Hidden parent','2026-11-24');
    raise exception 'Pending parent accepted';
  exception when raise_exception then if sqlerrm <> 'Parent reply is not public.' then raise; end if; end;
  insert into public.tea_votes(post_id,member_email) values(p,'fixture@dau.ac.in') on conflict do nothing;
  insert into public.tea_votes(post_id,member_email) values(p,'fixture@dau.ac.in') on conflict do nothing;
  if (select votes from public.tea_discussion_counts(array[p])) <> 1 then raise exception 'Duplicate upvote'; end if;
  update public.tea_comments set status='pending',published_at=null where id=r;
  if exists(select 1 from public.tea_public_comments(p,0)) then raise exception 'Unpublished ancestor leaked descendants'; end if;
  if (select replies from public.tea_discussion_counts(array[p])) <> 0 then raise exception 'Hidden descendants counted'; end if;
  update public.tea_posts set status='pending',published_at=null where id=p;
  if exists(select 1 from public.tea_discussion_counts(array[p])) then raise exception 'Unpublished post counted'; end if;
end $$;
rollback;
