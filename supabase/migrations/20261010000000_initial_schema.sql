-- ── MIGRATION 2026-10-10 — initial schema (brief §6) ─────────────────────────────
-- Idempotent: re-runnable whole. NOT applied anywhere yet (files only — MEMORY.md Decisions).
-- Every table: RLS on + explicit policies in this same block (11-SECURITY).

do $$ begin
  create type public.dish_temp as enum ('hot', 'cold');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.dish_source as enum ('mine', 'ai');
exception when duplicate_object then null; end $$;

-- ── dishes ─────────────────────────────────────────────────────────────────────
create table if not exists public.dishes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  name          text not null check (char_length(name) between 1 and 120),
  description   text check (char_length(description) <= 2000),
  temp          public.dish_temp,
  tags          text[] not null default '{}',
  is_favourite  boolean not null default false,
  source        public.dish_source not null default 'mine',
  image_path    text,
  created_at    timestamptz not null default now()
);
create index if not exists dishes_user_favourite_idx on public.dishes (user_id, is_favourite);

alter table public.dishes enable row level security;
drop policy if exists "dishes: owner selects" on public.dishes;
drop policy if exists "dishes: owner inserts" on public.dishes;
drop policy if exists "dishes: owner updates" on public.dishes;
drop policy if exists "dishes: owner deletes" on public.dishes;
create policy "dishes: owner selects" on public.dishes for select to authenticated using (user_id = (select auth.uid()));
create policy "dishes: owner inserts" on public.dishes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "dishes: owner updates" on public.dishes for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "dishes: owner deletes" on public.dishes for delete to authenticated using (user_id = (select auth.uid()));

-- ── recipes — owned through their dish ─────────────────────────────────────────
create table if not exists public.recipes (
  id                 uuid primary key default gen_random_uuid(),
  dish_id            uuid not null unique references public.dishes on delete cascade,
  servings           int not null check (servings between 1 and 50),
  prep_minutes       int check (prep_minutes between 0 and 1440),
  good_for_leftovers boolean not null default false,
  ingredients        jsonb not null,   -- [{ item, quantity }]
  steps              jsonb not null,   -- [string]
  updated_at         timestamptz not null default now()
);

alter table public.recipes enable row level security;
drop policy if exists "recipes: owner selects" on public.recipes;
drop policy if exists "recipes: owner inserts" on public.recipes;
drop policy if exists "recipes: owner updates" on public.recipes;
drop policy if exists "recipes: owner deletes" on public.recipes;
create policy "recipes: owner selects" on public.recipes for select to authenticated
  using (exists (select 1 from public.dishes d where d.id = dish_id and d.user_id = (select auth.uid())));
create policy "recipes: owner inserts" on public.recipes for insert to authenticated
  with check (exists (select 1 from public.dishes d where d.id = dish_id and d.user_id = (select auth.uid())));
create policy "recipes: owner updates" on public.recipes for update to authenticated
  using (exists (select 1 from public.dishes d where d.id = dish_id and d.user_id = (select auth.uid())))
  with check (exists (select 1 from public.dishes d where d.id = dish_id and d.user_id = (select auth.uid())));
create policy "recipes: owner deletes" on public.recipes for delete to authenticated
  using (exists (select 1 from public.dishes d where d.id = dish_id and d.user_id = (select auth.uid())));

-- ── meals ──────────────────────────────────────────────────────────────────────
create table if not exists public.meals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users on delete cascade,
  dish_id        uuid not null references public.dishes on delete restrict,
  eaten_on       date not null default current_date,
  people         int not null default 2 check (people between 1 and 50),
  with_leftovers boolean not null default false,
  rating         smallint check (rating between 1 and 5),
  note           text check (char_length(note) <= 2000),
  created_at     timestamptz not null default now()
);
create index if not exists meals_user_eaten_on_idx on public.meals (user_id, eaten_on desc);

alter table public.meals enable row level security;
drop policy if exists "meals: owner selects" on public.meals;
drop policy if exists "meals: owner inserts" on public.meals;
drop policy if exists "meals: owner updates" on public.meals;
drop policy if exists "meals: owner deletes" on public.meals;
create policy "meals: owner selects" on public.meals for select to authenticated using (user_id = (select auth.uid()));
-- the dish must also belong to the caller: no meal pointing at someone else's dish
create policy "meals: owner inserts" on public.meals for insert to authenticated
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.dishes d where d.id = dish_id and d.user_id = (select auth.uid())));
create policy "meals: owner updates" on public.meals for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.dishes d where d.id = dish_id and d.user_id = (select auth.uid())));
create policy "meals: owner deletes" on public.meals for delete to authenticated using (user_id = (select auth.uid()));

-- ── storage: private bucket dish-images, path {user_id}/{dish_id}.webp ───────────
-- Limits enforced BY THE BUCKET (11-SECURITY → Storage): 5 MB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-images', 'dish-images', false, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dish-images: owner reads" on storage.objects;
drop policy if exists "dish-images: owner writes" on storage.objects;
drop policy if exists "dish-images: owner updates" on storage.objects;
drop policy if exists "dish-images: owner deletes" on storage.objects;
create policy "dish-images: owner reads" on storage.objects for select to authenticated
  using (bucket_id = 'dish-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "dish-images: owner writes" on storage.objects for insert to authenticated
  with check (bucket_id = 'dish-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "dish-images: owner updates" on storage.objects for update to authenticated
  using (bucket_id = 'dish-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "dish-images: owner deletes" on storage.objects for delete to authenticated
  using (bucket_id = 'dish-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

notify pgrst, 'reload schema';
