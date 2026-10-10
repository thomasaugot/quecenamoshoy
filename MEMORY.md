# Qué cenamos hoy Memory

## Project
- Name: Qué cenamos hoy (quecenamoshoy)
- Domain: quecenamoshoy.helloimtom.dev
- Host: Cloudflare Pages (static) · backend: Supabase Cloud (auth, Postgres, storage, Edge Functions)
- Default locale: es
- Locales: es, en, fr
- i18n enabled: yes (use-intl, translated slugs — vite/09-I18N.md)
- PWA (installable, offline): yes — `build-progressive-web-app` skill, scope "shell + read data"
- Users: one (Thomas). Private app: every screen requires a session, `noindex`.
- Brief: docs/BRIEF.md

## Routes (canonical slugs in default language)
| routeKey | es | en | fr | Access |
|---|---|---|---|---|
| home (wizard + results) | / | /en | /fr | login required |
| favourites | /favoritos | /en/favourites | /fr/favoris | login required |
| history | /historial | /en/history | /fr/historique | login required |
| dish | /plato/:dishId | /en/dish/:dishId | /fr/plat/:dishId | login required |
| login | /entrar | /en/login | /fr/connexion | public |
| notFound | * | * | * | public |

## Design System
Values live in `src/styles/theme.css` — never copy hex or sizes here, they drift.
- Font(s): Inter Variable — loaded via @fontsource-variable/inter — why: PLACEHOLDER until the design pass
- Palette intent: PLACEHOLDER neutral (the rule's WCAG-checked light/dark example values)
- Light + dark themes, system by default

## Foundations (layout, contexts, lib — not every component)
- [x] src/main.tsx
- [x] src/app/router.tsx
- [x] src/config/app.config.ts
- [x] src/vite-env.d.ts
- [x] src/globals.css
- [x] src/styles/theme.css
- [x] src/styles/base.css
- [x] src/styles/animations.css
- [x] src/styles/accessibility.css
- [x] src/components/layout/RootLayout.tsx
- [x] src/components/layout/Providers.tsx
- [x] src/components/layout/PageLoader.tsx
- [x] src/components/layout/PageShell.tsx
- [x] src/components/layout/Navbar.tsx
- [x] src/components/layout/BottomTabs.tsx (instead of a Footer: app, thumb navigation)
- [x] src/contexts/AppReadyContext.tsx
- [x] src/contexts/TransitionContext.tsx
- [x] src/contexts/ScrollContext.tsx
- [x] src/hooks/useAppReady.ts
- [x] src/hooks/usePageReady.ts
- [x] src/lib/sentry.ts
- [x] src/lib/gsap.ts
- [x] src/lib/lenis.ts
- [x] src/lib/query-client.ts
- [x] src/lib/supabase.ts
- [x] src/utils/animations/page-transitions.ts
- [x] src/components/ui/TransitionLink.tsx

## Opt-in components (only if this project asked for them — delete the rest)
- none requested

## Session Log
- 2026-10-10 — Rules split into `.claude/rules/{nextjs,vite}`.
- 2026-10-10 — Bootstrap following vite/00–15 (unsupervised): Vite 8 + TS 6 scaffold, tokens (placeholder), i18n es/en/fr with translated slugs, router + lazy routes, contexts, PageShell transitions, PageLoader, Navbar + BottomTabs, auth guard + login form, Toaster, Sentry (off without DSN), CSP header script, initial migration + RLS + pgTAP tests (files only), supabase config, CI. Gates: tsc -b ✓, lint ✓, vitest 18/18 ✓, hook silent ✓, structure audit ✓. NOT run: dev server, build, e2e, any database.

## Decisions
- 2026-10-10 — Languages es (default), en, fr — why: Thomas, answering the brief's open question.
- 2026-10-10 — Design tokens are neutral placeholders — why: brief has no brand; design pass later with Thomas.
- 2026-10-10 — Supabase work is files only (migrations, RLS, tests); nothing runs against any database — why: Thomas.
- 2026-10-10 — ESLint instead of the template's oxlint — why: the purity rules (impure render, setState in effect, React Compiler bail-outs) only exist in eslint-plugin-react-hooks.
- 2026-10-10 — React Compiler via `react({ compiler: true })` (oxc-transform-react) — why: @vitejs/plugin-react 6 (Vite 8) replaces the Babel option the rules described.
- 2026-10-10 — `@size-limit/file` instead of `@size-limit/preset-app` — why: preset-app pulls 12 high-severity advisories (estimo/puppeteer) and the budget only needs gzip size.
- 2026-10-10 — No `VITE_SITE_URL`: the site URL is `window.location.origin` — why: a SPA always knows its origin; one less env var to forget.

## Deviations from spec
- Brief §5 lists React Router + Zustand; the house rules add TanStack Query for server data (vite/04).
- Brief §9 text class names (`.display`, `.heading`, `.body-text`, `.label`) → house names `.text-display`, `.text-heading`, `.text-body`, `.text-label` (vite/03 house convention) — confirm with Thomas.

## Known issues / TODO
- Never run yet in a browser: Thomas's dev server, then check loader → login → nav → language switch.
- `npm run build` / `npm run size` not run (rule: no build until told) — CI does it.
- RLS tests (`supabase/tests/database/rls.test.sql`) written, not run: needs `supabase start` (Docker).
- E2E (Playwright) not set up yet; CI has no e2e job until it is.
- Sentry: source-map upload (`@sentry/vite-plugin`, SENTRY_AUTH_TOKEN) + alert rules — at deploy time.
- Uptime workflow — at deploy time (needs the live URL).
- Supabase dashboard (prod): sign-ups OFF, auth rate limits, redirect URLs = the domain only — Thomas.
- PWA (build-progressive-web-app skill) — milestone 6.
- Navbar is a placeholder: the build-navbar skill (CSS transitions, style writes) contradicts vite/06 (GSAP only) — decide in the design pass.
- Proposed rule corrections (not applied — Thomas approves rule changes): vite/01 + vite/14 React Compiler is `react({ compiler: true })` on plugin-react 6; vite/01 `@size-limit/file` not preset-app; vite/01 ESLint, not oxlint; TS 6 has no `baseUrl`; Sentry 11 `dataCollection` replaces `sendDefaultPii` (vite/13).
- Brief open questions still unanswered: avoid window (7 days?), images (AI vs own photos first), format of the existing favourites list.
