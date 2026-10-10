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

# ANIMATIONS.md — GSAP & Animation Rules

---

## Core Rules

- All animation functions live in `utils/animations/` — pure functions, no React, no hooks
- All animation init functions that create ScrollTriggers or long-running tweens MUST return a cleanup function
- No GSAP animation runs before `appReady` is `true` (scroll/always-on animations). First-paint **entrance** animations gate on `loaderGone` instead — see "AppReadyContext Rules" — so they don't fire under the still-visible loader.
- **NEVER use `useRef` to pass DOM elements to GSAP.** Always use `data-anim` attributes and `querySelector` inside the animation function.
- **Animation files MUST be named after what they DO, never after a page or section.**
  - `verb-ticker.ts` ✅ — `about-hero.ts` ❌
  - `image-reveal-drag.ts` ✅ — `contact-hero.ts` ❌
  - `scroll-reveal.ts` ✅ — `home-animations.ts` ❌
  - Ask: "Could this animation appear on a different page?" If yes (almost always), the page name is wrong.

---

## GSAP Targeting — data-anim Pattern (mandatory)

```tsx
// ✅ In JSX — mark elements with data-anim
<div data-anim="hero-title" />
<path data-anim="loader-body" />

// ✅ In utils/animations/*.ts — query from a root element
function q(root: HTMLElement, name: string) {
  return root.querySelector(`[data-anim="${name}"]`)
}

export function initHero(root: HTMLElement) {
  const title = q(root, "hero-title")
  gsap.from(title, { opacity: 0, y: 20 })
}

// ❌ NEVER — useRef for GSAP targets
const titleRef = useRef<HTMLDivElement>(null)
gsap.from(titleRef.current, { opacity: 0 })  // BANNED
```

The component only passes its root container ref (one `useRef` per component max). Everything inside is found via `data-anim`.

---

## Preventing Flash Before Animation

Use `className="invisible"` (Tailwind's `visibility: hidden`) on elements GSAP will animate in —
**never `opacity-0`**, never an inline style. The reason is the reveal: `autoAlpha` writes
`opacity` AND `visibility`, so it always undoes `invisible`. An `opacity-0` class is only
undone if the tween happens to animate opacity; a tween that only moves `y` leaves it
transparent forever. (Both keep their layout space — that is not the difference.)

```tsx
// Elements that GSAP will animate in
<div data-anim="content" className="invisible">
  ...
</div>

// In the animation function — make visible before animating
gsap.set(content, { visibility: "visible" })
// then start your tween
```

---

## 🚨 EVERY GSAP TARGET SHIPS HIDDEN. NO EXCEPTIONS.

**This is the single most-repeated mistake in this codebase and across every project here.**

If GSAP fades, slides or scales an element IN, that element MUST be invisible on first paint.
Otherwise the browser paints it visible, then GSAP snaps it to opacity 0 one frame later, and
the user sees a **flicker**. It is not subtle and it is on every page it happens.

```tsx
// ❌ FLICKERS — painted visible, then GSAP hides it a frame later
<div data-anim="hero-scrim" className="absolute inset-0" />

// ✅ hidden at first paint, GSAP reveals it
<div data-anim="hero-scrim" className="invisible absolute inset-0" />
```

### The rule

1. Every element carrying `data-anim` that gets faded/slid/scaled in **must** have
   `className="invisible"` in its JSX — or `[transform:scaleX(0)]` for a bar that grows in.
2. The animation **must** bring it back with `autoAlpha` (not `opacity`) — `autoAlpha` writes
   `visibility` as well, so it undoes `invisible`. A plain `opacity` tween leaves
   `visibility: hidden` and the element never appears.
3. The reduced-motion branch **must** also reveal it (`gsap.set(el, { autoAlpha: 1 })`),
   otherwise reduced-motion users get a blank section.

### Which elements need it

Anything the animation touches with `autoAlpha: 0`, `opacity: 0`, `y:`, `scale:` in a
`fromTo`/`from`. Decorative layers (scrims, ridges, glows) count — they flicker just as loudly
as headings.

### Audit before shipping

```bash
python3 - <<'EOF'
import re, pathlib
for f in list(pathlib.Path('components').rglob('*.tsx')):
    src = f.read_text()
    for m in re.finditer(r'<[A-Za-z][^>]*?data-anim="([\w-]+)"[^>]*?>', src, re.S):
        tag, name = m.group(0), m.group(1)
        if not any(k in tag for k in ('invisible', 'scaleX(0)', 'scaleY(0)')):
            print(f'{f}: {name} NOT HIDDEN')
EOF
```

Every line printed is a flicker. Fix them all before calling animation work done.

---

## Mandatory Cleanup Contract

Every `init*` function that creates ScrollTriggers or long-running tweens **must**
return its own cleanup function. The cleanup is returned at the end of the utility
file — never inline at the call site.

```ts
// ❌ WRONG — no cleanup, leaks ScrollTriggers across navigations
export function initScrollReveal() {
  document.querySelectorAll("[data-reveal]").forEach(el => {
    ScrollTrigger.create({ trigger: el, onEnter: () => gsap.to(el, { opacity: 1 }) })
  })
}

// ❌ WRONG — cleanup extracted inline at the call site
useGSAPAnimations(() => ({
  timeout: [() => { initParallax(); return killParallax }],  // BANNED
}))

// ✅ RIGHT — everything created inside the context is reverted by ONE call
export function initScrollReveal(root: HTMLElement): () => void {
  const ctx = gsap.context(() => {
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      gsap.to(el, {
        autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      })
    })
  }, root)
  return () => ctx.revert()
}
```

**Always `gsap.context()` (or `gsap.matchMedia()`, below), never hand-kept arrays.** A
context records every tween, timeline and ScrollTrigger created inside it, and `revert()` kills
them AND restores the inline styles they wrote. With hand-kept arrays, the next person adds a
tween, forgets to push it, and it leaks into the next page. The `root` argument also scopes
selector strings to the component.

The cleanup is returned by the init function itself. It is never exported separately and
never referenced at the call site.

---

## useGSAPAnimations Hook — Usage Pattern

Each tier takes an array of `AnimationFn`: a function that runs the animation and
returns its cleanup. Pass the `init*` function directly — it already returns the cleanup.

> `initParallax` below is illustrative only. Parallax is opt-in — do not add it unless the
> user asked for it (see `01-BOOTSTRAP.md` Step 8).

```tsx
// ✅ Correct — init function passed directly, returns its own cleanup
useGSAPAnimations(() => ({
  critical: [initHeroAnimations],
  raf:      [initScrollReveal],
  timeout:  [initParallax],
}))

// ❌ BANNED — wrapping init to bolt on an external kill function
useGSAPAnimations(() => ({
  timeout: [() => { initParallax(); return killParallax }],
}))

// ❌ BANNED — importing killParallax at the page level
import { initParallax, killParallax } from "@/utils/animations/parallax"
```

Priority tiers:
| Tier | When | Use for |
|------|------|---------|
| `critical` | Immediately | Hero, above-fold entrance |
| `raf` | Next frame | Draws, counters needing one paint cycle |
| `timeout` | After tick | Below-fold decorative, carousels, parallax |

---

## Animation Gating Pattern

```tsx
// Hook gates automatically on appReady — no manual check needed in the component
useGSAPAnimations(() => ({
  critical: [initHeroAnimations],
}))
```

---

## AppReadyContext Rules

- `appReady` starts `false`. `markReady()` is idempotent.
- While `false`: `overflow: hidden` on body (locked here, not in components).
- Minimum display time: 600ms — prevents flicker on fast connections.
- `markReady()` only called after:
  - Component is mounted (inside `useEffect`)
  - `document.fonts.ready` has resolved
  - Any async data has resolved or errored gracefully
  - Any critical media has loaded

### `appReady` ≠ `loaderGone` — gate entrance animations on the right signal

There are TWO distinct moments, and confusing them makes hero/entrance animations
fire **underneath the still-visible PageLoader**:

- **`appReady`** — content is ready (fonts/data loaded). Fires early, ~600ms in.
  This only *permits* the loader to begin its exit; the loader is **still on screen**.
- **`loaderGone`** — the PageLoader's exit (curtain wipe) has fully completed and it
  has unmounted. Fires much later: `MIN_DURATION` (1800ms) + the exit animation (~700ms).

`AppReadyContext` exposes both: `appReady`/`markReady` AND `loaderGone`/`markLoaderGone`.
The PageLoader calls `markLoaderGone()` in its exit `onComplete`. Hooks live in
`hooks/useAppReady.ts`: `useAppReady()`, `useLoaderGone()`, `useMarkLoaderGone()`.

```tsx
// ❌ WRONG — fires ~600ms in, while the loader still covers the page
useGSAPAnimations(() => ({ raf: [initBrushDraw] }))   // gated on appReady only

// ✅ RIGHT — a post-loader entrance (hero reveal, brush draw, title intro)
const loaderGone = useLoaderGone()
useEffect(() => {
  if (!loaderGone) return
  return initBrushDraw()        // init returns its own cleanup (ANIMATIONS.md contract)
}, [loaderGone])
```

### `clearProps: "all"` breaks `next/image` with `fill`

`next/image` with the `fill` prop injects `position:absolute; inset:0; …` as
**inline styles**. `gsap.set(el, { clearProps: "all" })` wipes every inline
style, so the image loses its layout and collapses — typically to a thin strip
at the foot of its container. First load looks fine; the damage only appears
when the cleanup runs and the animation re-fires.

It is invisible to the usual checks: `visibility` and `opacity` still report
`visible` / `1`. Only the element's box (or the rendered pixels) shows it.

```ts
// ❌ wipes position/inset that `fill` relies on
gsap.set(image, { clearProps: "all" })

// ✅ clear only what the timeline set
gsap.set(image, { clearProps: "opacity,visibility,transform,scale" })
```

Rule: **always name the properties you are clearing.** `clearProps: "all"` is
only safe on an element whose inline styles you fully own.

### Entrance animations MUST key on `pathname`, not only the ready flag

`appReady` and `loaderGone` are **one-shot boot flags**: they flip to `true`
once and stay true for the whole session. An effect keyed only on them runs on
first load and **never again** — so navigating away and back lands on a static
hero with everything already visible. This is silent: nothing errors, the page
just stops animating.

```tsx
// ❌ WRONG — plays once per session, dead on every return visit
useEffect(() => {
  if (!appReady || !root) return
  return initHeroEntrance(root)
}, [appReady])

// ✅ RIGHT — re-fires on every navigation to the page
const pathname = usePathname()
useEffect(() => {
  const root = rootRef.current
  if (!appReady || !root) return
  return initHeroEntrance(root)
}, [appReady, pathname])
```

The init function's cleanup runs on the way out, so the re-run starts from a
clean slate — provided it follows the cleanup contract above and calls
`clearProps` on everything it touched.

### `loaderGone` only fires if `PageLoader` is actually mounted

`loaderGone` is set by `markLoaderGone()` inside `PageLoader`'s exit callback.
If `PageLoader` is **not mounted in `Providers.tsx`**, that call never happens
and `loaderGone` stays `false` forever — every animation gated on it silently
never runs.

Before gating on `loaderGone`, confirm `<PageLoader />` is in `Providers.tsx`.
If it is not, gate on `appReady` instead and leave a comment saying why, so the
next person does not "fix" it back to a flag that never fires.

**`Toaster` also depends on this flag** (07-UI_PRIMITIVES.md): it renders nothing
until `loaderGone`, so a missing `PageLoader` silently kills every toast in the
app, not just an animation. Removing the loader is never a local change.

Rule of thumb: **scroll-triggered** and **always-on** animations gate on `appReady`
(via `useGSAPAnimations`). **First-paint entrance** animations that must not be hidden
by the loader gate on `loaderGone`.

---

## usePageReady Hook — Full Spec

```tsx
"use client"
import { useEffect } from "react"
import { useMarkReady } from "@/hooks/useMarkReady"

export function usePageReady() {
  const markReady = useMarkReady()
  useEffect(() => {
    let cancelled = false
    const minDelay = new Promise<void>(r => setTimeout(r, 600))
    Promise.all([document.fonts.ready, minDelay]).then(() => {
      if (!cancelled) markReady()
    }).catch(() => {
      if (!cancelled) markReady()
    })
    return () => { cancelled = true }
  }, [])
}
```

Manual pattern for data-dependent pages:
```tsx
useEffect(() => {
  const min = new Promise<void>(r => setTimeout(r, 600))
  Promise.all([document.fonts.ready, min, fetchData()])
    .then(([,, data]) => { setData(data); markReady() })
    .catch(() => markReady())
}, [])
```

### Call it ONCE in PageShell — never per page

`usePageReady` runs **once**, at boot: `appReady` is a one-shot flag, so there is nothing to
re-fire on navigation (per-page entrances key on `pathname` instead, see above). Call it
**once inside `PageShell`** (which already wraps every page as
`Providers → PageShell → {children}`); do NOT repeat it in each page client.

```tsx
// components/layout/PageShell.tsx  "use client"
export function PageShell({ children }: { children: ReactNode }) {
  usePageReady()            // ← the ONLY call site. Covers every page + every nav.
  return <>{/* SkipLink, PageLoader */}{children}{/* ScrollToTopButton */}</>
}

// ❌ BANNED — do not call it in HomeClient/ProyectosClient/etc.
export function HomeClient() {
  usePageReady()            // repetition; PageShell already ran it
  ...
}
```

New pages need nothing: they render as `PageShell`'s children, so page-ready is
handled for free.

**General rule — hoist per-page boilerplate into the shared shell.** Any hook that
every page needs — run-once boot hooks (page-ready) and hooks that re-key on `pathname`
(scroll reset, analytics pageview) — belongs in `PageShell`/`LocaleShell`, called once — not copied into every
page client. The exception is the data-dependent `markReady` pattern above: a page
that must gate readiness on its own fetch calls `markReady()` itself and PageShell's
`usePageReady` is left as the fonts+min-delay fallback.

---

## Reduced Motion — Three Layers

```tsx
// component: pass the app-level override in; the system preference is a matchMedia condition
const { preference } = useMotionPreference()
useGSAPAnimations(() => ({
  critical: [(root) => initHeroReveal(root, preference === "reduced")],
}), [preference])
```

Every init handles both in its `gsap.matchMedia()` setup (see "Layout changes rebuild
animations") and **reveals** its targets when reduced — never just skips the tween.

```css
/* styles/animations.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

MotionPreferenceContext layers:
1. System: `prefers-reduced-motion` on mount
2. App override: visible UI toggle
3. Persistent: `localStorage "motion-preference"`

---

## Any scrollable overlay needs `data-lenis-prevent`

Lenis intercepts wheel events for the whole document. An overflowing dropdown,
modal body, drawer or popover therefore scrolls the PAGE behind it instead of
itself, and the user cannot reach the rest of the list.

```tsx
<ul data-lenis-prevent className="max-h-[280px] overflow-auto">
```

Applies to every element with `overflow-auto` / `overflow-y-scroll` that sits
above the page: portalled listboxes, modal content, date pickers, side panels.
Add it when you build the component, not after someone reports it.

## Lenis — ScrollContext Rules

- Desktop only: `≥ 1280px`. Return `null` on mobile.
- `gsap.ticker.add((time) => lenis.raf(time * 1000))`
- `gsap.ticker.lagSmoothing(0)`
- On unmount: `lenis.destroy()` AND `gsap.ticker.remove()` — both required.
- **Hold the instance in a `useRef`, never `useState`.** The Lenis object never drives
  rendering — consumers only call `scrollToTop()` / `scrollToTopSmooth()`, which read the
  ref. A `useState` here re-renders the entire provider subtree on init and on teardown,
  and lint flags it as *"Calling setState synchronously within an effect"*.

```tsx
// ❌ re-renders the whole tree for a value nothing renders
const [lenis, setLenis] = useState<Lenis | null>(null)
useEffect(() => { const i = new Lenis(); setLenis(i) }, [])

// ✅
const lenisRef = useRef<Lenis | null>(null)
useEffect(() => { lenisRef.current = new Lenis(); /* … */ }, [])
```

**General rule for every context:** check each exposed value against its actual consumers
before shipping. A state value nobody reads is a re-render for nothing.

---

## Layout changes rebuild animations — never reload the page

Positions, ScrollTriggers and per-breakpoint layouts are computed for one viewport. When the
layout switches breakpoint (mobile ↔ tablet ↔ desktop), **rebuild the animations**: revert the
GSAP context and run the init again. Never `window.location.reload()` on resize — a real iPad
reloads on every rotation and loses scroll position and form input.

```ts
// hooks/useMediaQuery.ts — breakpoint bucket, hydration-safe (see next section)
const QUERIES: [Breakpoint, string][] = [["desktop", "(min-width: 1280px)"], ["tablet", "(min-width: 768px)"]]
const subscribe = (onChange: () => void) => {
  const medias = QUERIES.map(([, q]) => window.matchMedia(q))
  medias.forEach((m) => m.addEventListener("change", onChange))
  return () => medias.forEach((m) => m.removeEventListener("change", onChange))
}
const get = (): Breakpoint => QUERIES.find(([, q]) => window.matchMedia(q).matches)?.[0] ?? "mobile"
export const useBreakpoint = () => useSyncExternalStore(subscribe, get, () => null)

```

`useBreakpoint()` is for **rendering** decisions (which video, which layout component).
**Animations use `gsap.matchMedia()`** instead: it runs the setup for the conditions that
match, and when a condition flips it reverts that setup (tweens, ScrollTriggers, inline
styles) and runs the new one — no React dependency, no manual rebuild.

```ts
// utils/animations/hero-reveal.ts
export function initHeroReveal(root: HTMLElement, reducedByUser: boolean): () => void {
  const mm = gsap.matchMedia(root)
  mm.add(
    {
      desktop: "(min-width: 1280px)",
      touch: "(max-width: 1279px)",
      reducedBySystem: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      const { desktop, reducedBySystem } = context.conditions ?? {}
      const targets = root.querySelectorAll("[data-anim='hero-line']")
      if (reducedByUser || reducedBySystem) {
        gsap.set(targets, { autoAlpha: 1 })          // reveal, never leave it invisible
        return
      }
      gsap.fromTo(targets, { autoAlpha: 0, y: desktop ? 40 : 20 },
        { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.6, ease: "power3.out" })
    },
  )
  return () => mm.revert()
}
```

Only the bucket matters: height changes (mobile address bar) and resizes within a breakpoint
must not rebuild — `matchMedia` only fires when a query flips. `ScrollTrigger` already
refreshes itself on resize.

---

## Browser values (matchMedia, localStorage, window) — `useSyncExternalStore`

Never read a browser value in `useState(() => window…)`: the server renders the fallback, the
client's first render reads the real value, and React reports a **hydration mismatch**. Never
`setState` it in an effect either: wrong first render, then a cascading re-render.

Read it with `useSyncExternalStore` and a **server snapshot**. React renders the server value
during hydration, then switches to the real one — no mismatch, no flash, no effect.

```tsx
// ❌ hydration mismatch on every client that differs from the server fallback
const [pref, setPref] = useState(() =>
  typeof window === "undefined" ? "full" : window.matchMedia(QUERY).matches ? "reduced" : "full")

// ❌ renders once wrong, then corrects — flash + cascading render (lint: set-state-in-effect)
const [pref, setPref] = useState("full")
useEffect(() => setPref(window.matchMedia(QUERY).matches ? "reduced" : "full"), [])

// ✅ live value, server-safe
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}
const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
```

Values that don't emit events (`localStorage`, `window.location.origin`) use a no-op subscribe.
Wrap storage reads in `try/catch` — private mode and blocked storage throw.

```tsx
const subscribeNoop = () => () => {}
const storedConsent = useSyncExternalStore(subscribeNoop, () => {
  try { return !!localStorage.getItem(KEY) } catch { return false }
}, () => true)   // server: assume consent → banner hidden until hydrated

// A user action overrides the stored value: keep an override state, derive the rest
const [override, setOverride] = useState<boolean | null>(null)
const liked = override ?? storedLiked
```

Same pattern for any "is it mounted yet?" flag before a portal — use
`if (typeof document === "undefined") return null` instead of `useState` + `useEffect`.
