---
name: set-up-galabase-dev-schema
description: Split a Galabase (self-hosted Supabase) project into a `public` schema holding real production data and a `dev` schema holding mock data, switched by one env var. Use when a project needs test riders, seeded programmes or fake analytics without polluting the data a client will look at, when asked for "a dev database" or "mock data", or when PostgREST answers PGRST106 "Invalid schema" / PGRST200 "no relationship found" on a non-public schema.
---

# Galabase dev schema

One Postgres database, two schemas. `public` is what the client sees; `dev` is a
structural clone holding whatever mock data the build needs. One env var picks
between them, so there is **one codebase, one set of migrations, and no second
code path** to keep in step.

Roughly twenty minutes the first time. The four failure modes below cost hours
each if you meet them cold, and every one of them is silent.

---

## Why not seed `public` with prefixed rows

The tempting shortcut is `PRUEBAS …` rows plus a delete before launch. It fails
for one reason: the client opens Studio during the build. Fourteen invented
riders and a fabricated programme sitting in their table is not a tidy-up
problem, it is a trust problem — and "we'll wipe it before the event" is a
promise someone has to remember on the worst possible week.

---

## Step 1 — Expose the schema to PostgREST

**Do this FIRST.** Everything else appears to work without it and then fails at
runtime with a 406 nobody connects back to this step.

Find the real compose file. Galabase templates a stack per project, and the
directory it was generated from is not necessarily where it now runs:

```bash
docker inspect <project>-rest-1 \
  --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}'
```

Then, in that directory:

```bash
sed -i 's/^PGRST_DB_SCHEMAS=.*/PGRST_DB_SCHEMAS=public,dev,storage,graphql_public/' .env
docker compose -p <project> up -d --force-recreate rest
```

Three traps, all of which cost real time:

- **`docker compose up -d rest` without `-p <project>`** picks the directory
  name as the project, which on a shared VPS restarts a DIFFERENT stack's
  container. It reports success. Nothing changes.
- **`docker restart` is not enough.** A restart reuses the old environment; the
  container must be recreated to read the new `.env`.
- **Verify on the container, not the file:**
  ```bash
  docker inspect <project>-rest-1 --format '{{range .Config.Env}}{{println .}}{{end}}' | grep SCHEMAS
  ```

---

## Step 2 — Clone the structure

```sql
create schema if not exists dev;
grant usage on schema dev to anon, authenticated, service_role;

-- Helper functions (is_staff() and friends) live in public and are called by
-- the policies cloned below. Without public on the search_path those calls
-- resolve to nothing and every policy on a dev table fails closed.
alter role authenticated set search_path = dev, public, extensions;
alter role anon          set search_path = dev, public, extensions;
alter role service_role  set search_path = dev, public, extensions;

-- Structure only, never rows.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('create table if not exists dev.%I (like public.%I including all)',
                   t.tablename, t.tablename);
  end loop;
end $$;
```

---

## Step 3 — Foreign keys (LIKE does NOT copy them)

`including all` copies defaults, constraints, indexes and identity — **but not
foreign keys**. Miss this and every PostgREST embedded join fails with
`PGRST200: no relationship found`, which reads like a config problem and is not.

```sql
do $$
declare fk record; newdef text;
begin
  for fk in
    select c.conname, src.relname as src_table, tgt.relname as tgt_table,
           pg_get_constraintdef(c.oid) as def
    from pg_constraint c
    join pg_class src on src.oid = c.conrelid
    join pg_class tgt on tgt.oid = c.confrelid
    join pg_namespace n on n.oid = src.relnamespace
    where c.contype = 'f' and n.nspname = 'public'
  loop
    if exists (select 1 from pg_tables where schemaname='dev' and tablename=fk.src_table)
       and exists (select 1 from pg_tables where schemaname='dev' and tablename=fk.tgt_table)
       and not exists (
         select 1 from pg_constraint c2
         join pg_class s2 on s2.oid = c2.conrelid
         join pg_namespace n2 on n2.oid = s2.relnamespace
         where n2.nspname='dev' and s2.relname=fk.src_table and c2.conname=fk.conname)
    then
      -- pg_get_constraintdef names the target UNQUALIFIED, so replaying it
      -- verbatim points the dev FK back at the PUBLIC table.
      newdef := regexp_replace(fk.def,
        'REFERENCES (public\.)?' || fk.tgt_table,
        'REFERENCES dev.' || fk.tgt_table);
      execute format('alter table dev.%I add constraint %I %s',
                     fk.src_table, fk.conname, newdef);
    end if;
  end loop;
end $$;
```

**Order matters.** A foreign key is validated against existing rows, so copy
parent tables before adding the constraint that points at them. Meeting
`violates foreign key constraint` here means the referenced table is empty in
`dev` — copy it across and re-run.

---

## Step 4 — RLS and policies

`including all` does not copy row-level security either. A table with RLS
enabled and no policy denies **everyone**, staff included, and the app fails
with a generic write error that looks like a bug in the form.

```sql
do $$
declare t record; p record;
begin
  for t in select tablename from pg_tables where schemaname = 'dev' loop
    execute format('alter table dev.%I enable row level security', t.tablename);
  end loop;

  for p in select tablename, policyname, cmd, qual, with_check, roles
           from pg_policies where schemaname = 'public' loop
    if exists (select 1 from pg_tables where schemaname='dev' and tablename=p.tablename) then
      execute format('drop policy if exists %I on dev.%I', p.policyname, p.tablename);
      execute format('create policy %I on dev.%I for %s to %s %s %s',
        p.policyname, p.tablename, lower(p.cmd), array_to_string(p.roles, ','),
        case when p.qual is not null then 'using (' || p.qual || ')' else '' end,
        case when p.with_check is not null then 'with check (' || p.with_check || ')' else '' end);
    end if;
  end loop;
end $$;

grant all on all tables in schema dev to service_role;
grant select, insert, update, delete on all tables in schema dev to authenticated;
grant select, insert on all tables in schema dev to anon;
grant usage, select on all sequences in schema dev to anon, authenticated, service_role;

-- So tables added by LATER migrations inherit the same grants.
alter default privileges in schema dev grant all on tables to service_role;
alter default privileges in schema dev
  grant select, insert, update, delete on tables to authenticated;

notify pgrst, 'reload schema';
```

---

## Step 5 — Wire the app

Four places read the schema, and **all four** must use the same value. Miss the
browser client or realtime and the server renders `dev` while the client queries
`public`, which produces data that appears and then vanishes.

```ts
// config/app.config.ts
supabase: {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  // NEXT_PUBLIC_ because the browser client and the realtime subscription need
  // it too. It names a schema, it does not grant access to one: RLS still applies.
  schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public",
},
```

| File | Change |
|---|---|
| `lib/supabase/server.ts` | `db: { schema }` on **both** the anon and service-role clients |
| `lib/supabase/client.ts` | `db: { schema }` on the browser client |
| `hooks/useLiveTable.ts` | `{ event: "*", schema, table }` and the channel name |

`SupabaseClient` defaults its schema type parameter to the `"public"` literal,
so a memoised browser client needs widening:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any, string> | null = null
```

Then in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_SCHEMA=dev
```

Production leaves it unset and falls back to `public`. **It is baked in at build
time — the dev server must be restarted, a refresh does nothing.**

---

## Step 6 — Seed `dev` only

Seed over PostgREST with `Content-Profile: dev` (write) and `Accept-Profile: dev`
(read). Both headers, every time — the default is `public`, and a forgotten
header writes mock data into production silently.

```js
const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Content-Profile": "dev",           // ← the whole point
  Prefer: "return=representation,resolution=ignore-duplicates",
}
```

**Prove it afterwards.** Count every table in both schemas and read the numbers;
do not assume the header worked:

```js
for (const table of tables) {
  const dev = await fetch(`${URL}/rest/v1/${table}?select=*`, { headers: { ...A, "Accept-Profile": "dev" } })
  const pub = await fetch(`${URL}/rest/v1/${table}?select=*`, { headers: { ...A, "Accept-Profile": "public" } })
  console.log(table, (await dev.json()).length, (await pub.json()).length)
}
```

Seed enough to exercise the UI, not one token row: a full event window, a real
draw, and a few thousand analytics rows so dashboards have a curve rather than
a single dot.

---

## After this: EVERY migration runs against BOTH schemas

Not a footnote. This is the one ongoing cost of the split, and it is the thing
that breaks in the least obvious way: the app reads `dev`, the SQL was applied
to `public`, and the feature silently does nothing. No error, no failed write —
PostgREST just ignores a column that is not there.

**NEVER hand over a migration written against one schema.** Every `alter table`,
`create table`, `create policy` and `grant` is delivered as a pair, or as a loop
that covers both. Anything less is an unfinished migration.

```sql
-- ✅ Every statement, twice. This is the minimum shape.
alter table public.event_settings add column if not exists gate_open boolean;
alter table dev.event_settings    add column if not exists gate_open boolean;

notify pgrst, 'reload schema';
```

For a whole new table, write it for `public`, then re-run the **Step 3** (foreign
keys) and **Step 4** (RLS, policies, grants) blocks: both are idempotent and pick
up whatever is new, which is far safer than hand-copying policies.

`schema.sql` stays the source of truth for `public`. Put a line at the top of it
saying `dev` must be kept in step, so the next person writing a migration sees it
before they write one.

### Before handing any SQL to the user

- [ ] Does every statement name a schema explicitly, or run for both?
- [ ] If it adds a table: are Step 3 and Step 4 included after it?
- [ ] Would this leave `dev` behind `public`, or the reverse?

A migration that only touches one schema is a bug you are about to ship.

---

## Symptom → cause

| Symptom | Cause |
|---|---|
| `PGRST106 Invalid schema` | Step 1 not done, or the container was restarted rather than recreated |
| `PGRST205 Could not find the table` | Table exists in `public` only; re-run Step 2 |
| `PGRST200 no relationship found` | Foreign keys not cloned; Step 3 |
| Writes fail with a generic error | RLS on with no policy; Step 4 |
| Server shows data, client shows none | Browser client or realtime still on `public`; Step 5 |
| Env change appears to do nothing | `NEXT_PUBLIC_*` is build-time; restart the dev server |
| Seeds land in production | `Content-Profile` header missing on the write |
