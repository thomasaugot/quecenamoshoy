---
name: build-progressive-web-app
description: "OPT-IN — only for projects that must be installable or work offline. Builds a Progressive Web App on this house stack: manifest, icons, service worker, update prompt, offline data, tests — with a shared contract and separate, file-by-file instructions for Vite (vite-plugin-pwa) and Next.js (Serwist). Trigger when the user mentions PWA, installable, 'add to home screen', offline, service worker, manifest, Workbox or Serwist; or when an installed app shows an old version, a blank page after a deploy, or private data after sign-out."
---

# Progressive Web Apps — house stack

Read in this order:

1. **Step 0** — which stack, which offline scope. Decides everything else.
2. **Shared contract** — true for both stacks. Never skip it.
3. **Your stack's section only** — Vite *or* Next. Each one lists every file and what goes in it.
4. **Tests** and **Checklist**.

---

## Step 0 — Decide before writing a file

**Which stack?** `package.json` has `vite` → **Vite section**. It has `next` → **Next section**.
Never mix them: the tools, the files and the offline model differ.

**Which offline scope?** Write the answer in MEMORY.md → Decisions.

| Scope | What works offline | Typical for |
|---|---|---|
| Installable only | Nothing — the app opens, shows "you are offline" | Marketing sites that want an icon |
| App shell | The app opens and navigates; data screens show "you are offline" | Most apps |
| Shell + read data | Screens already visited show their last data, read-only | Personal tools, catalogues, recipes |
| Full offline (writes queued) | Everything, writes sync later | Rare. Needs a conflict strategy — ask before building |

Vite can reach every row. **Next stops at "shell + pages already visited"**: its server pages
cannot render without the server.

---

## Shared contract — both stacks

### 1. The service worker caches the APP, never private data

- Precache: the built HTML shell, JS, CSS, fonts, icons. Runtime cache: public images only.
- **Never** cache API / database / function responses, or HTML of signed-in pages, in the
  service worker. Its cache is on disk, has no idea who is signed in, survives sign-out and
  is readable by anyone using the device next.
- Offline DATA, when the scope needs it, lives in the app's own cache with an owner and an
  expiry (Vite: persisted TanStack Query, below) and is wiped on sign-out.

### 2. Updates are offered, never forced

Never `skipWaiting()` + `clients.claim()` on install. A new worker that takes over a running
tab deletes the old version's files while the page still needs them → blank page on the next
lazy route (13-MONITORING.md, stale tabs).

- New version found → a **persistent** toast-style prompt (no auto-dismiss), in the site's
  language: "Nueva versión disponible · Actualizar". The button tells the waiting worker to
  activate, then reloads.
- Check for updates on load and every hour while open (installed apps stay open for days).
- While the user has not accepted, the old worker keeps serving the old files — the open tab
  keeps working. That is the point.

### 3. Manifest

| Field | Value |
|---|---|
| `name` / `short_name` | Full name / ≤ 12 characters (home-screen label) |
| `description`, `lang` | In the default locale |
| `id`, `start_url`, `scope` | `"/"` (with i18n: the default locale's home) |
| `display` | `"standalone"` |
| `background_color` / `theme_color` | Literal hex copied from `theme.css` — like email templates, the one place hex is allowed: the manifest cannot read CSS variables |
| `icons` | See below |

### 4. Icons — `any` and `maskable` are SEPARATE files

`"purpose": "any maskable"` on one file makes Android crop the regular icon or pad the
maskable one. Four files, generated from one square SVG source:

| File | Size | Purpose |
|---|---|---|
| `pwa-192x192.png` | 192 | `any` |
| `pwa-512x512.png` | 512 | `any` |
| `maskable-512x512.png` | 512 | `maskable` — logo inside the centre 80% safe zone, full-bleed background |
| `apple-touch-icon-180x180.png` | 180 | iOS home screen (no transparency) |

All in `public/assets/icons/`. Check the maskable one on maskable.app before shipping.

### 5. Ask the browser to keep the storage

```ts
// after sign-in, or after the first successful load — never on page load of a public site
if (navigator.storage?.persist) await navigator.storage.persist()
```

Without it the browser may evict the cache under storage pressure — and Safari evicts
non-installed sites' storage after ~7 days without a visit.

### 6. Install button — only when the browser offers it

- Capture `beforeinstallprompt`, show your own "Install" button, call `prompt()` on click.
  Never on page load, never a modal, never twice after a dismissal.
- iOS/Safari has no `beforeinstallprompt`: show a one-line hint ("Compartir → Añadir a
  pantalla de inicio") only on iOS Safari, not installed (`display-mode: standalone` false).
- Hide everything once installed (`appinstalled`, or `matchMedia("(display-mode: standalone)")`).

### 7. Security headers

`worker-src 'self'; manifest-src 'self'` in the CSP (11-SECURITY.md). The worker file and the
manifest are served from the app's own origin, with `Cache-Control: no-cache` on the worker
file — a cached worker file means updates are never detected.

### 8. Development

Service worker **off in dev** (a dev worker serves stale code and wastes hours). Test it on a
production build: Vite `vite build && vite preview`, Next a production build on its own port.

### 9. Kill switch — if a broken worker ships

Deploy a worker that removes itself; installed clients pick it up on their next check:

```js
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", async () => {
  for (const key of await caches.keys()) await caches.delete(key)
  await self.registration.unregister()
  for (const client of await self.clients.matchAll()) client.navigate(client.url)
})
```

This is the ONE place `skipWaiting` is right. Never delete the worker file instead: a 404
leaves the broken worker installed forever.

---

## Vite — vite-plugin-pwa

```bash
npm install -D vite-plugin-pwa @vite-pwa/assets-generator
npm install @tanstack/react-query-persist-client @tanstack/query-async-storage-persister idb-keyval   # only for "shell + read data"
```

### Where everything goes

| File | What goes in it |
|---|---|
| `vite.config.ts` | `VitePWA({...})`: manifest, Workbox precache + runtime caching, `registerType: "prompt"` |
| `pwa-assets.config.ts` | icon generation from `public/assets/icons/source.svg` |
| `index.html` | `<meta name="theme-color">`, `<link rel="apple-touch-icon">` (manifest link is injected) |
| `src/vite-env.d.ts` | `/// <reference types="vite-plugin-pwa/react" />` |
| `src/components/ui/UpdatePrompt.tsx` | the update prompt (`useRegisterSW`) — mounted once in `Providers` |
| `src/components/ui/OfflineBanner.tsx` | "Sin conexión" banner from `onlineManager` — mounted once in `Providers` |
| `src/components/ui/InstallButton.tsx` | install button / iOS hint (shared contract §6) |
| `src/lib/query-client.ts` | the persister (only for "shell + read data") |
| `src/locales/*/common.json` | `pwa.updateAvailable`, `pwa.update`, `pwa.offline`, `pwa.install`, `pwa.iosHint` |

### vite.config.ts

```ts
import { VitePWA } from "vite-plugin-pwa"

VitePWA({
  registerType: "prompt",              // shared contract §2 — never "autoUpdate"
  injectRegister: false,               // UpdatePrompt registers it
  manifest: { /* shared contract §3; icons from §4 */ },
  workbox: {
    globPatterns: ["**/*.{js,css,html,woff2,webp,avif,svg,png,ico}"],
    navigateFallback: "/index.html",   // SPA: every navigation gets the shell offline
    navigateFallbackDenylist: [/^\/api\//, /^\/functions\//, /\/[^/?]+\.[a-z0-9]+$/i],
    cleanupOutdatedCaches: true,
    runtimeCaching: [{
      // PUBLIC images only — never the database / functions / private storage
      urlPattern: ({ url, request }) => request.destination === "image" && url.pathname.includes("/public/"),
      handler: "CacheFirst",
      options: { cacheName: "public-images", expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 3600 } },
    }],
  },
  devOptions: { enabled: false },      // shared contract §8
})
```

`clientsClaim` and `skipWaiting` stay at their default (`false`). Precached chunks of the
running version stay available until the user accepts the update — so with a worker, the
stale-chunk reload (13-MONITORING.md) rarely fires; keep it anyway for non-installed visitors.

### UpdatePrompt.tsx

```tsx
import { useRegisterSW } from "virtual:pwa-register/react"

export const UpdatePrompt = () => {
  const t = useTranslations("pwa")
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW: (_url, registration) => {
      if (registration) setInterval(() => registration.update(), 60 * 60 * 1000)
    },
    onRegisterError: (error) => logger.error("SW registration failed", error),
  })
  if (!needRefresh) return null
  // persistent, top layer (07-UI_PRIMITIVES.md Toaster rules), role="status", keyboard-focus-ring
  return (/* "{t('updateAvailable')}" + <Button onClick={() => updateServiceWorker(true)}>{t('update')}</Button> */)
}
```

### Offline data (scope "shell + read data")

```ts
// src/lib/query-client.ts
export const persister = createAsyncStoragePersister({ storage: idbKeyvalStorage, key: "query-cache" })
export const persistOptions = {
  persister,
  maxAge: 7 * 24 * 3600 * 1000,
  buster: appConfig.release,                      // new release → old cache shape dropped
  dehydrateOptions: { shouldDehydrateQuery: (q) => q.meta?.persist === true && q.state.status === "success" },
}
// Providers: <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
```

- Only queries marked `meta: { persist: true }` are written to disk — list data and the
  screens the scope promises, never tokens or profile secrets.
- `gcTime` of persisted queries ≥ `maxAge`, or they are dropped before they are saved.
- **Sign-out:** `queryClient.clear()` **and** `await persister.removeClient()`, then the full
  reload (14-PERFORMANCE.md).
- Writes offline: disable the action and say why ("Necesitas conexión para guardar"). Queued
  offline writes are the "full offline" row — ask first.

---

## Next.js — Serwist

```bash
npm install @serwist/next && npm install -D serwist
```

Check Serwist's docs for the Next version in use before wiring it: its build plugin and the
bundler Next uses by default have changed between majors — follow the current setup page, not
memory.

### Where everything goes

| File | What goes in it |
|---|---|
| `next.config.ts` | `withSerwistInit({ swSrc: "app/sw.ts", swDest: "public/sw.js", disable: dev })` wrapping the config |
| `app/sw.ts` | the worker: precache manifest, runtime caching, offline fallback |
| `app/manifest.ts` | `MetadataRoute.Manifest` — shared contract §3/§4 |
| `app/[locale]/~offline/page.tsx` | the static offline page (no data, no server calls) |
| `app/layout.tsx` metadata | `themeColor` (in `viewport`), `appleWebApp`, icons |
| `proxy.ts` matcher | **excludes `sw.js`, `manifest.webmanifest`, `~offline` assets** — otherwise the locale redirect rewrites the worker URL and registration fails |
| `components/ui/UpdatePrompt.tsx` | registration with `@serwist/window` + the prompt — mounted once in `Providers` |
| `components/ui/InstallButton.tsx` | shared contract §6 |
| `.gitignore` | `public/sw.js`, `public/swe-worker-*.js` (build output) |

### app/sw.ts

```ts
import { Serwist } from "serwist"

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,                  // shared contract §2
  clientsClaim: false,
  navigationPreload: true,
  runtimeCaching: [
    // Static assets and PUBLIC images only. Do NOT spread Serwist's `defaultCache`
    // wholesale: it includes network-first rules for API routes and pages, which writes
    // private responses to disk (shared contract §1).
  ],
  fallbacks: {
    entries: [{ url: "/~offline", matcher: ({ request }) => request.destination === "document" }],
  },
})
serwist.addEventListeners()
```

Signed-in areas (`/admin`, `/account`…) are network-only: no runtime rule matches them, so they
show the offline page when there is no connection — never a cached copy of someone's data.

### UpdatePrompt.tsx

```ts
const sw = new Serwist("/sw.js", { scope: "/", type: "classic" })   // from @serwist/window
sw.addEventListener("waiting", () => setNeedRefresh(true))
sw.addEventListener("controlling", () => window.location.reload())
void sw.register()
// button: sw.messageSkipWaiting()  → the waiting worker activates → "controlling" → reload
// hourly: setInterval(() => sw.update(), 60 * 60 * 1000)
```

Same UI contract as the Vite prompt (persistent, translated, top layer).

---

## Tests (Playwright, Chromium — WebKit's service-worker support in Playwright is partial)

Run against the production build on the test server's own port (12-TESTING_CI.md), never
against the dev server.

- **Manifest:** fetch it; assert name, short_name, start_url, display, both `any` icons and the
  `maskable` one, and that every icon URL answers 200.
- **Worker registers:** after load, `navigator.serviceWorker.ready` resolves, no console error.
- **Offline shell:** load the app, wait for the worker to control the page, then
  `context.setOffline(true)` → reload → the shell renders, the offline banner shows, no blank
  page. Next: an unvisited page shows `/~offline`.
- **Offline data** (if in scope): visit a persisted screen online, go offline, reload → its
  last data is visible; a write action is disabled with the offline message.
- **Sign-out wipes it:** sign in, load data, sign out → IndexedDB `query-cache` is empty and
  no runtime cache contains a private URL.
- **Update prompt:** unit-test `UpdatePrompt` with the registration hook mocked
  (`needRefresh: true` → prompt visible → click → update called with reload). An end-to-end
  two-build update test is not worth its cost.

---

## iOS / Safari — what to expect

- No `beforeinstallprompt`: install is manual (Share → Add to Home Screen) — hence the hint.
- Storage of a NON-installed site can be evicted after ~7 days without a visit; installed
  apps are kept. Another reason for `storage.persist()`.
- Web Push only works once installed (iOS 16.4+), and only after a user gesture.
- The manifest is used for name, icons and display; `apple-touch-icon` is still the icon iOS
  reads first. `apple-mobile-web-app-capable` is deprecated — the manifest's `display` covers it.

---

## Checklist before shipping

- [ ] Offline scope decided and written in MEMORY.md → Decisions
- [ ] Served over HTTPS; worker file served with `Cache-Control: no-cache`
- [ ] Manifest complete; `any` and `maskable` icons separate; maskable checked on maskable.app
- [ ] `registerType: "prompt"` / `skipWaiting: false` — no forced takeover
- [ ] Update prompt appears on a new deploy and reloads into it (checked on a real device)
- [ ] No API, function, database or signed-in HTML response in any service-worker cache
      (DevTools → Application → Cache Storage)
- [ ] Sign-out wipes persisted query data
- [ ] `navigator.storage.persist()` requested after sign-in / first load
- [ ] CSP has `worker-src 'self'; manifest-src 'self'`
- [ ] Next only: proxy matcher excludes the worker and manifest
- [ ] Installed and opened on Android Chrome AND iOS Safari (and desktop Chrome if targeted)
- [ ] The tests above green
