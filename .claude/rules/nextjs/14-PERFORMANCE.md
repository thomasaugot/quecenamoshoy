---
paths:
  - "app/**"
  - "components/**"
  - "contexts/**"
  - "hooks/**"
  - "lib/**"
  - "utils/**"
  - "styles/**"
  - "config/**"
  - "constants/**"
  - "services/**"
  - "types/**"
  - "i18n/**"
  - "locales/**"
  - "next.config.*"
  - "proxy.ts"
  - "globals.css"
---

# PERFORMANCE.md: Loading & Bundle Rules

---

## Lazy Loading Rules

**Only the first screen is eager. Everything below it, and everything opened on demand,
is loaded with `next/dynamic`.** Found on Fronton King (Oct 2026): no page used it at all.

| Static import | `next/dynamic` |
|---|---|
| The hero and anything on the first screen | Every section below the first screen |
| Navbar, PageLoader, PageShell, Providers, LiveRegion, Toaster | Modals, dialogs, sheets, photo viewers |
| Any component that calls `markReady()` | Sections shown only in some states, one-of-N variants |

```tsx
"use client"
import dynamic from "next/dynamic"
import { HomeHero } from "@/components/pages/home/HomeHero"   // first screen: static

// Below the first screen. Named exports: .then((m) => m.Name)
const HomeVenue = dynamic(() =>
  import("@/components/pages/home/HomeVenue").then((m) => m.HomeVenue))
```

- Keep SSR (the default). `ssr: false` only for a module that touches `window` at import time.
- No `loading` fallback for a server-rendered section: the HTML is already there.

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
"size-limit": [{ "path": ".next/static/chunks/**/*.js", "limit": "200 KB" }]
```

## Look inside the bundle before it grows

`@next/bundle-analyzer` (`ANALYZE=true next build`)` — run it before adding any dependency heavier than ~20 KB, and whenever the
size check fails. Usual culprits: a whole date library for one format (use `Intl` /
`useFormatter`), all of lodash for one function, an icon pack imported as a namespace, a
locale bundle loaded for every language.

## React Compiler — no hand-written memoisation

The React Compiler memoises components and values automatically. It requires pure renders and
no state written during render — exactly what the lint rules already enforce
(15-CHECKLIST.md §N).

```ts
// next.config.ts — npm install -D babel-plugin-react-compiler
reactCompiler: true
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

**The outcome: a tap answers at once, and the server is never the reason a page waits.**
Five measures, all on Frontón King since Oct 2026. Apply every one of them.

### 1. Cache data that is the same for every visitor (`lib/supabase/shared-read.ts`)

A force-dynamic page asks the database again on every tap. Data that is identical
for everyone and changes a few times a day (roster, programme, map, settings,
sponsor list) goes through `sharedRead(key, tag, load)`, Next's server cache, keyed
by schema.

```ts
export const listRiders = async () => {
  try {
    return await sharedRead("riders:list", CACHE_TAGS.riders, async (supabase) => {
      const { data, error } = await supabase.from("riders").select("id, full_name")
      if (error) throw new Error(`riders query failed: ${error.code}`)   // THROW
      return data ?? []
    })
  } catch (error) {
    logger.error("listRiders threw", error)
    return []                       // fallback for THIS request only
  }
}
```

- **`load` throws on a query error, never returns a fallback.** A returned `[]` is
  cached and served to everyone; a throw is never cached.
- **Every service that WRITES the table calls `expireSharedRead(CACHE_TAGS.x)`** right
  after the write, in the same function. Writes from a join count too: a sponsor rename
  expires `challenges`, because a challenge carries its sponsor's name.
- **Never inside the cache:** anything per-visitor (cookies, session, rider device),
  and live data that changes by the second (heats, scores).
- A 60s `revalidate` is only a safety net for edits made outside the app (Studio, scripts).
- Tags live in `constants/cache-tags.ts`. A new cached read = a new tag + every writer.

### 2. Start the request with the exit animation, not after it

`navigateTo` calls `router.push` FIRST, then runs `exitPage`. The fade no longer
delays the request. Two guards make this safe:

- `exitPage` resolves on `onInterrupt` as well as `onComplete`, and `PageShell`
  calls `gsap.killTweensOf(main)` before its pre-paint snap: a cached page can land
  inside the 180ms fade, and the exit must stop writing opacity over the entrance.
- After the exit, `killAllAnimations` only runs if the URL is still the old one.
  Once the new page is in, it would kill the NEW page's tweens and ScrollTriggers.

### 3. Independent queries run in parallel

Two awaits that do not depend on each other are a `Promise.all`, never two lines.
A query only the end of the page needs is started early and awaited late:

```ts
const challenges = listActiveChallenges()        // started now
const [settings, days] = await Promise.all([getEventSettings(), getPublicDays()])
// ...
const banners = (await challenges).map(...)      // awaited where used
```

The one exception: an auth check runs BEFORE the data it protects.

### 4. Prefetch on intent

`TransitionLink` calls `router.prefetch(href, { kind: "full" })` on `pointerdown`
(touch: ~100ms before the click) and on mouse `pointerenter`. Once per link, reset by
`onInvalidate`; never for external links or the page already on screen. Viewport
prefetch stays off, so a screen full of links does not fire a request each.
`"full"` fetches the page's DATA, not just the shell down to its `loading.tsx`.

Tested for the in-flight race the old `prefetch={false}` comment feared: production
build, 60 taps landing on unfinished prefetches at 150 and 400ms latency, no stream
error. Re-run that test after a Next major upgrade.

### 5. Keep visited pages in the router's memory

```ts
// next.config.ts
experimental: { staleTimes: { dynamic: 120, static: 120 } }
```

`dynamic` keeps a visited force-dynamic page for 2 min (Next's default is 0, a fresh
server render on every return). `static` is also the lifetime of a full prefetch,
lowered from 5 min so a warmed page is never older than a visited one.

Because the router now holds private pages in memory, **sign-out is a full document
load** (`window.location.assign`), never `navigateTo`: a soft navigation would leave the
signed-in pages there for whoever uses the device next.

---

## Page loading state

**Public pages: `PageLoading`, not a skeleton. Panels: a bespoke skeleton.**

```tsx
// app/[locale]/<page>/loading.tsx: every public page
import { PageLoading } from "@/components/layout/PageLoading"
export default function Loading() { return <PageLoading /> }
```

A skeleton promises a wait. On pages whose data is small and cached (see the
performance rules), the wait is a few hundred ms, and a grid of grey bars for that
long announced a loading screen nobody needed. `PageLoading` instead:

- **Shows nothing for the first second.** Most pages land inside it; the visitor sees
  the exit fade, then the real page drifting in.
- **After one second, the brand crest fades in at the centre** (700ms, scale 0.94 to 1) and rides a slow swell
  over three bouncing dots (CSS: `.page-loading-mark`, `animation-delay: 1000ms`).
  No text, no ring. Portalled to `<body>`: inside `<main>` the fixed mark followed
  main's entrance transform and jumped when it was cleared.
- **Hands the entrance to PageShell.** Its `useLayoutEffect` cleanup fires
  `PAGE_LOADED_EVENT` in the commit that swaps in the real page; PageShell hides `<main>`
  and replays `enterPage`, before paint. Without it the content popped in over a page that
  had already finished entering.
- Fills at least a full screen (`min-h-svh`), so the footer never shows while a page loads.

**Two routes legitimately have none**, and neither is an oversight:

- the `[...unmatched]` catch-all — it calls `notFound()` immediately and awaits nothing, so a
  loading state would flash for a render that never happens
- a login/auth page that only mounts a client component with no server data to wait on

The rule is *every route that awaits something*, not every folder.

A bespoke SKELETON belongs only where the data really is heavy and the layout is
**known and stable**: an admin or sponsor panel whose shape you control. It must match the
panel's CURRENT shape: one here once showed a grid of stat tiles for a panel that had since
become a list of rows, so the screen rearranged itself on load. A wrong skeleton is worse
than none.

Wrap the placeholder region in `aria-busy="true"`.
