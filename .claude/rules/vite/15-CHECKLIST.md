---
paths:
  - "src/**"
  - "vite.config.*"
  - "index.html"
---

# CHECKLIST.md — Per-File Enforcement (Vite + React)

## The mechanical checks are automated — do not re-run them by hand

`.claude/hooks/check-rules.sh` runs automatically after every Edit/Write and **blocks** on the
greppable violations: `style={{}}`, `sm:`, arbitrary `z-[]`, raw CSS-var utilities, Tailwind
text-size and palette utilities, hardcoded hex, `console.*`, `: any`, relative `../` imports,
direct `gsap`/`lenis`/`react-icons` imports, `window.scrollTo`, positive `tabIndex`,
`<div onClick>`, `clearProps:"all"`, impure `useRef(Date.now())`, and the banned files
(`tailwind.config.*`, `*.module.css`, `styles/components.css`).

If the hook is silent, those are all clean. **Spend your attention on the judgement calls below
instead** — the ones no grep can make.

## The two gates that actually matter

```bash
npx tsc -b         # zero errors — never `tsc --noEmit` here, it checks nothing
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
- [ ] Route declared anywhere but `src/app/router.tsx`? → Move it.
- [ ] File in `src/components/pages/[page]/` not named `[Page][Section].tsx` or `[Page]Page.tsx`? → Rename.
- [ ] File in `utils/animations/` named after a page or section (e.g. `home-hero.ts`, `about-hero.ts`)? → Rename to describe the behavior: `verb-ticker.ts`, `image-reveal-drag.ts`, `scroll-reveal.ts`.
- [ ] Modal not built on `<dialog>` + `showModal()`? → Rebuild it on `<Modal>`. No hand-written focus trap, no portal (07-UI_PRIMITIVES.md).
- [ ] Form and its modal in the same file? → Split them.
- [ ] `tailwind.config.ts` exists? → Delete. Tailwind v4 is CSS-only.
- [ ] `*.module.css` file exists? → Delete. No CSS modules.
- [ ] `globals.css` anywhere but `src/globals.css`? → Move it.

## B. Imports

- [ ] Any `../../` relative import? → Replace with `@/`.
- [ ] Direct import from `gsap` or `gsap/ScrollTrigger`? → Use `@/lib/gsap`.
- [ ] Direct import from `lenis`? → Use `@/lib/lenis`.
- [ ] Direct import from `react-icons/*`? → Use `@/components/ui/Icons`.
- [ ] `Link` / `NavLink` from `react-router` in app code? → Use `TransitionLink`.
- [ ] `import.meta.env` read outside `src/config/app.config.ts`? → Move to config.
- [ ] Any `process.env` in `src/`? → It does not exist in the browser bundle. Use `appConfig`.
- [ ] Importing from headless-ui, shadcn, radix, or any third-party component lib? → Remove.
- [ ] Importing `globals.css` anywhere other than `src/main.tsx`? → Remove.

## C. Browser-only code & secrets

- [ ] A `"use client"` directive? → Remove. It means nothing in Vite.
- [ ] A secret (API key, service key, token, password) anywhere in `src/` or in a `VITE_` variable? → Remove it and rotate it. Every byte of `src/` ships to the browser (11-SECURITY.md).
- [ ] `envPrefix` widened in `vite.config.ts`? → Restore `VITE_`.
- [ ] A check in `src/` that decides which record may be read or written? → The backend enforces it (access policy / function). The browser can be edited.
- [ ] `<script>` rendered from JSX? → Remove. Pre-paint code goes in `index.html` only (06-TRANSITIONS.md).
- [ ] `dangerouslySetInnerHTML` with anything but DOMPurify output? → Sanitise it. One XSS = the session token (11).

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

- [ ] `navigate()` / `useNavigate()` for internal navigation? → Use `navigateTo()`.
- [ ] `<ScrollRestoration />` mounted? → Remove. PageShell owns scroll.
- [ ] Consumer side-effect runs before `navigateTo()` resolves? → Run it after.
- [ ] `enterPage()` called outside `PageShell.tsx`? → Remove.
- [ ] Navigation effect depends only on mount, not `useLocation().pathname`? → Key effect on `pathname`.
- [ ] `Navbar` or `Footer` inside the animated container? → Move outside as siblings of PageShell.
- [ ] `TransitionOverlay` reintroduced anywhere? → Remove. It was deleted (06-TRANSITIONS.md); the transition is a content crossfade with no overlay.
- [ ] `enterPage`/`exitPage` given a second `overlay` argument? → Remove it. They take the page element only.
- [ ] `navigateTo` awaits the exit fade and `preloadRoute()` one after the other, or navigates before both resolve? → `await Promise.all([exitPage, preloadRoute])`, then teardown, then `navigate()`.
- [ ] `preloadRoute` awaits the page's DATA? → Start it, await only the code (06).
- [ ] `TransitionContext.navigateTo` calls `window.scrollTo(0,0)`? → Remove. Belongs in PageShell.
- [ ] `TransitionLink` missing same-page guard? → Add: if same page, scrollTo top, return.
- [ ] Animation init not wrapped in `gsap.context()` / `gsap.matchMedia()` returning `revert()`? → Wrap it. No hand-kept trigger arrays (05-ANIMATIONS.md).
- [ ] `PageShell` missing `ScrollTrigger.refresh()` after `enterPage` resolves? → Add it.
- [ ] Page change does not focus `<main>` and `announce(document.title)`? → Add it (the route announcer).
- [ ] Back/forward lands at the top instead of the saved position? → Restore on `POP` (06).
- [ ] A page route imported statically in `router.tsx` (other than home)? → `lazy` from `routeModules`.
- [ ] Router without `errorElement` or without a `*` route? → Add both (04).

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
- [ ] `<html lang>` missing in `index.html`, or not updated on language change? → Fix both.

## H. Animations & App Ready

- [ ] GSAP animation without checking `useAppReady()` first? → Gate it.
- [ ] **Any `data-anim` element that GSAP fades/slides/scales in missing `invisible` in its JSX (never `opacity-0`)? → Add it. This is the #1 repeated flicker bug — see the audit snippet in 05-ANIMATIONS.md.**
- [ ] Animation reveals it with `opacity` instead of `autoAlpha`? → Use `autoAlpha`; plain `opacity` leaves `visibility:hidden` and the element never appears.
- [ ] Reduced-motion branch forgets to reveal the hidden element? → Add `gsap.set(el, { autoAlpha: 1 })`.
- [ ] `markReady()` called synchronously? → Wrap in `useEffect`.
- [ ] `markReady()` called without `document.fonts.ready`? → Use `usePageReady()` or include in `Promise.all`.
- [ ] `markReady()` called without 600ms minimum delay? → Add the delay to `Promise.all`.
- [ ] `catch` block doesn't call `markReady()`? → Add it. Loader must never hang.
- [ ] `clearProps: "all"`? → Name the properties instead. It also wipes inline styles a library set for layout.
- [ ] Entrance animation effect keyed ONLY on `appReady`/`loaderGone` without `pathname`? → Add `pathname`. Those flags are one-shot: the animation plays once per session and is dead on every return visit.
- [ ] Animation gated on `loaderGone` while `PageLoader` is NOT mounted in `Providers.tsx`? → It will never run. Mount the loader, or gate on `appReady` and comment why.
- [ ] `usePageReady()` called in a page controller (HomePage/ProyectosPage/etc.)? → Remove. It's called ONCE in `PageShell`; pages must not repeat it.
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
- [ ] Language switch uses `window.history.replaceState()`? → Use `navigateTo(localizedPath(routeKey, lang))`. Swapping the URL does not change the matched route, so messages never change.
- [ ] Language switch goes to the home page instead of the same page? → Use the route's `handle.routeKey`.
- [ ] Current locale parsed from `location.pathname` with a regex? → Read it from the matched route (`useLocaleData` / `useLocale()`).
- [ ] An internal link built from a hardcoded slug? → `localizedPath(routeKey, locale)`.
- [ ] A route path written by hand per language? → Generate it from `routeTranslations` (09).

- [ ] Page namespace missing from `i18n/types.d.ts`? → Add it; keys are type-checked (09).
- [ ] `toLocaleDateString()`, `toFixed()` + currency, or `${count} items`? → `useFormatter()` / ICU plural (09).
- [ ] Key added in one language only? → Add it everywhere; the parity test fails otherwise.

## J. Logging

- [ ] Direct `console.*` call? → Replace with `logger.*` from `@/utils/logger`.
- [ ] Empty `catch` block or swallowed error? → Add `logger.error(error)`.

## K. Performance

- [ ] `<img>` without `width` and `height`? → Add both (layout shift).
- [ ] First visible `<img>` without `fetchPriority="high"`, or one below the first screen without `loading="lazy"`? → Add it.
- [ ] Lazy-loading RootLayout, Navbar, PageLoader, PageShell, Providers, LiveRegion, Toaster, or markReady() components? → Import them statically.
- [ ] Section below the first screen, or a modal, imported statically? → `React.lazy` (14).
- [ ] Server data fetched with `useEffect` + `useState`, or copied into a Zustand store? → `useQuery` / `useMutation` (04).
- [ ] Query key written inline instead of from `constants/query-keys.ts`? → Move it.
- [ ] Mutation that does not invalidate what it changed? → Invalidate in `onSuccess`.
- [ ] A query that waits for another (`enabled: !!x.data`) without needing its result? → Start both at once (14).
- [ ] Page data through `useSuspenseQuery`? → `useQuery` + `isPending` → `PageLoading` (14).
- [ ] Sign-out with `navigateTo`, or without `queryClient.clear()`? → Clear, then `window.location.assign` (14).
- [ ] Hand-written `useMemo` / `useCallback` / `memo` without a comment saying why the React Compiler is not enough? → Remove it (14).
- [ ] List that can exceed ~100 rows rendered in full? → Virtualise or paginate (14).
- [ ] New dependency over ~20 KB added without looking at the bundle analysis? → Check it; `npm run size` must stay under budget.
- [ ] Asset placed directly in `public/` root (not in `public/assets/`)? → Move it.
- [ ] Email template written to only ONE of the provider's template directory and `public/assets/email/`? → Write both. They must stay identical; `diff` them. (See 10-SEO.md.)
- [ ] Email template using `<style>` blocks, flexbox, a styled `<a>` as a button, or a renamed provider placeholder? → Table layout, inline styles, `<table>` button, exact placeholder.

## L. SEO

- [ ] Page without `<PageMeta routeKey=…>`? → Add it; the title feeds the route announcer.
- [ ] Public site: route × locale without `meta.title` / `meta.description` / `og:image`? → Add them; the head prerender fails otherwise (10-SEO.md).
- [ ] Boot code removes prerendered canonical/hreflang/OG? → Only `<title>` and `description` may be removed.
- [ ] Private app without `noindex` in `index.html`? → Add it.

## M. TypeScript

- [ ] Schema change (table, column, index, access policy, storage bucket) not appended to the repo's schema/migration file in the SAME change? → Add it, dated and idempotent. (11-SECURITY.md)
- [ ] New table with row-level security enabled but no policy? → Add one. RLS with no policy denies everyone, and writes fail as a generic "write-failed".
- [ ] New column added without reloading the data layer's schema cache (if it has one)? → Reload it, or the column 404s from the API until it does.

- [ ] Any `any` type? → Replace with proper type.
- [ ] Shared type defined locally instead of in `types/`? → Move it.
- [ ] Non-null assertion (`!`) without prior null check? → Add null guard.
- [ ] `npx tsc -b` reports new errors? → Fix all. Zero errors required.

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
      1. Browser value that changes live (matchMedia, online)? → `useSyncExternalStore`
         (05-ANIMATIONS.md). Read once (stored preference)? → `useState(() => read())` — fine in
         Vite, there is no hydration.
      2. Value derivable from props/state? → compute it during render, no state at all
      3. A "mounted" flag before a portal? → Remove it; `document.body` exists on first render.
- [ ] Context exposing a **state value that no consumer reads**? → Remove it. A `useState` that
      only ever feeds a ref causes a re-render of the whole subtree for nothing.
      Check every context value against its actual consumers before shipping.
- [ ] `useState` holding something a `useRef` would do? → If it never drives rendering, use a ref.

## P. CMS, Forms, Media & Monitoring

- [ ] CMS schema `preview` whose title/subtitle could be a number, boolean or object? → `prepare()` and `String()` it. Studio calls string methods on titles; a number crashes the whole field editor.
- [ ] Public form route without honeypot, field length caps and rate limit? → Add all three (11-SECURITY.md).
- [ ] Several breakpoint `<video>`s rendered and hidden with CSS? → Render only the matching one (10-SEO.md).
- [ ] `.svg` asset that embeds a `data:image/png`? → Convert to WebP.
- [ ] `window.location.reload()` on resize/breakpoint change? → Rebuild animations instead (05-ANIMATIONS.md).
- [ ] `ErrorBoundary` or `RouteError` that renders nothing or does not report to Sentry? → Report (13-MONITORING.md).
- [ ] No `vite:preloadError` reload-once handler in `main.tsx`? → Add it; every deploy otherwise blanks open tabs (13).
- [ ] `.map` files in `dist/` after build? → `sourcemap: "hidden"` + delete after upload (13).
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

All boxes above: NO. Hook silent. `npx tsc -b` and `npm run lint` both clean.
Before shipping a feature: `npm test` and `npm run test:e2e` green (12-TESTING_CI.md).
→ Move to next file.
