---
name: set-up-galabase-notifications
description: Build a notification system on a Galabase (self-hosted Supabase) + Next.js project — an in-app notification centre driven by Realtime, and Web Push that reaches a phone with the app closed. Covers VAPID keys, the service worker handlers, the subscription table, a cron that cannot double-send, and the browser behaviours that make a correct implementation look broken. Use when asked for notifications, alerts, push, reminders, "tell users when X is about to start", or when Notification.permission reports denied for a user who refused nothing.
---

# Notifications on Galabase

Two mechanisms, and conflating them is the first mistake:

| | Reaches | Needs permission | Cost |
|---|---|---|---|
| **Realtime / in-app** | a tab that is OPEN | no | free, already in the stack |
| **Web Push** | a phone with the app CLOSED | yes | VAPID + a service worker + a scheduler |

**Build both.** In-app alone is useless at a live event — people put their phone
away. Push alone means someone staring at the app gets nothing until the cron
fires. Ship the in-app half first: it works without permission, and it is what
the push notification links back to.

---

## The shape that works

One **notification centre** behind a bell, not a permission prompt wearing a bell
icon:

- The **list** is the feature: what is running now, what is next, what has been.
- **In-app alerts are never gated.** They need no permission and cost nothing.
- The **switch controls push only** — reaching a phone with the app closed.
- Every string says what it *does*, not on/off.

A user who denies push must still get a working notification centre. If denying
push empties the panel, the feature was built inside out.

---

## Step 1 — VAPID keys

```bash
npm install web-push
npm install -D @types/web-push
node -e "const wp=require('web-push');const k=wp.generateVAPIDKeys();console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY='+k.publicKey);console.log('VAPID_PRIVATE_KEY='+k.privateKey)"
```

The public half ships to the browser by design — it is what a device encrypts
its subscription to. The private half is server-only and must fail loudly:

```ts
// config/app.config.ts
push: { publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "" },

// serverConfig
push: {
  privateKey: () => required(process.env.VAPID_PRIVATE_KEY, "VAPID_PRIVATE_KEY"),
  subject: () => process.env.VAPID_SUBJECT ?? "mailto:you@example.com",
},
```

---

## Step 2 — Schema (BOTH schemas if the project is split)

```sql
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  -- The browser's own endpoint URL. UNIQUE: re-subscribing hands back the same
  -- URL, and duplicates all fire at once.
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  user_id    uuid,                      -- null for an anonymous visitor
  locale     text not null default 'es',
  created_at timestamptz not null default now()
);

-- What has already been sent, so a cron running every minute does not send the
-- same reminder sixty times.
create table if not exists push_sent (
  id       uuid primary key default gen_random_uuid(),
  item_key text not null,
  endpoint text not null,
  sent_at  timestamptz not null default now(),
  unique (item_key, endpoint)
);

alter table push_subscriptions enable row level security;
alter table push_sent          enable row level security;

-- Anyone registers their own device; NOBODY reads the list. An endpoint is a
-- send-anything-to-this-phone capability, so a readable table is a real leak.
drop policy if exists "anyone registers a device" on push_subscriptions;
create policy "anyone registers a device" on push_subscriptions
  for insert with check (true);

drop policy if exists "no client reads subscriptions" on push_subscriptions;
create policy "no client reads subscriptions" on push_subscriptions
  for select using (false);

drop policy if exists "no client access to push log" on push_sent;
create policy "no client access to push log" on push_sent for select using (false);

notify pgrst, 'reload schema';
```

---

## Step 3 — Service worker

Appended to the existing `public/sw.js`:

```js
self.addEventListener("push", (event) => {
  if (!event.data) return
  let payload = {}
  try { payload = event.data.json() }
  catch { payload = { title: "App", body: event.data.text() } }

  event.waitUntil(
    self.registration.showNotification(payload.title || "App", {
      body: payload.body || "",
      icon: "/assets/icons/icon-192.png",
      badge: "/assets/icons/icon-192.png",
      // Same tag REPLACES an earlier notice rather than stacking under it.
      tag: payload.tag || payload.title || "app",
      data: { url: payload.url || "/" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = event.notification.data?.url || "/"
  // Focus an open tab rather than opening a second one.
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabs) => {
      for (const tab of tabs) {
        if (tab.url.includes(target) && "focus" in tab) return tab.focus()
      }
      return self.clients.openWindow(target)
    })
  )
})
```

---

## Step 4 — Sending, with cleanup

```ts
const sendOne = async (device, payload) => {
  try {
    await webpush.sendNotification(
      { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
      JSON.stringify(payload)
    )
    return true
  } catch (error) {
    const status = error.statusCode
    // 404/410 = the browser threw the subscription away (uninstalled, cleared,
    // expired). Delete it HERE or the table fills with endpoints that can never
    // be delivered to, each costing a request on every future run.
    if (status === 404 || status === 410) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", device.endpoint)
    } else {
      // Never the error body: it echoes the endpoint, which is a capability.
      logger.error("push send failed", status ?? "unknown")
    }
    return false
  }
}
```

Record `push_sent` **only on success**, so a transient failure retries on the
next run while a dead endpoint has already been removed.

---

## Step 5 — The cron

A guarded route (`requireInternalAuth`), safe to run every minute because
`push_sent` makes it idempotent:

```bash
* * * * * curl -s -X POST https://<host>/api/cron/push-upcoming \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Read the venue's clock, not the server's.** Containers run in UTC and the
schedule is written in local time:

```ts
const nowParts = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Atlantic/Canary",
}).format(new Date())

// en-CA gives YYYY-MM-DD, which matches a date column directly.
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Atlantic/Canary" })
```

---

## Deploying it — the public key is a BUILD ARG, not an env var

This one silently ships a broken feature: the prompt appears, the visitor says
yes, and then the toggle fails with no useful error.

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` is inlined at **build** time. Passing it only
through `env_file` sets it at runtime, when the bundle has already been compiled
with an empty string — so `pushManager.subscribe()` throws on an invalid
`applicationServerKey` and every subscription fails in production while working
perfectly in development.

It must be declared in **three** places:

```dockerfile
# Dockerfile — declared as an ARG and promoted to ENV before `next build`
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
```

```yaml
# docker-compose.yml — passed as a build arg, NOT only in env_file
services:
  my-app:
    build:
      args:
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: "BxxxxKey"
    env_file:
      - ./.env.local          # the PRIVATE half lives here, runtime only
```

```bash
# .env.local on the server — server-only, never in the image
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com
```

Adding the ARG to the Dockerfile is not optional: a build arg the Dockerfile
never declares is **ignored without warning**.

A rebuild is required, not a restart — a restart reuses the compiled bundle:

```bash
docker compose up -d --build my-app
```

**Fail loudly instead.** A missing key should say so rather than surfacing as a
generic failure:

```ts
if (!appConfig.push.publicKey) {
  logger.error("push subscribe skipped: NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set")
  showToast(t("inAppOnly"), "info")
  return
}
```

And put both halves in `.env.example` when you generate them: keys that live
only in one developer's `.env.local` are keys production will not have.

---

## Browser behaviours that make correct code look broken

Every one of these cost real time.

**`Notification.permission` is not a reliable signal.** It returns `"denied"` in
situations where the visitor refused nothing: a fresh Chromium profile, an
embedded webview, a managed policy default. Branching the UI on it tells people
they blocked something they were never asked about.

> Only trust `"granted"`. Offer the control otherwise and let the real prompt decide.

**Chrome auto-blocks after ignored prompts.** Dismiss the prompt a few times
during development and Chrome permanently denies the origin:

```
Notifications permission has been blocked as the user has ignored the
permission prompt several times.
```

No code can undo it. Reset via the tune icon left of the URL. **Never prompt
automatically on load** — that is exactly how a user reaches this state, and it
cannot be recovered.

**The toggle must always move.** A switch that cannot change because the browser
refuses reads as a broken control. Keep a local preference the switch owns, and
let the push attempt be a consequence:

```ts
const [wantsAlerts, setWantsAlerts] = useState(false)

const toggle = async () => {
  const next = !wantsAlerts
  setWantsAlerts(next)                     // always moves
  localStorage.setItem(KEY, next ? "1" : "0")
  if (next) await enablePush() else await silence()
}
```

**Re-read the permission after every change.** `useSyncExternalStore` with a
no-op `subscribe` never re-reads, so the switch keeps its old value after the
prompt is answered. Set it explicitly in the handler.

**`userVisibleOnly: true` is mandatory.** Chrome refuses a subscription that
could send silent pushes.

**Unsubscribing is the only "off" you control.** The permission belongs to the
browser; dropping the subscription is what actually stops delivery.

---

## Realtime pitfalls

**One channel per table set.** A second `useLiveTable` on tables another
component already subscribes to throws:

```
cannot add `postgres_changes` callbacks for realtime:<schema>:<tables> after `subscribe()`
```

Pass the data down from a parent that already subscribes rather than opening a
second channel.

**Realtime needs the split-schema treatment** if the project has one: the
subscription names a schema, and a hardcoded `"public"` listens to the wrong
tables entirely. See `set-up-galabase-dev-schema`.

---

## Z-index, on a stack that has a navbar

A toast confirming an action must sit above the control that triggered it. Order
that actually works:

```
--z-nav: 100
--z-sheet-scrim: 101      /* over the navbar, UNDER the sheet it dims */
--z-sheet: 102            /* the notification panel */
--z-toast: 108            /* above everything it reports on */
--z-loader: 110
```

Two traps:

- **A scrim above its own panel.** The backdrop must be UNDER the thing it dims,
  or it covers what it is meant to focus attention on.
- **A panel rendered inside the navbar is capped at the navbar's z-index**, so
  any portalled scrim above that will cover it. Portal the panel too and
  position it from a measured `getBoundingClientRect()`.

---

## Checklist

- [ ] In-app centre works with push denied?
- [ ] Toggle moves on every tap, whatever the browser says?
- [ ] Copy says what each state DOES, not just on/off?
- [ ] 404/410 deletes the subscription?
- [ ] `push_sent` written only on success?
- [ ] Cron reads the venue's timezone, not UTC?
- [ ] No automatic permission prompt on load?
- [ ] Toast above the navbar and the panel?
- [ ] Schema applied to BOTH schemas, if the project is split?
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` declared as an ARG in the Dockerfile AND
      passed as a build arg in compose — not only in `env_file`?
- [ ] Deployed with `--build`, not a restart?
- [ ] Both keys written into `.env.example`?
