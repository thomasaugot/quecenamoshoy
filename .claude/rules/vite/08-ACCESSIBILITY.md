---
paths:
  - "src/**"
  - "vite.config.*"
  - "index.html"
---

# ACCESSIBILITY.md — WCAG 2.2 AA (Non-negotiable) (Vite + React)

---

## Document Structure

- Exactly one `<main>` per page.
- Exactly one `<h1>` per page. Heading levels never skip.
- Every landmark (`<nav>`, `<header>`, `<aside>`, `<section>`) gets `aria-label` or `aria-labelledby`.
- `<html lang="...">` always set: the default locale in `index.html`, then
  `document.documentElement.lang = locale` on every language change (i18n builds). Nothing
  else renders `<html>` in a Vite app, so nothing else will update it.

---

## keyboard-focus-ring — Mandatory on Every Interactive Element

**Why a class at all:** designers remove outlines with `outline: none` because the ring shows
on mouse clicks — and that silently strips keyboard navigation for everyone. `:focus-visible`
is the browser's own answer: it matches on keyboard focus and not on mouse/touch focus. The
class exists so every interactive element opts in to the SAME ring, from one CSS rule.

```css
/* src/styles/accessibility.css */
.keyboard-focus-ring:focus { outline: none; }
.keyboard-focus-ring:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}
```

No JavaScript: never an `InputModalityTracker` or a `data-input-modality` attribute. The
browser's heuristic is better (it handles programmatic focus, text inputs and first load
before any JS runs) and it costs nothing.

**`className="keyboard-focus-ring"` is mandatory on every interactive element.**

### Fields are the exception — focus is the field's own edge, never a ring

Inputs, textareas and selects (and Dropdown/CalendarPicker triggers styled as fields) do NOT
show the outline ring. A ring around a field reads as a box drawn around a box. Focus is shown
by the field's own edge instead — still a clear keyboard indicator (≥ 2px, primary ≥ 3:1):

```css
/* styles/accessibility.css — a field drawn as a line (or a bordered box: same idea, its border) */
.field-line:focus-within {
  border-bottom-color: var(--color-primary);
  box-shadow: 0 1px 0 0 var(--color-primary);      /* thicker without moving the layout */
}
.field-line:focus-within > label { color: var(--color-primary); }
.field-line .keyboard-focus-ring:focus-visible { outline: none; }
```

Keep `keyboard-focus-ring` on the field itself (one class everywhere), and let the wrapper
override it. Buttons, links, chips and cards keep the ring.


---

## Forms — Full Accessible Contract

```tsx
<label htmlFor="contact-email">Email address</label>
<input
  id="contact-email" name="email" type="email"
  autoComplete="email" inputMode="email" required
  aria-invalid={!!error}
  aria-describedby={error ? "contact-email-error" : undefined}
  className="keyboard-focus-ring"
/>
{error && <p id="contact-email-error" role="alert">{error}</p>}
```

Rules:
- Every field has `<label>` with `htmlFor`
- `id` and `name` on all inputs
- `required` on required fields
- Error messages: `role="alert"` + `aria-describedby`
- Submit feedback via `announce()` from LiveRegion
- `inputMode` for email/tel/numeric fields
- `autoComplete` set appropriately

---

## Keyboard Navigation

- Tab order follows visual reading order.
- No positive `tabIndex`. Only `0` and `-1`.
- All interactive elements are real `<button>` or `<a>`. Never `<div onClick>`.

---

## Common ARIA Patterns

```tsx
// Icon-only button
<button type="button" aria-pressed={isActive} aria-label="Description" className="keyboard-focus-ring">
  <IconSun aria-hidden="true" />
</button>

// Nav active state
<a aria-current={isActive ? "page" : undefined}>Link</a>

// Toggle button
<button aria-expanded={isOpen} aria-controls="panel-id">Toggle</button>

// Hidden panel (inactive)
<div aria-hidden={!isActive} inert={!isActive ? "" : undefined}>...</div>

// Modal/dialog
<div role="dialog" aria-modal="true" aria-labelledby={titleId}>...</div>

// Decorative element
<div aria-hidden="true" className="pointer-events-none">...</div>
```

---

## Focus Management

**Page changes.** A SPA route change is silent: focus stays on the clicked link and screen
readers announce nothing (Vite + React Router has no built-in route announcer). `PageShell`
moves focus to `<main>` and calls `announce(document.title)` after every navigation — see
06-TRANSITIONS.md. Every page sets a unique `document.title`.

When content changes without full navigation (tabs, panels, stages, modals):
- Focus moves to new content via `useStageFocus(activeKey)`
- Modal: traps focus while open, returns focus to trigger on close

```tsx
// useStageFocus.ts
export function useStageFocus(activeKey: string) {
  const containerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const timeout = setTimeout(() => {
      containerRef.current?.focus({ preventScroll: true })
    }, 300)
    return () => clearTimeout(timeout)
  }, [activeKey])
  return containerRef
}
```

---

## Touch Targets & Mobile

```css
/* src/styles/accessibility.css */

/* Kill the mobile WebKit blue tap-highlight rectangle on EVERY interactive element.
   Without this, tapping any button/link/[role="button"] flashes a bluish frame on iOS
   and Android Chrome. Keyboard focus is handled via outline below, so this is safe. */
html, * { -webkit-tap-highlight-color: transparent; }

/* Touch targets: decided by the INPUT, not the width — an iPad at 1024px is still a finger */
@media (pointer: coarse) {
  button, [role="button"], a,
  input[type="checkbox"], input[type="radio"] {
    min-height: 44px;
    min-width: 44px;
  }
}

/* WCAG 2.2 — 2.4.11 Focus Not Obscured: a focused element scrolled into view must not land
   under the sticky navbar. Keep this equal to the navbar's height token. */
html { scroll-padding-top: var(--navbar-height); }

/* Never on body: it kills pull-to-refresh and the overscroll bounce for the whole site.
   Only on panels that scroll above the page, so they don't scroll the page behind them. */
dialog, [data-scroll-panel] { overscroll-behavior: contain; }

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border-width: 0;
}
```

---

## Mobile Menu — Required Attributes

```
Built on <dialog> + showModal() (07-UI_PRIMITIVES.md) with aria-label="Navigation"
aria-expanded + aria-controls on toggle button
When open: focus moves inside. Closes on Escape. Locks body scroll.
When closed: focus returns to toggle button.
```

---

## Checklist (run before marking any page done)

**Keyboard**
- [ ] Full flow completable with keyboard alone?
- [ ] Focus always visible in keyboard mode (`:focus-visible`)?
- [ ] Focus never appears during pointer/touch?
- [ ] A focused element is never hidden under the sticky navbar?
- [ ] Modal traps focus + returns on close?

**Semantics**
- [ ] One `<main>` per page?
- [ ] One `<h1>`? No skipped levels?
- [ ] Every landmark labelled?
- [ ] Decorative elements `aria-hidden="true"`?
- [ ] Skip link first in DOM?
- [ ] `<html lang="...">` set, and updated on language change?
- [ ] Page change moves focus to `<main>` and announces the title?

**Contrast** — check in EVERY theme (light and dark)
- [ ] Text 4.5:1 (3:1 for large text, 24px+ or 18.7px+ bold)?
- [ ] Icons, input borders, focus ring and other UI parts 3:1 against what is next to them?
- [ ] Nothing communicated by colour alone (errors also have text or an icon)?

**Touch**
- [ ] Targets 44×44px on touch devices (`pointer: coarse`), whatever the width?

**Forms**
- [ ] Every field has `<label htmlFor>`?
- [ ] Errors linked via `aria-describedby`?
- [ ] Submit feedback via `announce()`?

**Motion**
- [ ] `prefers-reduced-motion` respected?
- [ ] App toggle works and persists?
