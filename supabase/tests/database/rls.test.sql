-- RLS contract (11-SECURITY): anonymous and user B are refused, user A can do what the app needs.
-- LOCAL stack only: `supabase start && supabase db reset && supabase test db`.
-- NOT RUN YET — files only until Thomas starts the local stack (MEMORY.md → Decisions).
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

-- two TEST users, created inside this transaction and rolled back at the end
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'test-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'test-b@example.test');

create or replace function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- ── user A creates their data ───────────────────────────────────────────────
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.dishes (id, name) values ('10000000-0000-0000-0000-000000000001', 'TEST - dish A 2026-10-10');
insert into public.recipes (dish_id, servings, ingredients, steps)
  values ('10000000-0000-0000-0000-000000000001', 2, '[]', '[]');
insert into public.meals (dish_id) values ('10000000-0000-0000-0000-000000000001');

select is((select count(*) from public.dishes)::int, 1, 'A sees their own dish');
select is((select count(*) from public.recipes)::int, 1, 'A sees their own recipe');
select is((select count(*) from public.meals)::int, 1, 'A sees their own meal');

-- ── user B sees and changes nothing of A's ─────────────────────────────────
reset role;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select is((select count(*) from public.dishes)::int, 0, 'B cannot read A''s dishes');
select is((select count(*) from public.recipes)::int, 0, 'B cannot read A''s recipes');
select is((select count(*) from public.meals)::int, 0, 'B cannot read A''s meals');

update public.dishes set name = 'hijacked' where id = '10000000-0000-0000-0000-000000000001';
delete from public.dishes where id = '10000000-0000-0000-0000-000000000001';
reset role;
select is((select name from public.dishes where id = '10000000-0000-0000-0000-000000000001'),
  'TEST - dish A 2026-10-10', 'B cannot update or delete A''s dish');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select throws_ok(
  $$ insert into public.dishes (user_id, name) values ('00000000-0000-0000-0000-00000000000a', 'forged') $$,
  '42501', null, 'B cannot insert a dish owned by A');
select throws_ok(
  $$ insert into public.meals (dish_id) values ('10000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'B cannot log a meal pointing at A''s dish');
select throws_ok(
  $$ insert into public.recipes (dish_id, servings, ingredients, steps)
     values ('10000000-0000-0000-0000-000000000001', 4, '[]', '[]') $$,
  '42501', null, 'B cannot attach a recipe to A''s dish');

-- ── anonymous gets nothing ────────────────────────────────────────────────
reset role;
set local role anon;
select is((select count(*) from public.dishes)::int, 0, 'anon cannot read dishes');
select is((select count(*) from public.meals)::int, 0, 'anon cannot read meals');
select throws_ok($$ insert into public.dishes (name) values ('anon') $$, '42501', null, 'anon cannot insert');

-- ── the bucket enforces its own limits ─────────────────────────────────────
reset role;
select is((select public from storage.buckets where id = 'dish-images'), false, 'dish-images is private');

select * from finish();
rollback;
