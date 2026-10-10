---
name: add-scroll-to-top
description: "OPT-IN — do not build a scroll-to-top button unless the user explicitly asks for one or invokes /add-scroll-to-top. Fixed scroll-to-top button plus its Lenis-aware ScrollContext methods (scrollToTop immediate vs scrollToTopSmooth animated). Also use when window.scrollTo is silently ignored on desktop because Lenis is intercepting scroll."
---

# Scroll-to-Top Button

---

## Mental Model

The button lives fixed bottom-right.
It fades in after the user scrolls 400px. Clicking it triggers a smooth scroll
via Lenis on desktop, native `behavior: "smooth"` on mobile.

The smooth scroll must go through Lenis — `window.scrollTo` is silently ignored
when Lenis is active. This is why `scrollToTop` (used by page transitions) and
`scrollToTopSmooth` (used by the button) must be two separate methods.

---

## ScrollContext — Two Methods Required

```ts
// contexts/ScrollContext.tsx
interface ScrollContextValue {
  scrollToTop: () => void        // immediate — for page transitions
  scrollToTopSmooth: () => void  // animated — for the button
}

// scrollToTop — immediate, no animation (page transition use only)
const scrollToTop = () => {
  if (lenisRef.current) {
    lenisRef.current.scrollTo(0, { immediate: true })
  } else {
    window.scrollTo(0, 0)
  }
}

// scrollToTopSmooth — animated, quartic ease-out
const scrollToTopSmooth = () => {
  if (lenisRef.current) {
    lenisRef.current.scrollTo(0, {
      duration: 1.4,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
    })
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
}
```

Never merge these into one function with a flag — the call sites are different
in intent and the distinction must be clear at the call site.

---

## Component

```tsx
// components/ui/ScrollToTop.tsx  "use client"
import { useState, useEffect } from "react"
import { useScroll } from "@/hooks/useScroll"

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  const { scrollToTopSmooth } = useScroll()

  useEffect(() => {
    function onScroll() { setVisible(window.scrollY > 400) }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={scrollToTopSmooth}
      aria-label="Volver arriba"
      className={`scroll-top keyboard-focus-ring${visible ? " scroll-top--visible" : ""}`}
    >
      ↑
    </button>
  )
}
```

Mount once in `Providers.tsx` as a sibling of `ChatWidget` and `Toaster`.
Never inside a page or layout.

---

## CSS

```css
.scroll-top {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  z-index: var(--z-toast);
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: var(--color-paper);
  color: var(--color-ink);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 1.125rem;
  box-shadow: 0 4px 16px rgba(28,24,19,.12);
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition: opacity 0.3s var(--ease-brand), transform 0.3s var(--ease-brand),
              background 0.25s, border-color 0.25s;
}
.scroll-top--visible  { opacity: 1; transform: translateY(0); pointer-events: auto; }
.scroll-top:hover     { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }

@media (max-width: 480px) { .scroll-top { bottom: 1.25rem; left: 1.25rem; } }
```

---

## Rules

- **400px threshold** — show after 400px scroll, hide at top. Adjust per page length.
- **Passive scroll listener** — always `{ passive: true }`.
- **`scrollToTopSmooth` only** — never call `scrollToTop` (immediate) from the button.
- **`keyboard-focus-ring`** — mandatory on the button element.
- **44×44px minimum** — meets touch target requirements.
- **Never lazy-load** — it mounts in Providers and must be available immediately.
