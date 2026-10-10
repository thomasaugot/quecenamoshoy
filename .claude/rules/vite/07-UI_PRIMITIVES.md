---
paths:
  - "src/**"
  - "vite.config.*"
  - "index.html"
---

# UI_PRIMITIVES.md — Custom UI Components (Vite + React)

All UI primitives live in `src/components/ui/`. No native `<select>`, `<input type="checkbox">`,
`<input type="date">`, or bare `<button>` outside these primitives. Ever.

**Why:** the native versions cannot be styled consistently across browsers, and — more
importantly — each custom primitive here carries an accessibility contract (focus ring, ARIA
roles, keyboard handling, portal escape from `overflow:hidden`) that is easy to forget and
invisible when missing. Centralising them means the contract is written once and cannot be
half-implemented at a call site. `<select>` in particular cannot render its options outside a
clipping ancestor, which is why `Dropdown` portals them.

**Custom look, native behaviour wherever the platform has it.** Where a native element can be
styled or its behaviour reused (`<dialog>`, a visually hidden `<input type="checkbox">`),
build on it — never re-implement focus traps or key handling by hand.

---

## Button.tsx

```ts
type ButtonVariant = "filled" | "outlined"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant   // default: "filled"
  size?: ButtonSize         // default: "md"
  loading?: boolean
  icon?: React.ReactNode
}
// Styling via CSS classes only. No hardcoded values. No inline styles.
// className="keyboard-focus-ring" always present.
// type defaults to "button" — a native <button> is "submit" by default, so any Button inside
//   a <form> would submit it. Pass type="submit" explicitly on the one that should.
// loading: disabled + aria-busy="true", keeps its width (no layout jump), label stays for SR.
```

## Input.tsx

```ts
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string      // required — placeholder is NOT a label
  error?: string
  hint?: string
}
// <label htmlFor={id}>{label}</label>
// <input id={id} aria-invalid={!!error}
//   aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
//   className="keyboard-focus-ring" />
// {error && <p id={`${id}-error`} role="alert">{error}</p>}
// font-size: var(--text-base) — min 1rem — prevents iOS zoom
```

## Modal.tsx — native `<dialog>`

```ts
interface ModalProps {
  isOpen: boolean; onClose: () => void; title: string
  children: React.ReactNode; size?: "sm" | "md" | "lg" | "full"
}
// <dialog ref aria-labelledby={titleId}> driven by isOpen:
//   isOpen → dialog.showModal()   !isOpen → dialog.close()
// The browser gives, for free: focus moved inside + trapped, Escape closes ("cancel" event →
//   onClose), focus returned to the trigger, the rest of the page made inert, and the TOP
//   LAYER — it renders above everything, so no portal, no z-index, no transformed-parent bug.
// Backdrop click: onClick on the <dialog> itself when event.target === dialog → onClose.
// Backdrop style: dialog::backdrop with tokens (base.css), never a separate overlay div.
// Page scroll: <dialog> does NOT lock it — stop Lenis + overflow hidden via ScrollContext
//   while open; the dialog body gets data-lenis-prevent (05-ANIMATIONS.md).
// className="keyboard-focus-ring" on all interactive elements.
// Never role="dialog" on a div with a hand-written focus trap.
```

## Dropdown.tsx

```
// Custom select — never native <select>
// Options via createPortal — avoids overflow/clip
// z-dropdown (var(--z-dropdown))
// Keyboard (ARIA select-only combobox): ArrowUp/Down navigate, Home/End first/last,
//   Enter/Space select, Escape close, Tab selects and moves on,
//   type-ahead — typing letters jumps to the first option starting with them
// role="combobox" aria-expanded aria-controls aria-activedescendant; list role="listbox",
//   options role="option" aria-selected
// className="keyboard-focus-ring" on trigger
```

## Checkbox.tsx

```tsx
// Custom LOOK, native BEHAVIOUR: a real <input type="checkbox">, visually hidden, with the
// designed box drawn next to it. Never a <div role="checkbox"> with hand-written keys.
<label htmlFor={id} className="…">
  <input id={id} name={name} type="checkbox" className="peer sr-only" … />
  <span aria-hidden="true" className="… peer-checked:bg-primary peer-focus-visible:outline …" />
  {label}
</label>
// Free: Space toggles, label click toggles, form submission, autofill, indeterminate,
//   screen-reader state. The ban is on the VISIBLE native checkbox, not the element.
```

## CalendarPicker.tsx

```
// Custom — never native <input type="date">
// Calendar grid in Portal. z-picker (var(--z-picker)).
// Keyboard: ArrowKeys navigate, Enter select, Escape close
// Props: value, onChange, min?, max?, disabled?
// Value format: ISO 8601 (YYYY-MM-DD)
// role="dialog" aria-label="Date picker"
// className="keyboard-focus-ring" on all interactive cells
```

## Icons.tsx

```tsx
import { FiMenu, FiX, FiArrowRight, FiCheck, FiAlertCircle } from "react-icons/fi"
import type { IconBaseProps } from "react-icons"
type IconProps = IconBaseProps
export const IconMenu  = (p: IconProps) => <FiMenu        aria-hidden="true" {...p} />
export const IconClose = (p: IconProps) => <FiX           aria-hidden="true" {...p} />
export const IconArrow = (p: IconProps) => <FiArrowRight  aria-hidden="true" {...p} />
export const IconCheck = (p: IconProps) => <FiCheck       aria-hidden="true" {...p} />
export const IconAlert = (p: IconProps) => <FiAlertCircle aria-hidden="true" {...p} />
// Add ALL project icons here. aria-hidden="true" always.
// Swapping icon library = one-file change.
```

## SkipLink.tsx

```tsx
// First focusable element in DOM — before Navbar, before everything.
export function SkipLink({ targetId }: { targetId: string }) {
  // Smooth scroll + focus on click
  return (
    <a href={`#${targetId}`} onClick={handleClick}
       className="sr-only focus:not-sr-only fixed top-4 left-4 keyboard-focus-ring">
      {t("skipToContent")}   {/* common translations — never hardcoded English */}
    </a>
  )
}
// Usage in every layout:
// <SkipLink targetId="main-content" />
// <Navbar />
// <main id="main-content">...</main>
```

## LiveRegion.tsx

```tsx
// Singleton. Mounted once in Providers.tsx.
export function LiveRegion() {
  return (
    <>
      <div role="status" aria-live="polite"    aria-atomic="true" className="sr-only" id="live-polite" />
      <div role="alert"  aria-live="assertive" aria-atomic="true" className="sr-only" id="live-assertive" />
    </>
  )
}
export function announce(message: string, politeness: "polite" | "assertive" = "polite") {
  const el = document.getElementById(politeness === "assertive" ? "live-assertive" : "live-polite")
  if (!el) return
  el.textContent = ""
  requestAnimationFrame(() => { el.textContent = message })
}
```

## Toaster.tsx

```
// React Portal to document.body. z-toast (var(--z-toast)). Fixed top-center.
// The container is popover="manual" and shown with showPopover(): an open <dialog> sits in
//   the top layer, above ANY z-index — a toast in plain body would render behind the modal.
//   Re-call showPopover() after a dialog opens so the toaster is the newest top-layer entry.
// Mounted ONCE in Providers.tsx. Never in a page, modal, or form.
// Must never be trapped inside a transformed parent.
// Animates in from top with fade/slide.
// Each toast calls announce() from LiveRegion.
// showToast(message, type?: "success" | "error" | "warning" | "info")
// Every database write (create/update/delete/resolve/status change) triggers a toast.
// ❌ No local success banners. ❌ No page-specific toast systems.
```

### Three rules learned the hard way

**1. Duration scales with the type. Never one flat timeout.**
An error has to be READ before it can be acted on, and it often lands mid-navigation.
A success only confirms something the user already did.

```ts
const DURATION: Record<ToastType, number> = {
  success: 4000, info: 5000, warning: 7000, error: 9000,
}
setTimeout(() => dismiss(toast.id), DURATION[toast.type])
```

**2. The Toaster renders NOTHING until `loaderGone`.**
`PageLoader` covers the whole viewport, so a toast raised during boot or during a
redirect burns its entire lifetime unseen and the user never learns why something
failed. Gate the whole portal — each toast's dismiss timer starts when it MOUNTS,
so the message keeps its full time on screen once the loader lifts.

```tsx
const loaderGone = useLoaderGone()
if (!loaderGone) return null
```

⚠️ This only works while `<PageLoader />` is mounted in `Providers.tsx`. If it is
not, `loaderGone` stays false forever and NO toast ever appears (see 05-ANIMATIONS.md).

**3. Dedupe identical toasts in the STORE, not at the call site.**
React StrictMode double-invokes effects in dev, and a navigation can re-run the code
that raised the toast, so the same message appeared twice. An id built from
`Date.now()` does not save you: two pushes in the same millisecond both land.

```ts
push: (message, type) =>
  set((state) => {
    if (state.toasts.some((t) => t.message === message && t.type === type)) return state
    return { toasts: [...state.toasts, { id: …, message, type }] }
  }),
```

**Icon sizing:** the toast icon needs `shrink-0` AND an explicit size. A long message
squashes a bare `<Icon />` flat.

```tsx
<Icon className="h-[1.15rem] w-[1.15rem] shrink-0" />
```

## PageLoader.tsx

Full pattern lives in the `/build-page-loader` skill.

```
// Full-screen overlay. Visible while appReady is false.
// Animates out (GSAP, opacity + scale) when appReady becomes true.
// Unmounts itself after exit animation completes.
// Placed in Providers.tsx as sibling of PageShell. Never inside a page.
// role="status" aria-label="Loading" while visible.
// Does not steal focus when it exits.
// Calls announce("Page ready", "polite") when exit completes.
// For INITIAL load only. Subsequent navigations are a content crossfade
// handled by enterPage/exitPage in PageShell — there is no overlay.
```
