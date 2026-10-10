---
name: build-page-loader
description: "Build or debug the full-screen PageLoader. EVERY project has one — build it as part of the standard layout without waiting to be asked, and invoke this skill whenever you create or touch PageLoader.tsx or loader-animations.ts. Initial-load overlay: SVG logo stroke-draw, progress bar, ink-curtain exit, appReady/loaderGone handoff. Also use when the progress bar animates backward or flickers, when the loader shows under the Navbar, or when loaderGone-gated entrance animations never fire."
---

# PageLoader Component

## Mental Model

```
Mount
  → useLayoutEffect: initLoader(root) + tickProgress(root, 0.85, MIN_DURATION - 0.5s)
      ↳ logo SVG draws via stroke-dashoffset animation
      ↳ progress bar fills left→right to 85% over ~1.3s
appReady fires
  → wait remaining time so total ≥ MIN_DURATION (1800ms)
  → exitLoader(root, onComplete)
      ↳ kill tickProgress tween
      ↳ bar fills 85%→100% (0.35s)
      ↳ logo fades out + slides right
      ↳ overlay clips upward (ink curtain wipe)
  → onComplete: setVisible(false), markLoaderGone(), announce()
      ↳ markLoaderGone() flips AppReadyContext.loaderGone → unblocks first-paint
        entrance animations that must NOT run while the loader is still visible
        (see 05-ANIMATIONS.md "appReady ≠ loaderGone")
```

---

## Z-Index — Critical

The loader uses `--z-loader: 110`. This must exceed `--z-nav: 100`.

**Never use `--z-overlay` for the loader.** `--z-overlay` (80) is below the Navbar (100) — the Navbar logo will show through.

```css
/* styles/theme.css */
--z-overlay: 80;
--z-toast:   90;
--z-nav:     100;
--z-loader:  110;   /* must be highest */
```

```css
/* styles/base.css */
.z-loader { z-index: var(--z-loader); }
```

---

## Progress Bar — Rules (hard-won)

**The bar only ever moves left → right. Never backward.**

Three things must all be true:

1. **Initial state set via Tailwind** — use `[transform:scaleX(0)]` and `origin-left` classes on the bar element. Additionally call `gsap.set(line, { scaleX: 0 })` at the top of `initLoader` to sync GSAP's internal state.

2. **`gsap.set(line, { scaleX: 0 })` at the top of `initLoader`** — syncs GSAP's internal state with the DOM. Without this, GSAP reads the starting value as `scaleX(1)` and animates backward.

3. **`gsap.killTweensOf(line)` before `exitLoader` starts its fill tween** — kills the `tickProgress` tween so two tweens don't fight over `scaleX` simultaneously.

```
tickProgress: 0 → 0.85, power2.out, ~(MIN_DURATION - 0.5)s
exitLoader fill: 0.85 → 1.0, power2.out, 0.35s  (after killTweensOf)
```

**Never use `power1.inOut` or any `inOut` ease on the bar** — the deceleration in the middle reads visually as the bar reversing. Use `power2.out` only.

---

## SVG Logo — Hiding Before Animation

The SVG paths use `strokeDashoffset` as a **presentation attribute** (`strokeDashoffset={1800}` in JSX, not inside the `style` prop). This sets an SVG attribute directly — guaranteed present from the first React render, not subject to style reconciliation timing.

Do NOT use `clearProps: "all"` on these paths — it wipes the dashoffset and causes a flash of the fully-drawn logo before GSAP restores it.

---

## Component Structure

```tsx
// components/layout/PageLoader.tsx  "use client"

const MIN_DURATION = 1800  // ms — minimum loader display time

export function PageLoader() {
  const appReady   = useAppReady()
  const [visible,  setVisible] = useState(true)
  const rootRef    = useRef<HTMLDivElement>(null)
  const startTime  = useRef(0)          // ← NOT useRef(Date.now())
  const readyFired = useRef(false)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    startTime.current = Date.now()      // impure calls belong in the effect
    initLoader(root)
    tickProgress(root, 0.85, MIN_DURATION / 1000 - 0.5)
  }, [])

  useEffect(() => {
    if (!appReady || readyFired.current) return
    readyFired.current = true
    const remaining = Math.max(0, MIN_DURATION - (Date.now() - startTime.current))
    setTimeout(() => {
      const root = rootRef.current
      if (!root) return
      exitLoader(root, () => {
        setVisible(false)
        markLoaderGone()   // unblocks loaderGone-gated entrance animations
        announce("Página lista", "polite")
      })
    }, remaining)
  }, [appReady])

  if (!visible) return null

  return (
    <div
      ref={rootRef}
      role="status"
      aria-label="Cargando"
      className="z-loader fixed inset-0 flex flex-col items-center justify-center bg-ink"
    >
      <div data-anim="loader-content" className="flex flex-col items-center">
        <svg aria-hidden="true" ...>
          <path
            data-anim="loader-body"
            strokeDashoffset={TOTAL_LENGTH}     {/* presentation attribute — NOT in style prop */}
            strokeDasharray={TOTAL_LENGTH}      {/* SVG presentation attribute, not style prop */}
          />
        </svg>

        {/* Track */}
        <div className="relative overflow-hidden ..." aria-hidden="true">
          {/* Bar — Tailwind sets initial scaleX(0); gsap.set syncs GSAP state in initLoader */}
          <div
            data-anim="loader-line"
            className="absolute inset-0 origin-left [transform:scaleX(0)]"
          />
        </div>
      </div>
    </div>
  )
}
```

---

## Animation Functions

```ts
// utils/animations/loader-animations.ts  "use client"

export function initLoader(root: HTMLElement): void {
  // gsap.set BEFORE any tween — syncs GSAP's internal state with inline style
  gsap.set(line, { scaleX: 0 })
  // draw SVG logo, then animate bar via tickProgress (called separately)
}

export function tickProgress(root: HTMLElement, targetScale: number, duration: number): void {
  gsap.to(line, { scaleX: targetScale, duration, ease: "power2.out" })
  // power2.out only — never inOut (causes visual reversal)
}

export function exitLoader(root: HTMLElement, onComplete: () => void): void {
  gsap.killTweensOf(line)   // REQUIRED — stop tickProgress before filling to 1
  // 1. fill bar to 1.0
  // 2. fade logo out
  // 3. clip overlay upward
}
```

---

## ⚠️ `useRef(Date.now())` is an impure render

`useRef(Date.now())` evaluates during render, which React forbids — lint reports
*"Cannot call impure function during render"*. Initialise the ref to `0` and stamp
it inside the layout effect. Same applies to `Math.random()` and `new Date()`.

---

## Placement

Mounted once in `Providers.tsx` as a sibling of `PageShell`. Never inside a page. Never lazy-loaded.

```tsx
<PageLoader />
<PageShell>{children}</PageShell>
<TransitionOverlay />
```
