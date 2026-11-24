-- Trial-only fixtures. No posts, photos, accounts or tokens survive rollback.
begin;
select set_config('test.staff_email','security-check-'||gen_random_uuid()::text||'@dau.ac.in',true);
insert into public.staff_members(email,name,role,active) values(current_setting('test.staff_email'),'Security fixture','writer',true);
with post as (
  insert into public.blog_posts(slug,title,excerpt,body,author,status,published_at,created_by,updated_by)
  values('security-check-'||gen_random_uuid()::text,'Security check fixture','Transaction-only security test summary.',
    'Transaction-only security test body with enough characters.','Security fixture','published',now(),'private@dau.ac.in','private@dau.ac.in') returning id
) select set_config('test.post_id',id::text,true) from post;
with photo as (
  insert into public.gallery_photos(batch,people,caption,image_path,thumb_path,width,height)
  values('Security fixture','Test','Transaction-only fixture','test/fixture.webp','test/thumb.webp',100,100) returning id
) select set_config('test.photo_id',id::text,true) from photo;
do $$ begin
  if has_column_privilege('anon','public.blog_posts','created_by','SELECT')
    or has_column_privilege('anon','public.blog_posts','updated_by','SELECT')
    or has_column_privilege('anon','public.gallery_photos','created_by','SELECT') then
    raise exception 'Anonymous role can read private editorial columns';
  end if;
end $$;
set local role anon;
do $$ begin
  if (select count(id) from public.blog_posts where id=current_setting('test.post_id')::bigint) <> 1
    or (select count(id) from public.gallery_photos where id=current_setting('test.photo_id')::bigint) <> 1 then
    raise exception 'Public content projection stopped working';
  end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"email":"not-staff-security-check@outside.example"}',true);
do $$ begin
  if exists(select created_by from public.blog_posts where id=current_setting('test.post_id')::bigint)
    or exists(select created_by from public.gallery_photos where id=current_setting('test.photo_id')::bigint) then
    raise exception 'Ordinary signed-in user can read staff metadata';
  end if;
end $$;
select set_config('request.jwt.claims',json_build_object('email',current_setting('test.staff_email'))::text,true);
do $$ begin
  if (select count(*) from (select created_by,updated_by from public.blog_posts where id=current_setting('test.post_id')::bigint) p) <> 1
    or (select count(*) from (select created_by from public.gallery_photos where id=current_setting('test.photo_id')::bigint) p) <> 1 then
    raise exception 'Active staff lost editorial reads';
  end if;
end $$;
reset role;
rollback;
