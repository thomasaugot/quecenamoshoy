---
name: set-up-galabase-realtime
description: Make Supabase Realtime work on a self-hosted Galabase project, and wire live DB-to-UI updates in Next.js. A fresh stack ships Realtime broken in three independent places (Kong upstream hostname, the tenant id, and Apache stripping the WebSocket upgrade) and each masks the next. Use when channel.subscribe() returns CHANNEL_ERROR, when /realtime/v1/websocket returns 503 or 400, when the logs say TenantNotFound, or when a page should update itself as the database changes.
---

# Galabase Realtime

Galabase is Galaga's **self-hosted** Supabase. Realtime does NOT work out of the box:
a fresh stack is broken in three independent places, and **each one masks the next**, so
fixing one just changes the error message. Work through them in order.

Five minutes if you know the sequence. An hour if you do not — that is what this file is for.

## The sequence, and the error each stage shows

| Stage | Symptom | Cause |
|---|---|---|
| 1 | `503` + `{"message":"name resolution failed"}` | Kong dials a container name that does not exist |
| 2 | `TenantNotFound: Tenant not found: realtime` in realtime logs | seeded tenant is `realtime-dev` |
| 3 | `400` + `'connection' header must contain 'upgrade'` | **Apache** strips the upgrade, not Kong |
| 4 | `SUBSCRIBED` but no events ever arrive | tables not in the `supabase_realtime` publication |

Diagnose before editing. One command tells you which stage you are on:

```bash
curl -s -i "https://<project-host>/realtime/v1/websocket?apikey=<anon>&vsn=1.0.0" | head -12
```

Read the `Server:` header. **`Server: Cowboy` means Realtime answered** — the request got
all the way through, so the problem is downstream of Kong, not Kong itself. That single
header is what stops you debugging the wrong layer.

A fresh Galabase stack ships Realtime **broken in three independent places**. Each one
masks the next, so fixing one just changes the error. Work through them in order; the
whole thing takes five minutes if you know the sequence and an hour if you do not.

Symptom at the start: `supabase.channel(...).subscribe()` returns `CHANNEL_ERROR`, and
`GET /realtime/v1/websocket` returns **503**.

## 1. Kong cannot resolve the upstream (503 "name resolution failed")

`kong.yml` ships pointing at stock Supabase's container name, which does not exist here:

```bash
curl -s https://<project-host>/realtime/v1/websocket?apikey=<anon> | head -3
# {"message":"name resolution failed"}   <- from kong, not realtime
```

The container publishes `realtime` and `<project>-realtime-1`, never
`realtime-dev.supabase-realtime`:

```bash
cd /mnt/HC_Volume_104520317/galabase-projects/<project>
cp volumes/api/kong.yml volumes/api/kong.yml.bak
sed -i 's|http://realtime-dev\.supabase-realtime:4000|http://realtime:4000|g' volumes/api/kong.yml
docker compose -p <project> restart kong
```

⚠️ Back it up first: `kong.yml` fronts REST and Auth too, so a bad edit takes the whole
API down, not just Realtime.

## 2. Tenant not found

Realtime is multi-tenant and resolves the tenant id from the request. It looks for
`realtime`, but the seeded row is `realtime-dev`:

```bash
docker logs --tail=20 <project>-realtime-1 | grep -i tenant
# TenantNotFound: Tenant not found: realtime
```

Rename the row rather than inserting one — `jwt_secret` is encrypted with `DB_ENC_KEY`
and reproducing that by hand is where people lose time. A foreign key from
`_realtime.extensions` blocks a plain UPDATE, so do it in one transaction:

```bash
docker exec <project>-db-1 psql -U supabase_admin -d postgres -c \
"begin;
 alter table _realtime.extensions drop constraint extensions_tenant_external_id_fkey;
 update _realtime.tenants    set external_id='realtime', name='realtime' where external_id='realtime-dev';
 update _realtime.extensions set tenant_external_id='realtime' where tenant_external_id='realtime-dev';
 alter table _realtime.extensions add constraint extensions_tenant_external_id_fkey
   foreign key (tenant_external_id) references _realtime.tenants(external_id) on delete cascade;
 commit;"
docker compose -p <project> up -d --force-recreate realtime
```

`psql -U postgres` gives `permission denied for table tenants` — the owner is
`supabase_admin`. `APP_NAME` is the Erlang node name and does **not** decide the tenant;
changing it is a red herring.

## 3. Apache strips the WebSocket upgrade (the one that looks like Kong's fault)

```
HTTP/1.1 400 Bad Request
Server: Cowboy                       <- REALTIME replied, so the request got through
X-Kong-Upstream-Latency: 4           <- kong proxied it fine
'connection' header must contain 'upgrade', got ["keep-alive"]
```

It reads like Kong, but it is the edge proxy. Prove it by bypassing Apache — hitting Kong
directly should return `101 Switching Protocols`:

```bash
KONGPORT=$(docker port <project>-kong-1 8000/tcp | head -1 | cut -d: -f2)
curl -s -i --max-time 5 "http://127.0.0.1:${KONGPORT}/realtime/v1/websocket?apikey=<anon>&vsn=1.0.0" \
  -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" | head -3
```

A **hang** is also success: a real upgrade never closes, which is why `--max-time` matters.

The vhost is NOT in `sites-enabled` — Galabase projects live in
`/etc/apache2/galabase-projects/<project>.conf`. A plain `ProxyPass /` drops the Upgrade
header, so the rewrite must come **BEFORE** it (Apache takes the first match):

```apache
<VirtualHost *:443>
  ServerName <project>-galabase.galagaagency.com
  SSLEngine on

  # BEFORE ProxyPass, always.
  RewriteEngine On
  RewriteCond %{HTTP:Upgrade} =websocket [NC]
  RewriteRule ^/realtime/v1/(.*)$ ws://localhost:<KONGPORT>/realtime/v1/$1 [P,L]

  ProxyPreserveHost On
  ProxyPass / http://localhost:<KONGPORT>/
  ProxyPassReverse / http://localhost:<KONGPORT>/
</VirtualHost>
```

```bash
sudo cp <vhost> <vhost>.bak
# insert the block, then ALWAYS:
sudo apache2ctl configtest      # must print "Syntax OK"
sudo systemctl reload apache2   # reload, not restart: other sites stay up
```

`proxy_wstunnel` and `rewrite` are usually already enabled; check with `apache2ctl -M`.

## 4. Publish the tables, or every channel still errors

Realtime only streams tables in the `supabase_realtime` publication:

```bash
docker exec <project>-db-1 psql -U postgres -c \
"do \$\$ declare t text; begin
  foreach t in array array['table_a','table_b'] loop
    begin execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null; end;
  end loop; end \$\$;"

docker exec <project>-db-1 psql -U postgres -c \
  "select tablename from pg_publication_tables where pubname='supabase_realtime' order by 1;"
```

Add `replica identity full` on any table whose UPDATEs need the old row.

## Verify end to end, never by eye

```js
const ch = supabase.channel("probe")
  .on("postgres_changes", { event: "*", schema: "public", table: "sponsors" }, () => {})
ch.subscribe((s, err) => console.log(s, err?.message))   // want: SUBSCRIBED
```

Then write a row and confirm the page reacts. On this stack it lands in ~1.3s.

## App-side pattern: refresh, do not mirror

**Do not hold a client-side copy of the rows.** The obvious design — subscribe, then patch
a `useState` array from the payload — gives you a second source of truth that drifts from
the server, bypasses RLS on the merge, and has to reimplement ordering, filtering and joins
that the server query already does.

Instead: server pages are `force-dynamic`, and the subscription just calls
`router.refresh()`. Next re-runs the server query, RLS applies exactly as on first load,
and React reconciles the new markup. One source of truth, no cache.

```ts
// hooks/useLiveTable.ts   "use client"
export const useLiveTable = (tables: string[]) => {
  const router = useRouter()
  const key = tables.join(",")          // stable dep: no resubscribe per paint

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase.channel(`public:${key}`)

    for (const table of key.split(",")) {
      channel.on("postgres_changes",
        { event: "*", schema: "public", table },
        () => router.refresh())
    }

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        // Not fatal: the server already rendered current data.
        logger.warn("realtime unavailable for", key, status)
      }
    })

    // Floor: a venue screen left open still updates if realtime drops.
    const poll = setInterval(() => router.refresh(), 60_000)

    return () => {
      clearInterval(poll)
      void supabase.removeChannel(channel)
    }
  }, [key, router])
}
```

```tsx
// The page stays a plain server component.
export const dynamic = "force-dynamic"

export default async function Page() {
  const days = await getPublicDays()
  return <ProgramaPageClient days={days} />
}

// …and the client subscribes to the tables that feed it.
useLiveTable(["competition_days", "day_slots"])
```

**Always keep the poll.** It costs one request a minute and means a Realtime outage
degrades to "updates within a minute" instead of "stopped updating and nobody noticed".

**Fall back to committed constants when a table is empty**, so the site renders before an
operator has entered anything:

```ts
const shown = sponsors.length > 0 ? sponsors : COMMITTED_SPONSORS
```


