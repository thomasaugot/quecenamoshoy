-- schema.sql — the ONLY schema file for quecenamoshoy. Source of truth (11-SECURITY).
-- Workflow: every change is appended here as a dated, idempotent block AND pasted in the chat;
-- Thomas runs that block in the Supabase SQL Editor. Never edit a block that has been run.

-- ── MIGRATION 2026-10-10 — initial schema (brief §6) ─────────────────────────────
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


-- ── MIGRATION 2026-10-10 — people, dietary needs, kitchen, eating goals, settings (brief §3.6–3.9) ──
-- Idempotent. Every new table: RLS on + explicit policies in this same file (11-SECURITY).
-- Ownership: a row is mine when it (or its person/meal) carries user_id = auth.uid().

-- ── enums ──────────────────────────────────────────────────────────────────────
do $$ begin create type public.kitchen_location as enum ('home', 'travel');
exception when duplicate_object then null; end $$;
do $$ begin create type public.restriction_kind as enum ('allergy', 'dislike', 'diet');
exception when duplicate_object then null; end $$;
do $$ begin create type public.dish_protein as enum ('red_meat', 'pork', 'poultry', 'fish', 'seafood', 'eggs', 'vegetarian', 'vegan');
exception when duplicate_object then null; end $$;

-- ── columns on existing tables ─────────────────────────────────────────────────
alter table public.dishes  add column if not exists equipment text[] not null default '{}';
alter table public.dishes  add column if not exists protein public.dish_protein;
alter table public.dishes  add column if not exists traits text[] not null default '{}';
alter table public.recipes add column if not exists equipment text[] not null default '{}';
alter table public.meals   add column if not exists location public.kitchen_location not null default 'home';
alter table public.meals   add column if not exists guests int not null default 0 check (guests between 0 and 50);

-- ── people (3.8) — still one account; these are the people I cook for ──────────
create table if not exists public.people (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  is_me      boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists people_one_me_idx on public.people (user_id) where is_me;

alter table public.people enable row level security;
drop policy if exists "people: owner all" on public.people;
create policy "people: owner all" on public.people for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- helper: is this person mine? (security invoker — runs under the caller's RLS)
create or replace function public.owns_person(pid uuid) returns boolean
  language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.people p where p.id = pid and p.user_id = (select auth.uid()))
$$;

-- ── dish_favourites — who loves which dish ─────────────────────────────────────
create table if not exists public.dish_favourites (
  person_id uuid not null references public.people on delete cascade,
  dish_id   uuid not null references public.dishes on delete cascade,
  primary key (person_id, dish_id)
);
create index if not exists dish_favourites_dish_idx on public.dish_favourites (dish_id);

alter table public.dish_favourites enable row level security;
drop policy if exists "dish_favourites: owner all" on public.dish_favourites;
create policy "dish_favourites: owner all" on public.dish_favourites for all to authenticated
  using (public.owns_person(person_id))
  with check (public.owns_person(person_id)
    and exists (select 1 from public.dishes d where d.id = dish_id and d.user_id = (select auth.uid())));

-- ── person_restrictions — allergies (hard), dislikes (soft), diets (hard) ──────
create table if not exists public.person_restrictions (
  id        uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people on delete cascade,
  kind      public.restriction_kind not null,
  key       text not null check (key ~ '^[a-z0-9_]{1,40}$'),   -- catalogue key
  unique (person_id, kind, key)
);

alter table public.person_restrictions enable row level security;
drop policy if exists "person_restrictions: owner all" on public.person_restrictions;
create policy "person_restrictions: owner all" on public.person_restrictions for all to authenticated
  using (public.owns_person(person_id)) with check (public.owns_person(person_id));

-- ── person_goals (3.9) — soft nudges, per week ─────────────────────────────────
create table if not exists public.person_goals (
  id        uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people on delete cascade,
  key       text not null check (key ~ '^[a-z0-9_]{1,40}$'),   -- 'limit_red_meat', 'try_vegan'…
  per_week  int not null check (per_week between 0 and 7),
  unique (person_id, key)
);

alter table public.person_goals enable row level security;
drop policy if exists "person_goals: owner all" on public.person_goals;
create policy "person_goals: owner all" on public.person_goals for all to authenticated
  using (public.owns_person(person_id)) with check (public.owns_person(person_id));

-- ── meal_diners — who ate this meal ────────────────────────────────────────────
create table if not exists public.meal_diners (
  meal_id   uuid not null references public.meals on delete cascade,
  person_id uuid not null references public.people on delete cascade,
  primary key (meal_id, person_id)
);
create index if not exists meal_diners_person_idx on public.meal_diners (person_id);

alter table public.meal_diners enable row level security;
drop policy if exists "meal_diners: owner all" on public.meal_diners;
create policy "meal_diners: owner all" on public.meal_diners for all to authenticated
  using (exists (select 1 from public.meals m where m.id = meal_id and m.user_id = (select auth.uid())))
  with check (public.owns_person(person_id)
    and exists (select 1 from public.meals m where m.id = meal_id and m.user_id = (select auth.uid())));

-- ── kitchen_items (3.6) — equipment per kitchen ────────────────────────────────
create table if not exists public.kitchen_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  location   public.kitchen_location not null default 'home',
  key        text not null check (key ~ '^[a-z0-9_]{1,40}$'),   -- catalogue key: 'oven', 'air_fryer'…
  category   text not null check (category in ('appliance', 'cookware', 'tool')),
  source     public.dish_source not null default 'mine',        -- 'ai' when found by a scan
  created_at timestamptz not null default now(),
  unique (user_id, location, key)
);

alter table public.kitchen_items enable row level security;
drop policy if exists "kitchen_items: owner all" on public.kitchen_items;
create policy "kitchen_items: owner all" on public.kitchen_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ── settings (3.9) — one row per account ───────────────────────────────────────
create table if not exists public.settings (
  user_id        uuid primary key default auth.uid() references auth.users on delete cascade,
  avoid_days     int not null default 7 check (avoid_days between 0 and 30),
  default_diners uuid[] not null default '{}'
);

alter table public.settings enable row level security;
drop policy if exists "settings: owner all" on public.settings;
create policy "settings: owner all" on public.settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));


-- ── MIGRATION 2026-10-10 — photo credits (CC BY / BY-SA photos must name their author) ──
alter table public.dishes add column if not exists image_credit text check (char_length(image_credit) <= 300);


-- ── MIGRATION 2026-10-10 — free-text restrictions ("piñones", "cilantro fresco"…) ──
-- Catalogue entries keep label null. Typed entries get a generated key (c_<slug>) + the text.
alter table public.person_restrictions add column if not exists label text
  check (label is null or char_length(label) between 1 and 60);


-- ── MIGRATION 2026-10-10 — favourites per person: carry over the old is_favourite flag ──
-- dish_favourites (who loves which dish) supersedes dishes.is_favourite. Every dish flagged
-- favourite becomes a favourite of my own profile. Safe to re-run.
insert into public.dish_favourites (person_id, dish_id)
select p.id, d.id
from public.dishes d
join public.people p on p.user_id = d.user_id and p.is_me
where d.is_favourite
on conflict do nothing;


-- ── MIGRATION 2026-10-10 — my kitchen: typed equipment + AI call log (rate limit) ──
-- Typed equipment ("sifón", "deshidratadora"…) keeps a generated key (c_<slug>) + its text.
alter table public.kitchen_items add column if not exists label text
  check (label is null or char_length(label) between 1 and 60);

-- Every Gemini call is logged here first; Edge Functions refuse once the hourly cap is reached
-- (11-SECURITY: a function that spends money gets a per-user rate limit). Append-only.
create table if not exists public.ai_calls (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  fn         text not null check (fn ~ '^[a-z_-]{1,40}$'),
  created_at timestamptz not null default now()
);
create index if not exists ai_calls_user_fn_idx on public.ai_calls (user_id, fn, created_at desc);

alter table public.ai_calls enable row level security;
drop policy if exists "ai_calls: owner reads" on public.ai_calls;
drop policy if exists "ai_calls: owner inserts" on public.ai_calls;
create policy "ai_calls: owner reads" on public.ai_calls for select to authenticated
  using (user_id = (select auth.uid()));
create policy "ai_calls: owner inserts" on public.ai_calls for insert to authenticated
  with check (user_id = (select auth.uid()));


-- ── MIGRATION 2026-10-10 — recipes: where they come from (mine / AI / imported from a link) ──
alter table public.recipes add column if not exists source text not null default 'mine'
  check (source in ('mine', 'ai', 'imported'));
alter table public.recipes add column if not exists source_url text
  check (source_url is null or (char_length(source_url) <= 500 and source_url ~ '^https://'));


-- ── MIGRATION 2026-10-10 — recipes: the language they are written in (null = unknown/old) ──
alter table public.recipes add column if not exists language text
  check (language is null or language in ('es', 'en', 'fr'));


-- ── MIGRATION 2026-10-10 — shopping list (shared between my devices) ──────────────
create table if not exists public.shopping_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  item       text not null check (char_length(item) between 1 and 120),
  quantity   text not null default '' check (char_length(quantity) <= 60),
  dish_id    uuid references public.dishes on delete set null,   -- which recipe it came from
  checked    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists shopping_items_user_idx on public.shopping_items (user_id, created_at);

alter table public.shopping_items enable row level security;
drop policy if exists "shopping_items: owner all" on public.shopping_items;
create policy "shopping_items: owner all" on public.shopping_items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
    and (dish_id is null or exists (select 1 from public.dishes d where d.id = dish_id and d.user_id = (select auth.uid()))));

notify pgrst, 'reload schema';


-- ── MIGRATION 2026-10-10 — dishes: my standing note on the dish ("menos sal", "con arroz") ──
alter table public.dishes add column if not exists notes text
  check (notes is null or char_length(notes) <= 1000);

notify pgrst, 'reload schema';
