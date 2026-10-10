---
paths:
  - "src/**"
  - "vite.config.*"
  - "index.html"
---

# PERFORMANCE.md: Loading & Bundle Rules (Vite + React)

---

## Lazy Loading Rules

**Only the first screen is eager. Everything below it, and everything opened on demand,
is loaded lazily.** Pages are already lazy routes (04-CLIENT_SERVER.md); this is about what
is inside a page.

| Static import | `React.lazy` |
|---|---|
| The hero and anything on the first screen | Every section below the first screen |
| RootLayout, Navbar, PageLoader, PageShell, Providers, LiveRegion, Toaster | Modals, dialogs, sheets, photo viewers |
| Any component that calls `markReady()` | Sections shown only in some states, one-of-N variants |

```tsx
import { lazy, Suspense } from "react"
import { HomeHero } from "@/components/pages/home/HomeHero"   // first screen: static

// Below the first screen. Named exports: .then((m) => ({ default: m.Name }))
const HomeVenue = lazy(() =>
  import("@/components/pages/home/HomeVenue").then((m) => ({ default: m.HomeVenue })))

<HomeHero />
<Suspense fallback={null}><HomeVenue /></Suspense>
```

- A lazy section's `Suspense` fallback is `null` or a block of the SAME height (no layout
  jump), never a spinner.
- A modal's chunk is preloaded on the intent to open it (`pointerenter` / `pointerdown` on
  its trigger), so the click opens it at once.

---

## Budget — numbers, not "fast"

| Metric | Budget (mobile, 4G) | Checked by |
|---|---|---|
| JS for the first page (gzip) | ≤ 200 KB | `size-limit` in CI — **blocks** |
| LCP | < 2.5 s | Lighthouse in CI (report only) + Sentry performance |
| CLS | < 0.1 | Lighthouse |
| INP | < 200 ms | Sentry / field data |

Only the bundle size blocks: it is deterministic. Lighthouse scores move run to run, so they
are reported, and a regression is read, not auto-failed.

```json
// package.json
"size": "size-limit",
"size-limit": [{ "path": "dist/assets/index-*.js", "limit": "200 KB" }]
```

## Look inside the bundle before it grows

`rollup-plugin-visualizer` (`npm run analyze` → `vite build --mode analyze`, opens the treemap)` — run it before adding any dependency heavier than ~20 KB, and whenever the
size check fails. Usual culprits: a whole date library for one format (use `Intl` /
`useFormatter`), all of lodash for one function, an icon pack imported as a namespace, a
locale bundle loaded for every language.

## React Compiler — no hand-written memoisation

The React Compiler memoises components and values automatically. It requires pure renders and
no state written during render — exactly what the lint rules already enforce
(15-CHECKLIST.md §N).

```ts
// vite.config.ts — npm install -D babel-plugin-react-compiler
react({ babel: { plugins: ["babel-plugin-react-compiler"] } })
```

- `useMemo` / `useCallback` / `memo` written by hand only with a comment saying why the
  compiler is not enough (e.g. a value used as an effect dependency that must keep its identity).
- A component the compiler skips shows in the lint output (`react-hooks` compiler rules) —
  fix the impurity, do not silence the rule.

## Long lists — virtualise or paginate

A list that can exceed ~100 rows renders only what is on screen (`@tanstack/react-virtual`)
or is paginated / loads more on scroll. Five hundred rendered rows make every tap slow (INP)
on a mid-range phone. Inside a Lenis-scrolled page, the virtualiser reads the window scroll,
and a list in its own scroll box gets `data-lenis-prevent` (05-ANIMATIONS.md).

---

## Fast navigation

**The outcome: a tap answers at once, and data is never the reason a page waits.**

### 1. Cache data with TanStack Query — `staleTime` decides, per kind of data

There is no server cache: the browser's query cache is it (04-CLIENT_SERVER.md owns the
"server data lives in TanStack Query" rule). What changes per query is how long a result is
trusted:

| Data | `staleTime` | Why |
|---|---|---|
| Same for every visitor, changes a few times a day (settings, catalogue, lists) | 5–30 min | Returning to a page is instant, no request |
| The user's own data they edit here | 0–60 s + **invalidate on every write** | Fresh after any change, cheap otherwise |
| Live (scores, chat, presence) | realtime subscription, or a short `refetchInterval` | Polling a page that is not open is waste: pause when hidden |

- The default in `src/lib/query-client.ts` is the middle row; a query that needs another value
  sets it explicitly, with a comment saying why.
- **Every mutation invalidates the queries it changed**, in the same hook (`onSuccess`). A
  write that relies on `staleTime` running out shows stale data on purpose.
- `gcTime` ≥ `staleTime`, so a page visited a minute ago still has its data in memory.
- A query function **throws** on error (never returns `[]`): a returned fallback would be
  cached and shown as truth.

### 2. The page's code downloads during the exit fade

Already in 06-TRANSITIONS.md: `navigateTo` runs `exitPage` and `preloadRoute` in parallel, so
the 180ms fade covers the download.

### 3. Independent queries run in parallel — no waterfalls

A page starts ALL its queries at the top of its controller. A query that waits for another
(`enabled: !!a.data`) is a waterfall: the second request only leaves after the first returns.

```ts
// ✅ all start together
const settings = useSettings()
const days = useDays()
const banners = useBanners()

// ❌ waterfall: days only starts once settings has arrived
const days = useDays({ enabled: !!settings.data })
```

Only chain queries when the second genuinely needs the first's result — and then ask whether
the backend should return both in one call.

### 4. Prefetch on intent — code AND data

`TransitionLink` already preloads the page's code on `pointerenter` / `pointerdown`
(06-TRANSITIONS.md). It also prefetches the page's primary queries, so the page arrives with
its data:

```ts
// src/app/route-modules.ts — next to the lazy import, the page's data
export const routeData = {
  about: (queryClient: QueryClient) => queryClient.prefetchQuery(aboutQuery()),
} as const
// preloadRoute(href) → load the chunk AND routeData[routeKey]?.(queryClient), in parallel
```

Once per link; never for external links or the page already on screen. `prefetchQuery`
respects `staleTime`, so a fresh cache costs nothing.

### 5. Sign-out is a full document load

The query cache holds the user's private data in memory. Sign-out:
`queryClient.clear()`, sign out with the auth provider, then `window.location.assign("/")` —
never `navigateTo`: a soft navigation would leave the signed-in data in memory for whoever
uses the device next.

---

## Page loading state

**Public pages: `PageLoading`, not a skeleton. Panels: a bespoke skeleton.**

```tsx
// the page controller — page data uses useQuery, NOT useSuspenseQuery
const about = useAboutQuery()
if (about.isPending) return <PageLoading />
if (about.isError) throw about.error            // → RouteError (04-CLIENT_SERVER.md)
return <><PageMeta routeKey="about" /><AboutHero /></>
```

Why not Suspense for page data: React Router navigates inside a transition, so a suspending
page keeps the OLD page on screen — which the exit fade has just made invisible. The result is
a blank screen with no loader. `isPending` → `PageLoading` is explicit and always shows.

A skeleton promises a wait. On pages whose data is small and cached, the wait is a few hundred
ms, and a grid of grey bars for that long announces a loading screen nobody needed.
`PageLoading` instead:

- **Shows nothing for the first second.** Most pages land inside it; the visitor sees the exit
  fade, then the real page drifting in.
- **After one second, the brand crest fades in at the centre** (700ms, scale 0.94 to 1) and
  rides a slow swell over three bouncing dots (CSS: `.page-loading-mark`,
  `animation-delay: 1000ms`). No text, no ring. Portalled to `<body>`: inside `<main>` the
  fixed mark followed main's entrance transform and jumped when it was cleared.
- **Hands the entrance to PageShell.** Its `useLayoutEffect` cleanup fires
  `PAGE_LOADED_EVENT` in the commit that swaps in the real page; PageShell hides `<main>` and
  replays `enterPage`, before paint. Without it the content popped in over a page that had
  already finished entering.
- Fills at least a full screen (`min-h-svh`), so the footer never shows while a page loads.

Pages that wait for nothing (the 404 page, a login form) have none — the rule is *every page
that waits for data*, not every page.

A bespoke SKELETON belongs only where the data really is heavy and the layout is **known and
stable**: an admin panel whose shape you control. It must match the panel's CURRENT shape: a
skeleton showing stat tiles for a panel that had become a list of rows made the screen
rearrange itself on load. A wrong skeleton is worse than none.

Wrap the placeholder region in `aria-busy="true"`.
