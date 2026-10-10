---
name: add-parallax
description: "OPT-IN — do not apply unless the user explicitly asks for parallax or invokes /add-parallax. Never add parallax on your own initiative, and never infer it from a design brief. GSAP ScrollTrigger image parallax via data-speed attributes. Also use when parallax ALREADY exists and is broken: image edges showing during scroll travel, or triggers leaking across page navigations."
---

# Image Parallax

---

## Implementation

Parallax lives in `utils/animations/parallax.ts`. It uses GSAP `scrollTrigger` inline on a `gsap.to` tween — the standard GSAP add-parallax pattern.

```ts
// utils/animations/parallax.ts
import { gsap, ScrollTrigger } from "@/lib/gsap"
import { isDesktop } from "@/utils/device"

const triggers: ScrollTrigger[] = []

export function initParallax(): void {
  if (!isDesktop()) return
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

  killParallax()

  document.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => {
    const speed = parseFloat(el.getAttribute("data-speed") ?? "0.2")
    const tween = gsap.to(el, {
      yPercent: speed * -30,
      ease: "none",
      scrollTrigger: {
        trigger: el.parentElement!,
        start: "top bottom",
        end: "bottom top",
        scrub: 3,  // lag in seconds — controls organic feel
      },
    })
    if (tween.scrollTrigger) triggers.push(tween.scrollTrigger)
  })
}

export function killParallax(): void {
  triggers.forEach((t) => t.kill())
  triggers.length = 0
  document.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => {
    gsap.set(el, { yPercent: 0 })
  })
}
```

---

## Usage in JSX

The **container** must have `overflow: hidden` and `position: relative`. The **image wrapper** gets `data-speed` and an oversized `inset` so edges never show during travel.

```tsx
// Container — clips the image
<div className="relative overflow-hidden">
  {/* Image wrapper — gets the parallax */}
  <div data-speed="0.2" className="absolute inset-y-[-15%] inset-x-0">
    <Image fill className="object-cover" ... />
  </div>
</div>
```

⚠️ Tailwind classes only — `style={{}}` is banned by rule 03 and blocked by
`.claude/hooks/check-rules.sh`. GSAP writes inline styles itself and hand-written
ones fight it.

`inset` must be large enough to cover the travel distance. `-15% 0` works for `data-speed="0.2"`. Increase inset if you increase speed.

---

## Speed values

`yPercent = speed * -30` — so `data-speed="0.2"` = `yPercent: -6`. Keep all images at the same speed for visual consistency.

```
data-speed="0.2"  → subtle depth (default — use this everywhere)
data-speed="0.3"  → more pronounced
```

---

## Wiring — useGSAPAnimations

Call `initParallax` via `useGSAPAnimations` in each page client component, in the `timeout` tier. Never in a global runner — it must run after the page DOM is fully painted and `ScrollTrigger.refresh()` has completed.

```ts
// In each *Client.tsx that has [data-speed] elements:
useGSAPAnimations(() => ({
  timeout: [() => { initParallax(); return killParallax }],
}))
```

`killParallax` is returned as the cleanup function — it kills all ScrollTrigger instances and resets `yPercent` on navigation.

---

## Rules

- Desktop only — `isDesktop()` guard (≥1280px). No parallax on mobile.
- `prefers-reduced-motion` disables it entirely.
- Never use a global runner (Providers-level) — the DOM may not be ready when it mounts.
- Never use `window.scroll` + manual lerp — use GSAP ScrollTrigger scrub which handles smoothing natively and stays in sync with Lenis.
- `scrub: 3` — do not change without checking feel. Lower = more instant/abrupt, higher = more laggy.
- The `triggers` array is module-level — `killParallax` must always be called before `initParallax` to avoid leaking instances across navigations.
