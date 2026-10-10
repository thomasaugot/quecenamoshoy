---
name: build-navbar
description: "Build or debug the Navbar. EVERY project has one — build it as part of the standard layout without waiting to be asked, and invoke this skill whenever you create or touch Navbar.tsx. Desktop hide-on-scroll-down / reveal-on-scroll-up header: frosted-glass background, ink/paper logo crossfade, IntersectionObserver theme detection, mobile menu. Also use when the header scrolls with the page instead of staying fixed, when hide/reveal never triggers, or when the header jumps as the mobile menu toggles."
---

# Navbar Implementation

---

## Hide / Reveal — The Only Pattern That Works

**Use a plain `window.addEventListener("scroll")` mounted once with `[]`. No rAF wrapper, no gsap.ticker, no dependency array with state.**

Set transition and willChange directly in JS before the scroll handler. Use local variables — NOT refs — for `lastScrollY` and `isHidden`.

```ts
useEffect(() => {
  const header = headerRef.current
  if (!header) return

  header.style.transition = "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
  header.style.willChange = "transform"

  let lastScrollY = 0
  let isHidden    = false

  function showMenu() {
    if (isHidden) {
      header!.style.transform = "translateY(0)"
      isHidden = false
    }
  }

  function hideMenu() {
    if (!isHidden) {
      header!.style.transform = `translateY(-${header!.offsetHeight}px)`
      isHidden = true
    }
  }

  function handleScroll() {
    const currentScrollY = window.scrollY
    if (currentScrollY < lastScrollY) {
      showMenu()
    } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
      hideMenu()
    }
    lastScrollY = currentScrollY
  }

  window.addEventListener("scroll", handleScroll, { passive: true })

  return () => {
    window.removeEventListener("scroll", handleScroll)
    header!.style.transform  = ""
    header!.style.transition = ""
    header!.style.willChange = ""
  }
}, [])
```

---

## Why These Rules Exist (hard-won)

**Use `header.offsetHeight` in px, never `"-110%"`**
Percentage values in `transform` are relative to the element itself but behave unreliably on `position: fixed` elements in some browsers. Pixels always work.

**Set transition in JS, not CSS**
A CSS rule for `transition` can be overridden or delayed by stylesheet load order and Tailwind. Setting it directly in the effect guarantees it is present before the first scroll event fires.

**Local variables, not refs, for `lastScrollY` and `isHidden`**
Refs are shared across renders. Local variables are private to the closure and cannot be accidentally reset by a re-render or a second effect run.

**`[]` dependency array — mounted once only**
Any state value in the dependency array (e.g. `menuOpen`) causes the effect to re-register on every toggle. The cleanup wipes `transition` and resets `transform`, causing a visible jump. Use a ref (`menuOpenRef`) to read React state inside the closure instead.

**Never use `gsap.ticker` for scroll tracking**
`gsap.ticker` fires on every animation frame (60fps). `lastScrollY` gets updated every frame, so by the time the user actually scrolls, `currentScrollY === lastScrollY` and delta is always 0. The hide/reveal never triggers.

---

## CRITICAL — position:fixed and GSAP transforms

`position: fixed` breaks if ANY ancestor has an active CSS `transform`, `will-change: transform`, or `filter`. The header stops being fixed to the viewport and scrolls with the page instead.

**Culprits to avoid:**

- `willChange: "opacity, transform"` permanently on `<ma
in>` / `.page-container` → BANNED
- `will-change: transform` in CSS on any ancestor of the header → BANNED
- GSAP leaving `transform: translateY(0px)` on `<main>` after a page transition animation

After any GSAP animation on `<main>` or any page container, always clear in `onComplete`:
```ts
gsap.set(el, { clearProps: "transform" })
```

Even `translateY(0px)` breaks fixed positioning. The inline style must be completely removed.

---

## Theme Detection — IntersectionObserver

The build-navbar text colour (ink vs paper) is driven by `[data-nav-theme]` attributes on page sections, observed via `IntersectionObserver`. Never couple theme logic to the scroll handler.

```ts
// On each section hero:
<section data-nav-theme="dark">   // → paper text (nav over dark/image bg)
<section data-nav-theme="light">  // → ink text (nav over light bg)
```

Observer fires when a section enters the top 30% of the viewport:
```ts
{ rootMargin: "0px 0px -70% 0px", threshold: 0 }
```

- Once the frosted glass bg is solid (scrollY > 60), always use ink text regardless of theme
- Reset theme to `"light"` on every `pathname` change (before new sections mount)
- Use a `MutationObserver` to re-observe sections after route changes (they re-mount)

---

## Frosted Glass Background

A separate `<div ref={bgRef}>` inside the header handles the background — never animate background on the `<header>` itself. GSAP targets `bgRef` only for opacity:

```ts
gsap.to(bg, { opacity: solid ? 1 : 0, duration: 0.4, ease: "power2.out", overwrite: true })
```

`solid = scrollY > 60`

---

## Menu Open

Use a `menuOpenRef` (not state) inside the scroll closure:

```ts
// Separate effect, runs on menuOpen state change:
useEffect(() => {
  menuOpenRef.current = menuOpen
  if (menuOpen) {
    header.style.transform = "translateY(0)"  // snap back into view
  }
}, [menuOpen])
```

---

## CSS

```css
/* styles/base.css */
header[role="banner"] {
  will-change: transform;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

This is a fallback. The JS effect sets these directly on mount — JS takes precedence.
