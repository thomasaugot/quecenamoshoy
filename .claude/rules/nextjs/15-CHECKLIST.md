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

# CHECKLIST.md — Per-File Enforcement

## The mechanical checks are automated — do not re-run them by hand

`.claude/hooks/check-rules.sh` runs automatically after every Edit/Write and **blocks** on the
greppable violations: `style={{}}`, `sm:`, arbitrary `z-[]`, raw CSS-var utilities, Tailwind
text-size and palette utilities, hardcoded hex, `console.*`, `: any`, relative `../` imports,
direct `gsap`/`lenis`/`react-icons`/`next/link` imports, `router.push`, `window.scrollTo`,
positive `tabIndex`, `<div onClick>`, `clearProps:"all"`, impure `useRef(Date.now())`,
misplaced `"use client"`, and the banned files (`middleware.ts`, `tailwind.config.*`,
`*.module.css`, `styles/components.css`, `app/globals.css`).

If the hook is silent, those are all clean. **Spend your attention on the judgement calls below
instead** — the ones no grep can make.

## The two gates that actually matter

```bash
npx tsc --noEmit   # zero errors
npm run lint       # zero problems
```

`tsc` does NOT catch impure renders, cascading `setState`, or unused context state — lint does.
Run both before calling a file done.

---

## Judgement calls — these need a human read

Every answer must be NO. Fix before moving on.

---

## A. Structure

- [ ] More than one component exported from this file? → Split.
- [ ] Component defined inside another component or function? → Extract.
- [ ] Page `app/*/page.tsx` contains hooks/refs/browser APIs? → Extract to `*Client.tsx`.
- [ ] File in `components/pages/[page]/` not named `[Page][Section].tsx` or `[Page]Client.tsx`? → Rename.
- [ ] File in `utils/animations/` named after a page or section (e.g. `home-hero.ts`, `about-hero.ts`)? → Rename to describe the behavior: `verb-ticker.ts`, `image-reveal-drag.ts`, `scroll-reveal.ts`.
- [ ] Modal not built on `<dialog>` + `showModal()`? → Rebuild it on `<Modal>`. No hand-written focus trap, no portal (07-UI_PRIMITIVES.md).
- [ ] Form and its modal in the same file? → Split them.
- [ ] `middleware.ts` exists? → Delete. Use `proxy.ts` at project root.
- [ ] `tailwind.config.ts` exists? → Delete. Tailwind v4 is CSS-only.
- [ ] `*.module.css` file exists? → Delete. No CSS modules.
- [ ] `app/globals.css` exists? → Delete. `globals.css` is at project root.

## B. Imports

- [ ] Any `../../` relative import? → Replace with `@/`.
- [ ] Direct import from `gsap` or `gsap/ScrollTrigger`? → Use `@/lib/gsap`.
- [ ] Direct import from `lenis`? → Use `@/lib/lenis`.
- [ ] Direct import from `react-icons/*`? → Use `@/components/ui/Icons`.
- [ ] Using `next/link` directly in app code? → Use `TransitionLink`.
- [ ] Reading `process.env.*` outside `config/app.config.ts`? → Move to config.
- [ ] Importing from headless-ui, shadcn, radix, or any third-party component lib? → Remove.
- [ ] Importing `globals.css` anywhere other than `app/layout.tsx`? → Remove.

## C. "use client"

- [ ] Has `"use client"` but uses no hooks, browser APIs, GSAP, Lenis, context, or react-hook-form? → Remove directive.
- [ ] `"use client"` is not the very first line? → Move to line 1.
- [ ] File in `contexts/` or `hooks/` or `lib/` or `utils/animations/` without `"use client"`? → Add it.
- [ ] `utils/logger.ts` has `"use client"`? → Remove.
- [ ] `app/layout.tsx` or `app/*/page.tsx` has `"use client"`? → Remove. Extract client logic.
- [ ] Executable inline `<script dangerouslySetInnerHTML={{__html: "...runnable JS..."}}>` (or with JS children) in any RSC/layout/page? → Remove. Next 15+/16 never runs it on the client and React warns at runtime. Move the logic to a `useEffect` in a client context, or use `next/script strategy="beforeInteractive"`. (A `<script type="application/ld+json">` data block is exempt.)

## D. CSS & Tokens — INLINE STYLES ARE BANNED

**`style={{}}` props are COMPLETELY FORBIDDEN in JSX. No exceptions.**

One option only: **Tailwind utility class**. Use arbitrary values `[value]` for anything not in the scale (e.g. `pt-[clamp(6rem,14vh,8rem)]`, `max-w-[52ch]`). Use arbitrary properties `[property:value]` for any CSS property Tailwind doesn't have a named utility for (e.g. `[grid-template-columns:1fr_240px]`). There is no fallback CSS file.

FOR TEXT, COLORS, AND FONTS IN JSX, I ONLY WANT TO SEE THE SEMANTIC TAILWIND TOKENS WE CREATED. I NEVER EVER WANT TO READ A HEX COLOR, A FONT NAME, OR RAW CSS-VARIABLE TAILWIND LIKE `text-(--color-primary)` OR `font-(--font-sans)`.

Use `var(--color-*)` and `var(--font-*)` only inside CSS files such as `styles/theme.css` and `styles/base.css`.

In JSX, always write semantic utilities like:
- `text-primary`
- `text-ink`
- `text-text-on-dark`
- `font-sans`
- `font-mono`
- `text-body`
- `text-title`

Never write raw CSS-variable utilities in JSX:
- `text-(--color-primary)` ❌
- `font-(--font-sans)` ❌
- `bg-(--color-surface)` ❌

**Never write `style={{ anything }}`.**

- [ ] Any `style={{}}` prop in JSX? → Move to Tailwind arbitrary class. No exceptions.
- [ ] `position: "relative/absolute/fixed"` inline? → `relative` / `absolute` / `fixed`
- [ ] `overflow: "hidden"` inline? → `overflow-hidden`
- [ ] `display: "flex/grid"` inline? → `flex` / `grid`
- [ ] `objectFit: "cover"` inline? → `object-cover`
- [ ] `inset: 0` inline? → `inset-0`
- [ ] `width/height: "100%"` inline? → `w-full` / `h-full`
- [ ] `height: "100vh"` inline? → `h-screen`
- [ ] `opacity` inline? → `opacity-80` etc.
- [ ] `color: "var(--color-*)"` inline? → `text-primary`, `text-paper`, `text-ink` etc.
- [ ] `clamp()` value inline? → `pt-[clamp(6rem,14vh,8rem)]` arbitrary Tailwind value
- [ ] `alignItems/justifyContent/flexDirection` inline? → `items-*` / `justify-*` / `flex-col`
- [ ] Any CSS property not covered by a named Tailwind utility? → Use `[property:value]` arbitrary syntax.
- [ ] Hardcoded hex color anywhere? → Replace with CSS variable in CSS files or semantic Tailwind token in JSX.
- [ ] Hardcoded font name in class or CSS rule? → Use `var(--font-*)` in CSS files or `font-sans` / `font-mono` in JSX.
- [ ] Any Tailwind typography utility in JSX? (`text-xl`, `font-bold`, `text-gray-*`) → Use semantic class from `base.css`.
- [ ] `sm:` prefix anywhere? → Remove. Banned permanently.
- [ ] Arbitrary z-index? (`z-[10]`) → Use named class from `base.css`.
- [ ] `styles/theme.css` missing the `@theme {}` block? → Add it.
- [ ] `styles/components.css` exists? → Delete it. It has no purpose.
- [ ] A token defined twice, or `--x: var(--x)` in `theme.css`? → Define it once (03-CSS_TOKENS.md).
- [ ] `dark:` prefix in a component? → Remove. Dark mode is a token override in `theme.css`.
- [ ] `text-caption`, `--text-xs`, or any size below `--text-sm`? → Use `.text-body-sm` / `.text-label`.
- [ ] `scroll-behavior: smooth` on `html`, or `overscroll-behavior` on `body`? → Remove (03, 08).

## E. UI Primitives

- [ ] Native `<select>`? → Use `<Dropdown>`.
- [ ] Visible native `<input type="checkbox">`, or a `<div role="checkbox">`? → Use `<Checkbox>` (hidden native input + drawn box).
- [ ] `<input type="date">`? → Use `<CalendarPicker>`.
- [ ] Bare `<button>` outside `components/ui/Button.tsx`? → Use `<Button>`.
- [ ] `<div>` or `<span>` with `onClick`? → Use `<button>` or `<a>`.
- [ ] Submit button in a form without `type="submit"`? → Add it. `<Button>` defaults to `type="button"`.
- [ ] Local success/error banner instead of `showToast()`? → Remove. Use `showToast()`.
- [ ] Database write without `showToast()`? → Add toast for every mutation.
- [ ] Toaster renders without gating on `loaderGone`? → Gate it. A toast raised under the full-screen loader burns its lifetime unseen. (07-UI_PRIMITIVES.md)
- [ ] Toast auto-dismiss is one flat timeout for every type? → Scale it: success 4s, info 5s, warning 7s, error 9s.
- [ ] Identical toasts can stack (no dedupe in the store)? → Dedupe on message+type in the store. StrictMode double-invokes effects and a `Date.now()` id does not prevent it.
- [ ] Icon inside a flex row without `shrink-0` and an explicit size? → Add both. Long text squashes it flat.

## F. Navigation & Transitions

- [ ] `router.push()` for internal navigation? → Use `navigateTo()`.
- [ ] Consumer side-effect runs before `navigateTo()` resolves? → Run it after.
- [ ] `enterPage()` called outside `PageShell.tsx`? → Remove.
- [ ] Navigation effect depends only on mount, not `usePathname()`? → Key effect on `pathname`.
- [ ] `Navbar` or `Footer` inside the animated container? → Move outside as siblings of PageShell.
- [ ] `TransitionOverlay` reintroduced anywhere? → Remove. It was deleted (06-TRANSITIONS.md); the transition is a content crossfade with no overlay.
- [ ] `enterPage`/`exitPage` given a second `overlay` argument? → Remove it. They take the page element only.
- [ ] `TransitionContext.navigateTo` calls `router.push()` without global GSAP teardown first? → Add teardown.
- [ ] `TransitionContext.navigateTo` calls `window.scrollTo(0,0)`? → Remove. Belongs in PageShell.
- [ ] `TransitionLink` missing same-page guard? → Add: if same page, scrollTo top, return.
- [ ] Animation init not wrapped in `gsap.context()` / `gsap.matchMedia()` returning `revert()`? → Wrap it. No hand-kept trigger arrays (05-ANIMATIONS.md).
- [ ] `PageShell` missing `ScrollTrigger.refresh()` after `enterPage` resolves? → Add it.

## G. Accessibility

- [ ] Icon without `aria-hidden="true"`? → Add it.
- [ ] Icon-only button/link without `aria-label`? → Add it.
- [ ] Any interactive element without `className="keyboard-focus-ring"`? → Add it.
- [ ] `<label>` without matching `htmlFor`? → Add it.
- [ ] Placeholder used instead of visible label? → Add real `<label>`.
- [ ] Input/textarea without `id` and `name`? → Add both.
- [ ] Error input without `aria-invalid` + `aria-describedby`? → Add both.
- [ ] Error message without `role="alert"`? → Add it.
- [ ] Form submission without `announce()` call? → Add announce on every outcome.
- [ ] Toggle button without `aria-pressed`? → Add it.
- [ ] Nav link without `aria-current={isActive ? "page" : undefined}`? → Add it.
- [ ] `tabIndex` greater than 0? → Remove. Only 0 and -1 allowed.
- [ ] `<nav>`, `<header>`, `<aside>`, `<section>` without `aria-label`/`aria-labelledby`? → Add one.
- [ ] More than one `<main>` per page? → Fix.
- [ ] More than one `<h1>` per page? → Fix.
- [ ] Heading levels skip? → Fix hierarchy.
- [ ] Decorative element not wrapped in `aria-hidden="true"` + `pointer-events-none`? → Wrap it.
- [ ] Inactive panel using only `display:none` without `aria-hidden` + `inert`? → Add both.
- [ ] Modal not a native `<dialog>` with `aria-labelledby`? → Use `<Modal>`.
- [ ] Text below 4.5:1, or icons/borders/focus ring below 3:1, in EITHER theme? → Fix the token, not the component.
- [ ] Focused element can end up hidden under the sticky navbar? → `scroll-padding-top: var(--navbar-height)` (08).
- [ ] `<input type="email">` without `inputMode="email"`? Or tel/numeric equivalent? → Add it.
- [ ] Form input without `autoComplete`? → Add appropriate value.
- [ ] `SkipLink` not first in DOM order? → Move before Navbar.
- [ ] `<html>` without `lang` attribute? → Add it.

## H. Animations & App Ready

- [ ] GSAP animation without checking `useAppReady()` first? → Gate it.
- [ ] **Any `data-anim` element that GSAP fades/slides/scales in missing `invisible` in its JSX (never `opacity-0`)? → Add it. This is the #1 repeated flicker bug — see the audit snippet in 05-ANIMATIONS.md.**
- [ ] Animation reveals it with `opacity` instead of `autoAlpha`? → Use `autoAlpha`; plain `opacity` leaves `visibility:hidden` and the element never appears.
- [ ] Reduced-motion branch forgets to reveal the hidden element? → Add `gsap.set(el, { autoAlpha: 1 })`.
- [ ] `markReady()` called synchronously? → Wrap in `useEffect`.
- [ ] `markReady()` called without `document.fonts.ready`? → Use `usePageReady()` or include in `Promise.all`.
- [ ] `markReady()` called without 600ms minimum delay? → Add the delay to `Promise.all`.
- [ ] `catch` block doesn't call `markReady()`? → Add it. Loader must never hang.
- [ ] `clearProps: "all"` used on a `next/image fill` element? → Name the properties instead. It wipes the inline `position/inset` that `fill` injects and collapses the image on re-run.
- [ ] Entrance animation effect keyed ONLY on `appReady`/`loaderGone` without `pathname`? → Add `pathname`. Those flags are one-shot: the animation plays once per session and is dead on every return visit.
- [ ] Animation gated on `loaderGone` while `PageLoader` is NOT mounted in `Providers.tsx`? → It will never run. Mount the loader, or gate on `appReady` and comment why.
- [ ] `usePageReady()` called in a page client (Home/Proyectos/etc.)? → Remove. It's called ONCE in `PageShell`; pages must not repeat it.
- [ ] A per-page hook that re-keys on `pathname` (page-ready, scroll-reset, analytics pageview) copied into each page? → Hoist it into `PageShell`/`LocaleShell`, call once.
- [ ] Animation rebuilt on breakpoint/reduced-motion through a React dependency? → Use `gsap.matchMedia()` (05).
- [ ] `ScrollContext` initializes Lenis below 1280px? → Desktop only.
- [ ] `ScrollContext` destroys Lenis without both `lenis.destroy()` AND `gsap.ticker.remove()`? → Add both.

## I. i18n (skip if no i18n)

- [ ] Translation strings passed as props to page section components? → Remove. Sections call `useTranslations()` directly.
- [ ] `useTranslations()` with wrong namespace pattern? → Use `'[page].[section]'`.
- [ ] Translated text in a `constants/` file? → Move to locale JSON.
- [ ] Structural data (keys, hrefs, order) in a locale JSON file? → Move to constants.
- [ ] Locale folder named `messages/`? → Rename to `locales/`.
- [ ] `changeLanguage()` uses `window.history.replaceState()`? → Replace with `router.push()`. replaceState swaps the URL but does NOT re-resolve next-intl messages — language never changes.
- [ ] `changeLanguage()` navigates without first setting the `NEXT_LOCALE` cookie? → Add `document.cookie = "NEXT_LOCALE=…"` BEFORE `router.push()`. Otherwise switching to the default (unprefixed) locale silently bounces back via the middleware. (See 09-I18N.md.)
- [ ] Current locale derived by parsing `usePathname()` instead of `useLocale()`? → Use `useLocale()` — pathname parsing causes hydration mismatches.
- [ ] Physical route folder for a translated slug? → Delete. proxy.ts handles slug translation.
- [ ] `proxy.ts` response without `withLocaleHeader()`? → Wrap every response.

- [ ] Page namespace missing from `i18n/types.d.ts`? → Add it; keys are type-checked (09).
- [ ] `toLocaleDateString()`, `toFixed()` + currency, or `${count} items`? → `useFormatter()` / ICU plural (09).
- [ ] Key added in one language only? → Add it everywhere; the parity test fails otherwise.

## J. Logging

- [ ] Direct `console.*` call? → Replace with `logger.*` from `@/utils/logger`.
- [ ] Empty `catch` block or swallowed error? → Add `logger.error(error)`.

## K. Performance

- [ ] First visible `<Image>` on page missing `priority` prop? → Add it.
- [ ] Lazy-loading Navbar, PageLoader, PageShell, Providers, LiveRegion, Toaster, or markReady() components? → Remove dynamic import.
- [ ] `next/dynamic` with `ssr: false` for component that doesn't use window/document at module level? → Remove `ssr: false`.
- [ ] Hand-written `useMemo` / `useCallback` / `memo` without a comment saying why the React Compiler is not enough? → Remove it (14).
- [ ] List that can exceed ~100 rows rendered in full? → Virtualise or paginate (14).
- [ ] New dependency over ~20 KB added without looking at the bundle analysis? → Check it; `npm run size` must stay under budget.
- [ ] Asset placed directly in `public/` root (not in `public/assets/`)? → Move it.
- [ ] Email template written to only ONE of the provider's template directory and `public/assets/email/`? → Write both. They must stay identical; `diff` them. (See 10-SEO.md.)
- [ ] Email template using `<style>` blocks, flexbox, a styled `<a>` as a button, or a renamed provider placeholder? → Table layout, inline styles, `<table>` button, exact placeholder.

## L. SEO

- [ ] Manual `<head>` tags (`<title>`, `<meta>`, `<link rel="canonical">`)? → Remove. Use Metadata API.
- [ ] `metadata.metadataBase` hardcoded instead of `appConfig.siteUrl`? → Use `appConfig`.

## M. TypeScript

- [ ] Schema change (table, column, index, access policy, storage bucket) not appended to the repo's schema/migration file in the SAME change? → Add it, dated and idempotent. (11-SECURITY.md)
- [ ] New table with row-level security enabled but no policy? → Add one. RLS with no policy denies everyone, and writes fail as a generic "write-failed".
- [ ] New column added without reloading the data layer's schema cache (if it has one)? → Reload it, or the column 404s from the API until it does.

- [ ] Any `any` type? → Replace with proper type.
- [ ] Shared type defined locally instead of in `types/`? → Move it.
- [ ] Non-null assertion (`!`) without prior null check? → Add null guard.
- [ ] `npx tsc --noEmit` reports new errors? → Fix all. Zero errors required.

## N. React Purity & State (caught by lint, not by grep)

These four bit us on the first full audit. `npm run lint` finds them; a structural
grep never will — so **run lint, not just `tsc`, before calling a file done.**

- [ ] `Date.now()`, `Math.random()`, `new Date()` or any impure call **during render**?
      → Move into a `useEffect`/`useLayoutEffect` and store in a ref.
      ```tsx
      const startTime = useRef(Date.now())        // ❌ impure during render
      const startTime = useRef(0)                 // ✅
      useLayoutEffect(() => { startTime.current = Date.now() }, [])
      ```
- [ ] `setState` called **synchronously inside an effect**? → Triggers a cascading render.
      Three fixes, in order of preference:
      1. Browser value (matchMedia, localStorage, window.*)? → `useSyncExternalStore` with a
         server snapshot (05-ANIMATIONS.md). **Never** `useState(() => window…)`: it causes a
         hydration mismatch whenever the client value differs from the server fallback.
      2. Replace a mount flag with a direct check: `if (typeof document === "undefined") return null`
      3. Value derivable from props/state? → compute it during render, no state at all
      ```tsx
      // ❌ mount flag for a portal
      const [mounted, setMounted] = useState(false)
      useEffect(() => setMounted(true), [])
      if (!mounted) return null

      // ✅
      if (typeof document === "undefined") return null
      ```
- [ ] Context exposing a **state value that no consumer reads**? → Remove it. A `useState` that
      only ever feeds a ref causes a re-render of the whole subtree for nothing.
      Check every context value against its actual consumers before shipping.
- [ ] `useState` holding something a `useRef` would do? → If it never drives rendering, use a ref.

## P. CMS, Forms, Media & Monitoring

- [ ] CMS schema `preview` whose title/subtitle could be a number, boolean or object? → `prepare()` and `String()` it. Studio calls string methods on titles; a number crashes the whole field editor.
- [ ] CMS-driven page with `revalidate > 0` but no on-publish webhook configured? → `revalidate = 0` (10-SEO.md).
- [ ] Public form route without honeypot, field length caps and rate limit? → Add all three (11-SECURITY.md).
- [ ] Breakpoint-specific `<video>` rendered before the breakpoint is known (server default)? → Render none until `useBreakpoint()` resolves (10-SEO.md).
- [ ] `.svg` asset that embeds a `data:image/png`? → Convert to WebP.
- [ ] `window.location.reload()` on resize/breakpoint change? → Rebuild animations instead (05-ANIMATIONS.md).
- [ ] `ErrorBoundary` that renders nothing without reporting to Sentry? → Report (13-MONITORING.md).
- [ ] New route not added to `e2e/routes.ts`? → Add it (12-TESTING_CI.md).

## Q. Backend, data access & auth (11-SECURITY.md)

- [ ] Backend function / API route that reads the user id from the body instead of the session? → Derive it from the verified token.
- [ ] Function that spends money (AI, email, SMS) without a per-user rate limit? → Add one.
- [ ] Table without RLS enabled AND explicit policies in the same migration? → Add them.
- [ ] Policy change without the two-user RLS test passing (anonymous + other user refused)? → Write/run it on the LOCAL stack.
- [ ] Storage bucket public for private files, or without size/MIME limits set on the bucket? → Private + signed URLs + bucket limits.
- [ ] Sign-ups open on a private app, or auth redirect URLs with a wildcard? → Close / allow-list them.

## R. Tests (12-TESTING_CI.md)

- [ ] `waitForTimeout` / `sleep` in a test? → Wait for a state instead.
- [ ] Test that depends on another test's records or on order? → Create its own `TEST -` data.

## O. Code Quality

- [ ] Commented-out code added by you (not pre-existing)? → Remove.
- [ ] Comments describing what code does (not why)? → Remove.
- [ ] `TODO`/`FIXME`/`HACK` without explanation? → Resolve now or document in MEMORY.md.

---

## Final Gate

All boxes above: NO. Hook silent. `npx tsc --noEmit` and `npm run lint` both clean.
Before shipping a feature: `npm test` and `npm run test:e2e` green (12-TESTING_CI.md).
→ Move to next file.

---

## ⚠️ Before debugging ANY production-only 404 or stale content

Next caches prerendered routes in `.next`. A stale cache survives `npm run build` and will serve
old output — including 404s for routes that are now correct.

```bash
curl -s -D - -o /dev/null http://localhost:3000/<path> | head -5
# x-nextjs-cache: HIT + x-nextjs-prerender: 1  ->  stale cache, NOT a code bug
```

1. Reproduce in **dev** (`npm run dev`) — no prerendering there. A 200 in dev proves the code is fine.
2. Clear both caches: `pkill -f "next"; rm -rf .next node_modules/.cache`
3. Rebuild and retest.

Do this **before** changing routing, proxy matchers or folder structure. Chasing a cached 404
through the routing layer wastes a long time and produces changes that are then hard to unpick.
