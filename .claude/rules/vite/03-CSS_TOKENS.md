---
paths:
  - "src/**"
  - "vite.config.*"
  - "index.html"
---

# CSS_TOKENS.md — Styling Rules (Vite + React)

---

## Rule Summary — READ THIS FIRST

### `style={{}}` IS BANNED. COMPLETELY. ZERO EXCEPTIONS.

**Why this one is absolute:** GSAP animates via inline styles. Anything you hand-write in
`style={{}}` occupies the same slot GSAP needs, so the two silently fight — and the loser is
usually your layout, at a random frame. Two failures in this codebase came from exactly that
(a `clearProps` wiping inline layout styles an element relied on, and the `/build-navbar` skill
on transforms breaking `position: fixed`). A Tailwind class lands in a stylesheet instead, where
GSAP's inline styles cleanly override it and cleanup restores it. This is a correctness rule
wearing a style rule's clothes.


Every visual property must be a **Tailwind utility class**.

### 🚫 An arbitrary value is a LAST RESORT — never when a token exists

Before writing any `[value]`, check `src/styles/theme.css` and `src/styles/base.css` for a token or
semantic class that already covers it. If one exists, using an arbitrary value instead is a
**violation**, not a shortcut: it forks the design system, and the next change to the token
silently misses your hardcoded copy.

```
❌ text-[1.25rem]        → ✅ text-subheading      (semantic class exists)
❌ text-[#c9a227]        → ✅ text-primary         (token exists)
❌ p-[1rem]              → ✅ p-4                  (in the scale)
❌ rounded-[8px]         → ✅ rounded-md           (token exists)
❌ z-[50]                → ✅ z-drawer             (named class exists)
❌ gap-[0.5rem]          → ✅ gap-2                (in the scale)

✅ pt-[clamp(6rem,14vh,8rem)]        no token for this — legitimate
✅ max-w-[52ch]                       no token for this — legitimate
✅ [grid-template-columns:1fr_240px]  no named utility exists — legitimate
```

The order is always: **semantic class → design token → Tailwind scale → arbitrary value.**
Only reach the last step when the first three genuinely have nothing.

Tailwind v4 with arbitrary properties (`[property:value]`) can express every CSS property —
there is no fallback file, no edge case, no exception.

```
✅ className="pt-[clamp(6rem,14vh,8rem)]"
✅ className="relative overflow-hidden h-screen text-paper"
✅ className="absolute inset-0 pointer-events-none z-[2]"
✅ className="[grid-template-columns:1fr_240px]"
✅ className="bg-brand-gradient"   ← @utility in base.css, never var() in JSX
✅ className="invisible"   ← GSAP pre-animation hiding uses Tailwind, never inline style
❌ style={{ paddingTop: "clamp(6rem,14vh,8rem)" }}
❌ style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
❌ style={{ color: "var(--color-paper)" }}
❌ style={{ position: "relative" }}
❌ style={{ overflow: "hidden" }}
❌ style={{ objectFit: "cover" }}
❌ style={{ visibility: "hidden" }}
```

**`components.css` does not exist. There is no fallback CSS file. Tailwind or nothing.**

**Semantic token rule for JSX:** raw CSS variables are for CSS files, not component class strings.

```tsx
// ✅ JSX uses semantic Tailwind tokens or semantic text classes
className="text-primary font-sans bg-surface"
className="text-body text-ink"

// ❌ NEVER in JSX
className="text-(--color-primary)"
className="font-(--font-sans)"
className="bg-(--color-surface)"
```

Use `var(--color-*)` and `var(--font-*)` only inside `src/styles/theme.css`, `src/styles/base.css`, and other CSS files that define the design system.

If a pattern is repeated 3+ times, extract a React component — not a CSS class.

### Other rules

- ALL visual tokens live in `src/styles/theme.css`, each defined once (see below).
- No hardcoded hex, px, font names anywhere except `src/styles/theme.css`.
- All text styling uses semantic classes from `src/styles/base.css` only.
- Tailwind typography utilities (`text-xl`, `font-bold`, etc.) are BANNED in components.
- `sm:` prefix is BANNED everywhere.
- Arbitrary z-index (`z-[200]`) is BANNED — use named classes from `base.css`.
- **`--text-xs` / `text-kicker` / `text-caption` do not exist and must not be added.** The smallest
  size is `--text-sm`, used only by `.text-body-sm` and `.text-label`. Running text is `.text-body`.
  No exceptions anywhere in any component.

---

## src/styles/theme.css — Required Structure

**Every token is defined ONCE.** Tokens that need a Tailwind utility (colours, font families,
radii, shadows) go in `@theme`; Tailwind v4 emits each one as a CSS variable on its own, so a
second `:root` copy is never needed. Never write `--color-bg: var(--color-bg)` — a variable
pointing at itself is a cycle that only "works" because `@theme` sits in a lower cascade layer.

Tokens that must NOT generate utilities (the type scale, weights, leading, tracking, easing,
z-index) go in a plain `:root` block. Putting `--text-*` in `@theme` would create `text-base`,
`text-xl`… — exactly the utilities banned in components.

```css
/* 1. Tokens WITH a Tailwind utility — bg-surface, text-primary, rounded-md, shadow-lg, font-sans */
@theme {
  /* Colors — replace with project brand (light theme = default) */
  --color-bg:           #fafaf9;
  --color-surface:      #ffffff;
  --color-surface-2:    #f4f4f2;
  --color-border:       #e4e4e0;
  --color-text:         #1c1c1a;
  --color-text-muted:   #57574f;
  --color-text-subtle:  #6f6f66;
  --color-primary:      #5b4ae0;
  --color-primary-hover:#4c3cc9;
  --color-on-primary:   #ffffff;   /* text/icons ON a primary background */
  --color-secondary:    #1f9d55;
  --color-danger:       #c62828;
  --color-warning:      #b26a00;
  --color-info:         #1565c0;
  --color-success:      #1f9d55;

  --font-sans: "Inter Variable", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  --radius-sm: 4px; --radius-md: 8px; --radius-lg: 12px; --radius-xl: 16px; --radius-full: 9999px;

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.10);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.14);
}

/* 2. Tokens WITHOUT a utility — read only by base.css / animations.css */
:root {
  /* Type scale — body never below 1rem (16px) on any screen */
  --text-sm:      clamp(0.875rem, 0.85rem + 0.1vw,  0.9375rem);
  --text-base:    clamp(1rem,     0.95rem + 0.2vw,  1.125rem);
  --text-md:      clamp(1.0625rem,1rem + 0.4vw,     1.25rem);
  --text-lg:      clamp(1.125rem, 1rem + 0.8vw,     1.375rem);
  --text-xl:      clamp(1.25rem,  1rem + 1.2vw,     1.625rem);
  --text-2xl:     clamp(1.5rem,   1.1rem + 2vw,     2.25rem);
  --text-3xl:     clamp(1.875rem, 1.2rem + 3vw,     2.75rem);
  --text-4xl:     clamp(2.25rem,  1.3rem + 4.5vw,   3.75rem);
  --text-display: clamp(3rem,     1.5rem + 7vw,     6rem);
  --font-weight-regular: 400; --font-weight-medium: 500;
  --font-weight-semibold: 600; --font-weight-bold: 700; --font-weight-black: 900;
  --leading-tight: 1.15; --leading-snug: 1.35; --leading-normal: 1.6; --leading-loose: 1.8;
  --tracking-tight: -0.03em; --tracking-normal: 0em; --tracking-wide: 0.05em; --tracking-widest: 0.15em;

  /* Easing */
  --ease-out:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:    cubic-bezier(0.7, 0, 0.84, 0);
  --ease-inout: cubic-bezier(0.87, 0, 0.13, 1);
  --duration-fast: 150ms; --duration-normal: 300ms; --duration-slow: 500ms;

  /* Layout — the navbar reads it for its height, accessibility.css for scroll-padding-top */
  --navbar-height: 4rem;

  /* Z-index */
  --z-drawer-backdrop: 40; --z-drawer: 50; --z-dropdown: 60;
  --z-modal: 70; --z-picker: 75; --z-overlay: 80; --z-toast: 90;
}
```

Replace all color values with the project's brand system before writing components.
Spacing comes from Tailwind's own scale (`p-4`, `gap-6`); do not redefine it.

---

## Dark mode — tokens only, never `dark:` in components

Dark mode is a second set of colour values, nothing else. Components never change: `bg-surface`
is correct in both themes because `--color-surface` changes underneath it.

```css
/* src/styles/theme.css — after the @theme block */
:root[data-theme="dark"] {
  --color-bg: #0f0f0e; --color-surface: #1a1a18; --color-surface-2: #232320;
  --color-border: #33332f; --color-text: #ecece8; --color-text-muted: #a8a89f;
  --color-text-subtle: #8a8a80; --color-primary: #8b7cf7; --color-primary-hover: #9d90f8;
  --color-on-primary: #0f0f0e;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.4); --shadow-md: 0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.6);
  color-scheme: dark;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* same values as above */ color-scheme: dark; }
}
```

- Follows the system by default; `data-theme="light" | "dark"` on `<html>` is the user's
  override, persisted in `localStorage` and read with `useSyncExternalStore` (05-ANIMATIONS.md).
- ❌ `dark:bg-black` in a component — banned. A theme is a token change, not a class change.
- Check contrast in BOTH themes (4.5:1 body text, 3:1 large text and UI). A project with only
  one theme deletes this section and says so in MEMORY.md.

---

## src/styles/base.css — Semantic Text Classes (required)

```css
/* Do NOT include box-sizing/margin/padding resets — Tailwind Preflight handles them */
/* Do NOT set `scroll-behavior: smooth` on html — it fights Lenis and makes the
   "immediate" scrollToTop() animate. Lenis owns smooth scrolling. */

html { background: var(--color-bg); color: var(--color-text); }
::selection { background: var(--color-primary); color: var(--color-on-primary); }
button, [role="button"], [type="button"], [type="submit"], [type="reset"] { cursor: pointer; }
input, textarea, select { font-size: 1rem; } /* iOS zoom prevention */

/* Named z-index — no arbitrary values anywhere */
.z-drawer-backdrop { z-index: var(--z-drawer-backdrop); }
.z-drawer          { z-index: var(--z-drawer); }
.z-dropdown        { z-index: var(--z-dropdown); }
.z-modal           { z-index: var(--z-modal); }
.z-picker          { z-index: var(--z-picker); }
.z-overlay         { z-index: var(--z-overlay); }
.z-toast           { z-index: var(--z-toast); }

/* Repeated multi-value backgrounds become a named utility, never a raw var() in JSX */
@utility bg-brand-gradient {
  background: linear-gradient(to right, var(--color-primary), var(--color-secondary));
}

/* Semantic text — ONLY these classes for text styling in components */
.text-display    { font-size: var(--text-display); font-weight: var(--font-weight-black);   line-height: var(--leading-tight);  letter-spacing: var(--tracking-tight); }
.text-title      { font-size: var(--text-4xl);     font-weight: var(--font-weight-bold);    line-height: var(--leading-tight); }
.text-heading    { font-size: var(--text-2xl);     font-weight: var(--font-weight-bold);    line-height: var(--leading-snug); }
.text-subheading { font-size: var(--text-xl);      font-weight: var(--font-weight-semibold);line-height: var(--leading-snug); }
.text-body       { font-size: var(--text-base);    font-weight: var(--font-weight-regular); line-height: var(--leading-normal); color: var(--color-text); }
.text-body-sm    { font-size: var(--text-sm);      font-weight: var(--font-weight-regular); line-height: var(--leading-normal); color: var(--color-text-muted); }
.text-label      { font-size: var(--text-sm);      font-weight: var(--font-weight-semibold);letter-spacing: var(--tracking-widest); text-transform: uppercase; }
```

---

## Tailwind usage in components — quick reference

```
✅ bg-surface, text-primary, border-border, rounded-md, shadow-lg, font-sans
✅ className="text-heading" (semantic class from base.css)
❌ style={{ color: "var(--color-accent)" }}   → use className="text-accent"
❌ text-(--color-primary), font-(--font-sans) → use semantic tokens
❌ text-xl, font-bold, text-gray-500          → use semantic class
❌ dark:bg-black                              → dark mode is a token change
❌ sm:anything                                → banned prefix
❌ z-[200]                                    → use .z-modal etc.
❌ w-[340px]                                  → use CSS variable or standard scale
```

---

## Fonts — self-hosted, required pattern

Fonts ship with the app, never from Google's servers at runtime (privacy, offline, no layout
shift from a late font). Two options, in order of preference:

```bash
npm install @fontsource-variable/inter
```

```tsx
// src/main.tsx — once, before globals.css
import "@fontsource-variable/inter"
import "@/globals.css"
```

```css
/* src/styles/theme.css — the family name is the only place it is written */
--font-sans: "Inter Variable", system-ui, sans-serif;
```

No Fontsource package? Put the `.woff2` in `public/assets/fonts/`, declare it with
`@font-face { font-display: swap; … }` in `src/styles/theme.css`, and preload the main weight
in `index.html`:

```html
<link rel="preload" href="/assets/fonts/brand.woff2" as="font" type="font/woff2" crossorigin />
```

Never `@import` Google Fonts in CSS, never a `<link>` to fonts.googleapis.com.

---

## Installed 3D skills — two upstream examples violate this rule

`react-three-fiber` and `lightweight-3d-effects` (in `~/.claude/skills/`) each contain one
`style={{ }}` example — `<div style={{ height: '100vh' }}>` for a scroll/canvas wrapper.
Those are upstream vendored files, deliberately left unedited.

**This rule still wins.** Write `className="h-screen"` / `className="h-screen w-full"` instead.
`.claude/hooks/check-rules.sh` blocks it at write time regardless, so following the skill
verbatim will fail the hook — that is the hook working, not a false positive.
