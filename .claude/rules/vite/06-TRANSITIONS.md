---
paths:
  - "src/**"
  - "vite.config.*"
  - "index.html"
---

# TRANSITIONS.md — Page Transitions & Navigation (Vite + React Router)

> **⚠️ The ink-curtain / wave-wipe overlay was REMOVED (Aug 2026). Do not reintroduce it.**
> A curtain announces "something is loading" and breaks the feeling of moving
> straight from one page to the next — these routes are already client-rendered,
> so nothing needs covering. `TransitionOverlay.tsx`, `overlayRef` and
> `registerOverlay` are all deleted. `exitPage(el)` / `enterPage(el)` take the
> page element only.
>
> The transition is a content crossfade: **exit 180ms** (`opacity` + `y:6`,
> `power2.in`), **enter 320ms** (`power3.out`), fallback timeout 600ms.


---

## Mental Model

```
User clicks internal link
  → TransitionLink intercepts
  → navigateTo(href) called
  → If isTransitioning: no-op
  → setIsTransitioning(true)
  → await Promise.all([
      exitPage(pageRef),             ← page fades + lifts (180ms, power2.in)
      preloadRoute(href),            ← page code downloads DURING the fade (usually already cached)
    ])
  → killAllAnimations(pageRef)
  → navigate(href)                  ← useNavigate() from react-router
  → PageShell detects pathname change (useLocation)
  → useLayoutEffect (pre-paint): snap opacity 0 + y:28, scrollToTop()
  → useEffect: enterPage(pageRef)    ← page drifts up into place (320ms, power3.out)
  → onComplete: resetTransition(), ScrollTrigger.refresh(), scrollToTop(),
                focus <main>, announce(document.title)
  → Fallback: setTimeout(() => setIsTransitioning(false), 600)
```

---

## page-transitions.ts — Function Signatures

```ts
enterPage(el: HTMLElement): Promise<void>
exitPage(el: HTMLElement): Promise<void>
killAllAnimations(el: HTMLElement | null): void
```

Both take the page element only — there is no overlay parameter.
`killTweensOf` uses the property string `"y"` to only kill transforms.

`will-change` is set for the duration of each tween and cleared in `enterPage` —
never left on permanently (see the `position: fixed` rule below).

---

## TransitionContext.tsx Rules

```
navigateTo() step order (non-negotiable):
  1. If isTransitioning: no-op. No queuing.
  2. setIsTransitioning(true) BEFORE any await.
  3. await Promise.all([exitPage(pageRef.current), preloadRoute(href)])
     — the fade and the page download run in PARALLEL. The click answers at once (the fade
     starts immediately); the new page appears at max(180ms, download), never 180ms + download.
  4. killAllAnimations(pageRef.current)
  5. navigate(href)                ← useNavigate(); TransitionProvider sits inside the router
  6. Fallback: setTimeout(() => setIsTransitioning(false), 600)

Context exposes: isTransitioning, pageRef, registerRef, navigateTo, resetTransition

TransitionContext NEVER calls enterPage().
resetTransition() is called by PageShell after enter animation finishes.
```

---

## PageShell.tsx Rules

```
Responsibilities:
  1. Hold <main> ref. Register with TransitionContext via registerRef().
  2. Hold useScroll().scrollToTop — use this, NEVER window.scrollTo directly.
  3. Watch useLocation().pathname — re-run on every navigation.
  4. Track isFirstRender ref (skip snap on first load).
  5. On navigations (NOT first load), useLayoutEffect (pre-paint):
       a. gsap.set(el, { opacity: 0, y: 28 })
       b. scrollToTop()
  6. useEffect keyed on pathname: enterPage(el)
  7. After enterPage resolves:
       a. resetTransition()
       b. ScrollTrigger.refresh()
       c. isFirstRender.current = false
       d. scrollToTop()           ← re-assert after animation in case focus shifted it
       e. main.focus({ preventScroll: true }) and announce(document.title)
          ← a SPA page change is silent to screen readers; this is the route announcer.
          Not on first load (focus stays where the browser put it).
  8. <main> must have outline-none (prevents browser auto-scroll-into-view on
     tabIndex={-1}). NO permanent will-change — it creates a stacking context
     that breaks position:fixed on the navbar. enterPage/exitPage set it for
     the duration of the tween and clear it after.

PageShell is the ONLY place allowed to run enterPage().
```

### Back / forward — restore, do not reset

The browser's back and forward buttons do not go through `navigateTo` (no exit fade) and the
visitor expects to land **where they were**, not at the top. `useNavigationType()` tells them
apart:

| Navigation | `useNavigationType()` | Scroll |
|---|---|---|
| Link / `navigateTo` | `"PUSH"` / `"REPLACE"` | top of the page (rules below) |
| Back / forward | `"POP"` | the position saved when that entry was left |

- On every navigation, before the page changes, save `window.scrollY` in `sessionStorage`
  under the outgoing `location.key`.
- On `POP`, after `enterPage` resolves and `ScrollTrigger.refresh()` has run, scroll to the
  saved value with `scrollToY(y)` from `useScroll()` (Lenis `immediate + force`, then the
  document — same as `scrollToTop()`). No saved value → top.
- The enter animation still plays on `POP`; only the scroll target differs.

---

## Scroll-to-Top — Critical Rules

**NEVER use `window.scrollTo(0,0)` directly when Lenis is active.**
Lenis intercepts native scroll — `window.scrollTo` is silently ignored on desktop.

Always use `scrollToTop()` from `useScroll()` hook, which calls:
- `lenis.scrollTo(0, { immediate: true, force: true })` when Lenis is active (≥1280px)
- then `window.scrollTo(0, 0)` ALWAYS, inside `scrollToTop()` itself (see "Landing at the top" below)

`useScroll()` also exposes `scrollToY(y)` — the same two steps with `y` instead of `0`. It is
used only to restore the position on back/forward; never call `window.scrollTo(0, y)` for it.

**Scroll restoration is disabled in `ScrollContext` on mount:**

```ts
// src/contexts/ScrollContext.tsx — useEffect on mount
if ("scrollRestoration" in history) history.scrollRestoration = "manual"
window.scrollTo(0, 0)
```

The `PageLoader` overlay covers the page while `appReady` is false, so it masks
any one-frame scroll flash before this effect runs.

**🚫 NEVER mount React Router's `<ScrollRestoration />`** (or `useScrollRestoration`). It
restores/resets scroll on its own schedule, fights `scrollToTop()` and the exit fade, and
makes the new page jump. `PageShell` is the only thing that moves scroll on navigation.

### Pre-paint scripts — `index.html` only, never JSX

`index.html` is plain HTML: an inline `<script>` in its `<head>` runs **before React loads**,
which makes it the right place for the few things that must happen before the first paint:

```html
<!-- index.html <head> — tiny, synchronous, no imports -->
<script>
  try {
    var t = localStorage.getItem("theme")
    if (t === "light" || t === "dark") document.documentElement.dataset.theme = t
  } catch (e) {}
  if ("scrollRestoration" in history) history.scrollRestoration = "manual"
</script>
```

Without the theme line, a dark-mode visitor sees one white frame before React sets
`data-theme`. Keep it to pre-paint state only — no logic, no fetch, nothing that belongs in
React. A `<script>` rendered from JSX is still banned: React does not execute it.

---

## preloadRoute — one map of page modules

Lazy routes and preloading must use the **same** import function, so the download started by
`preloadRoute` is the one the router reuses (the browser caches an `import()` by URL).

```ts
// src/app/route-modules.ts — the single list of lazy page imports, keyed by routeKey
export const routeModules = {
  about: () => import("@/components/pages/about/AboutPage"),
  notFound: () => import("@/components/pages/not-found/NotFoundPage"),
} as const

// src/utils/preload-route.ts — never throws: a failed preload just means the router loads it
// Starts code AND data (14-PERFORMANCE.md §4) but RESOLVES ON THE CODE ONLY: navigateTo awaits
// it, and a slow query must never hold a faded-out page on screen — the page shows
// PageLoading for its data instead.
export const preloadRoute = (href: string): Promise<unknown> => {
  const key = routeKeyFromPath(href)
  if (!key) return Promise.resolve()
  routeData[key as keyof typeof routeData]?.(queryClient).catch(() => undefined)   // not awaited
  const load = routeModules[key as keyof typeof routeModules]
  return load ? load().catch(() => undefined) : Promise.resolve()
}
```

`router.tsx` builds its `lazy` entries from `routeModules` (04-CLIENT_SERVER.md).
`routeKeyFromPath` (in `src/i18n/paths.ts` with i18n, `src/utils/` without) strips the locale
prefix and query/hash and looks the path up in the route table — the reverse of
`localizedPath` (09-I18N.md). Keyed by routeKey, one entry serves every language's slug.

---

## TransitionLink.tsx Rules

Drop-in for React Router's `Link` (it renders `Link` and intercepts the click). Click order is non-negotiable:

```
1. Ignore modifier-key clicks (metaKey, ctrlKey, shiftKey, altKey)
2. Ignore downloads and non-_self targets
3. Pass-through for external URLs (http, mailto, tel)
   ── On pointerenter (mouse) and pointerdown (touch, ~100ms before the click):
      preloadRoute(href) — once per link, never for external URLs or the current page.
      By the time the click lands, the page code is usually already downloaded.
4. Strip query/hash, compare to current pathname:
   - If SAME PAGE:
       scrollToTop() or window.scrollTo({ top: 0, behavior: "smooth" })
       call consumer onClick
       return — DO NOT call navigateTo
       (Without this: exit animation runs with no incoming page → permanently invisible)
5. event.preventDefault()
6. If isTransitioning: return (no queuing)
7. await navigateTo(href)
8. Consumer onClick runs ONLY AFTER navigateTo() resolves
```

### Same-page detection — i18n locale prefix

`useLocation().pathname` returns the full path **including the locale prefix** (e.g. `/es/about`).
`href` props are always canonical slugs **without** the locale (e.g. `/about`).

They will never match unless you strip the locale prefix first:

```ts
import { locales } from "@/config/i18n.config"

const localePrefix = new RegExp(`^/(${locales.join("|")})(?=/|$)`)
const cleanPath = pathname.replace(localePrefix, "")
// "/es/about" → "/about"
// "/about"    → "/about"  (no-op if no prefix)
```

**Never compare `pathname` directly to `href`** — the same-page guard will silently fail
and the transition will fire on every click of the current page's own link.

---

## Navbar — Smart Hide/Reveal

The navbar uses a **hide-on-scroll-down, reveal-on-scroll-up** pattern.
All animation is GSAP. No CSS transitions on the header element.

**Critical: split concerns across separate elements to avoid tween conflicts.**
- `transform (y)` → targets `<header>` directly
- `background opacity` → targets a separate `<div>` inside the header (`bgRef`)
- `logo crossfade` → targets stacked `<img>` elements (`logoInkRef`, `logoPaperRef`)

Never call `gsap.to(header, { backgroundColor... })` — mixing background tweens
with transform tweens on the same element causes flickering as `overwrite` kills
the slide animation mid-flight.

```
Scroll down > 80px  → gsap.to(header, { y: "-110%", duration: 0.32, ease: "power2.in" })
Scroll up   > 6px   → gsap.to(header, { y: "0%",    duration: 0.42, ease: "power3.out" })
Scroll > 60px       → fade in bgRef (frosted glass div)
Over hero           → paper logo; elsewhere → ink logo (crossfade via stacked imgs)
Menu open           → always force y:0, ink logo, bgRef visible
```

Use `requestAnimationFrame` throttle on the scroll listener.
Use `gsap.killTweensOf(header, "y")` before each slide tween (not `overwrite`).

---

## Landing at the top after navigation — Critical Rule

**A new page must always open at the top**, wherever the previous page was scrolled.
This broke on frontonking.com (Oct 2026): leaving `/viaje` 2,350px down, `/contacto`
landed at the top and was then thrown to its bottom. Three causes, three rules:

1. **Clear ScrollTrigger's scroll memory on every navigation, before `refresh()`.**
   `ScrollTrigger.refresh()` restores the scroll position it last cached, and that is
   the PREVIOUS page's. In `PageShell`:
   ```ts
   ScrollTrigger.clearScrollMemory("manual")   // in the pre-paint effect AND
   ScrollTrigger.refresh()                     // right before every refresh
   ```
2. **`scrollToTop()` writes the document too, not only Lenis.** Lenis skips a
   `scrollTo` to where it believes it already is, so after `refresh()` moved the
   document behind its back, `lenis.scrollTo(0)` did nothing:
   ```ts
   lenis.scrollTo(0, { immediate: true, force: true })  // force: works while stopped
   window.scrollTo(0, 0)                                // always
   ```
3. **Freeze scroll input during the page change** (`freezeScroll()` in ScrollContext):
   Lenis stopped + document `overflow: hidden`, released once wheel input has been quiet
   for 200ms (a trackpad glide outlives the transition), with a 1.2s failsafe.
   **Only the glide may hold it.** A deliberate scroll releases it at once: a
   `touchstart` (momentum never fires touch events), a wheel delta that grows (a glide
   only decays), or one of 40px+ (a mouse notch). Counting every input as "glide" kept
   the new page locked for seconds whenever the visitor started scrolling it.

**Verify with a real browser, never by reading code.** Playwright: scroll a page down,
click a navbar link, assert `window.scrollY === 0` on the new page, over a route of
10+ navigations that includes a LONG page followed by a SHORT one (`/viaje` →
`/contacto`): a short page is where a stale position becomes "its bottom". A single
navigation from the top proves nothing; that is how this shipped broken twice.

## GSAP + position:fixed — Critical Rule

**After animating any container element, always clear the transform in `onComplete`:**

```ts
gsap.set(el, { clearProps: "transform" })
```

GSAP leaves `transform: translateY(0px)` as an inline style even when animating to `y: 0`. Any `transform` value — including `translateY(0px)` — creates a new stacking context that breaks `position: fixed` on ALL descendants. The fixed navbar will scroll with the page instead of staying fixed.

Never set `will-change: transform` or `willChange: "opacity, transform"` permanently on any ancestor of a `position: fixed` element. Set it only during the animation and clear it after.

---

## Navigation Rules

- `navigate()` / `useNavigate()` directly in app code is BANNED → use `navigateTo()`
- `Link` / `NavLink` from `react-router` directly in app code is BANNED → use `TransitionLink`
- `<ScrollRestoration />` is BANNED → PageShell owns scroll
- `enterPage()` outside `PageShell.tsx` is BANNED
- `window.scrollTo()` directly is BANNED → use `scrollToTop()` from `useScroll()`
- Consumer side-effects (e.g. closing a menu) must run AFTER `navigateTo()` resolves
- Navbar and Footer must be siblings of PageShell, never children of the animated container

---

## Layout Structure

```tsx
<>
  <SkipLink targetId="main-content" />
  <Navbar />          {/* sibling of PageShell */}
  <PageShell>         {/* contains <main id="main-content"> */}
    <Outlet />        {/* react-router: the matched page */}
  </PageShell>
  <Footer />
</>
```

Note: `Toaster` and `LiveRegion` are mounted in `Providers.tsx` alongside `PageShell`,
not in `RootLayout`. `RootLayout` (the root route's element) only adds `SkipLink`, `Navbar`,
`PageShell` and `Footer` (see 04-CLIENT_SERVER.md).
