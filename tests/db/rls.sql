\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'chaidezjason@gmail.com'),
  ('22222222-2222-4222-8222-222222222222', 'someone@example.com')
on conflict (id) do nothing;

insert into public.admin_users (user_id, email)
values ('11111111-1111-4111-8111-111111111111', 'chaidezjason@gmail.com')
on conflict (user_id) do nothing;

delete from public.projects where slug in ('rls-published', 'rls-draft', 'rls-anon-insert', 'rls-user-insert', 'rls-admin-insert');
insert into public.projects (name, slug, year, published, project_value) values ('RLS published', 'rls-published', 2025, true, 185000);
insert into public.projects (name, slug, year, published) values ('RLS draft', 'rls-draft', 2025, false);
delete from public.contact_messages where name = 'RLS test';
insert into public.contact_messages (name, contact, message, locale) values ('RLS test', 'rls@example.com', 'Message for the admin only', 'en');

create or replace function pg_temp.assert_true(condition boolean, label text)
returns void language plpgsql as $$
begin
  if not condition then raise exception 'ASSERTION FAILED: %', label; end if;
end $$;

create or replace function pg_temp.try_project_insert(slug text)
returns boolean language plpgsql as $$
begin
  insert into public.projects (name, slug, year) values ('RLS insert', slug, 2025);
  return true;
exception when others then
  return false;
end $$;

create or replace function pg_temp.try_message_delete()
returns integer language plpgsql as $$
declare n integer;
begin
  delete from public.contact_messages where name = 'RLS test';
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function pg_temp.try_storage_insert()
returns boolean language plpgsql as $$
begin
  insert into storage.objects (bucket_id, name) values ('project-images', 'projects/test/rls.jpg');
  return true;
exception when others then
  return false;
end $$;

set role anon;
select set_config('request.jwt.claim.sub', '', false);
select pg_temp.assert_true((select count(*) from public.projects where slug like 'rls-%') = 1, 'anon sees only the published project');
select pg_temp.assert_true((select project_value from public.projects where slug = 'rls-published') = 185000, 'anon can read the project value');
select pg_temp.assert_true(pg_temp.try_project_insert('rls-anon-insert') = false, 'anon cannot insert projects');
select pg_temp.assert_true((select count(*) from public.contact_messages) = 0, 'anon cannot read messages');
select pg_temp.assert_true(public.is_admin() = false, 'anon is not admin');
select pg_temp.assert_true(pg_temp.try_storage_insert() = false, 'anon cannot upload to storage');
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
select pg_temp.assert_true(public.is_admin() = false, 'a signed in user who is not registered is not admin');
select pg_temp.assert_true((select count(*) from public.projects where slug like 'rls-%') = 0, 'unregistered user cannot read projects through admin policies');
select pg_temp.assert_true(pg_temp.try_project_insert('rls-user-insert') = false, 'unregistered user cannot insert projects');
select pg_temp.assert_true((select count(*) from public.contact_messages) = 0, 'unregistered user cannot read messages');
select pg_temp.assert_true(pg_temp.try_message_delete() = 0, 'unregistered user cannot delete messages');
select pg_temp.assert_true(pg_temp.try_storage_insert() = false, 'unregistered user cannot upload to storage');
select pg_temp.assert_true((select count(*) from public.admin_users) = 0, 'unregistered user cannot read the admin list');
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
select pg_temp.assert_true(public.is_admin() = true, 'registered admin is admin');
select pg_temp.assert_true((select count(*) from public.projects where slug like 'rls-%') = 2, 'admin reads drafts and published projects');
select pg_temp.assert_true(pg_temp.try_project_insert('rls-admin-insert') = true, 'admin can insert projects');
update public.projects set published = true where slug = 'rls-admin-insert';
select pg_temp.assert_true((select published from public.projects where slug = 'rls-admin-insert') = true, 'admin can update projects');
select pg_temp.assert_true((select count(*) from public.contact_messages where name = 'RLS test') = 1, 'admin can read messages');
select pg_temp.assert_true(pg_temp.try_message_delete() = 1, 'admin can delete messages');
select pg_temp.assert_true(pg_temp.try_storage_insert() = true, 'admin can upload to storage');
select pg_temp.assert_true((select count(*) from public.admin_users) = 1, 'admin can read the admin list');
delete from public.projects where slug like 'rls-%';
reset role;

delete from storage.objects where name = 'projects/test/rls.jpg';
delete from public.admin_users where user_id = '11111111-1111-4111-8111-111111111111';
delete from auth.users where id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');
select 'RLS checks passed' as result;
