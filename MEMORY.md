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
| wizard | /preguntame | /en/ask-me | /fr/demande-moi | login required |
| roulette | /ruleta | /en/roulette | /fr/roulette | login required |
| settings | /ajustes | /en/settings | /fr/reglages | login required |
| login | /entrar | /en/login | /fr/connexion | public |
| notFound | * | * | * | public |

## Design System
Source: docs/design.html (13 screens, mobile 390 + desktop 1440). Values live in `src/styles/theme.css`.
- Fonts (Fontsource, self-hosted): Cormorant Garamond 500 + italic (titles, `.text-display/title/heading`),
  Caveat Variable (the kitchen's handwritten voice, `.text-voice*`, `.text-note`), Jost Variable (body, buttons, labels).
- Palette: cream page, brown ink, kitchen green = action + kitchen's voice, terracotta = italic emphasis
  in titles (`<em>` inside a title class), mustard = my replies / active chip, sage = "no tengo".
- Shapes: pill buttons, fields are an ink line (`field-line`), photos pinned with a white border + warm
  shadow + tilt (`photo-frame`, `-rotate-*`), reply bubbles (`bubble-reply`).

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
- 2026-10-10 — Logo: animated cloche (components/ui/Cloche.tsx) — plate in perspective, Phosphor Fill dish icons in palette colours; navbar, loader, PageLoading, login; favicon = closed cloche. History in .claude/design-log.md.
- 2026-10-10 — Milestone 2 (People & settings): /ajustes page — people at the table (rename, remove, allergies/diet/dislikes chips, weekly goals), add person, house panel (avoid window, default diners, language, reduced motion, sign out). Catalogues in constants/ (allergens with es/en/fr synonyms + findAllergens safety net, diets, dislikes, goals). No migration needed. Gates: tsc -b ✓, lint ✓, vitest 37/37 ✓, hook silent ✓. NOT checked in a browser by me.
- 2026-10-10 — Settings: typed (free-text) allergies/diets/dislikes — person_restrictions.label + key c_<slug>.
- 2026-10-10 — Milestone 3 (Favourites): /favoritos photo wall, search + per-person filter, per-person hearts, add/edit/delete dish in a <dialog> Modal (protein, traits, hot/cold, loved by). Migration backfills dish_favourites from is_favourite. Gates ✓ (vitest 45). Not seen in a browser by me. Still to come: import of the existing list (already seeded by SQL), own photo upload (milestone 8).
- 2026-10-10 — Milestone 4 (History): /historial month-by-month list (photo, day, diners, stars, note), log/edit/delete a dinner in a Modal (dish picker that can create a new dish, last-7-days chips, diners + guests, home/travel, rating, note, leftovers), "Esta semana" goals note (utils/goals.ts; meals with no diners count for me). Goals count via GOALS[].counts (protein/traits). Gates ✓ (vitest 51). No migration. Not seen in a browser by me.
- 2026-10-10 — Tests moved to top-level tests/unit/ (mirrors src/) — Thomas. supabase/tests/database stays (CLI convention).
- 2026-10-10 — Milestone 5 (My kitchen): /cocina (linked from Ajustes) — home/travel switch, checklist by category (51 catalogue items, typed extras), scan via Edge Function scan-kitchen (Gemini, structured output restricted to catalogue keys, per-user 10/h limit via ai_calls). Migration: kitchen_items.label + ai_calls. CI: deno check + lint of functions. Function NOT deployed (Thomas). Gates ✓ (vitest 57).
- 2026-10-10 — Language now sticks: i18n/restore-locale.ts sends unprefixed URLs to the saved choice before the router starts; language switcher removed from the navbar (it's in Ajustes). Cocina added to the nav (5 tabs).
- 2026-10-10 — Milestone 6 (AI suggestions): Edge Function `suggest` (context read under the caller's RLS, prompt per brief §4, structured output, server re-checks favourites ids / avoid window / exclude / catalogue equipment; 30/h) + /preguntame wizard as a conversation (thread of mustard replies, one question at a time, results with Cenamos esto / Guardar en favoritos / Otras tres ideas, client allergen warning). Location+diners remembered for the day (localStorage today-answers). NOT deployed. "Ver receta" waits for milestone 8.
- 2026-10-10 — Milestone 7 (Roulette): /ruleta — tonight (remembered for the day), preference chips + free text (weights, never filters), SVG wheel drawn as a plate, slices sized by weight, GSAP spin, result with Cenamos esto / Otra vuelta. NO Edge Function, NO AI: rules + weights in utils/roulette.ts (tested). Gates ✓ (vitest 77).
- 2026-10-10 — Roulette preference made decisive (matches fill the wheel, typo-tolerant words, typed words switch chips on, equal slices). Edge Function enrich-dishes + "Clasificar N platos" button in Favoritos: one Gemini call fills empty protein/traits/temp/equipment/description, never overwrites (3/day). NOT deployed.
- 2026-10-10 — Milestone 8 (part 1): dish page /plato/:id (photo, labels, who loves it, last eaten, own photo upload → {user}/{dish}.webp), recipe view/edit (text, one line each), Edge Functions `recipe` (Gemini, my kitchen + diners' restrictions, saved, 10/day) and `import-recipe` (schema.org JSON-LD from a pasted https link, SSRF-guarded, no AI, 30/day). Allergen warning on recipe ingredients. Migration: recipes.source + source_url. Not deployed. Still to do: AI dish image (dish-image).
- 2026-10-10 — Milestone 9 (PWA): vite-plugin-pwa (registerType prompt, app shell precache only), icons from the closed cloche (any ×2, maskable, apple-touch), UpdatePrompt (persistent, hourly check), OfflineBanner, InstallButton in Ajustes (iOS hint), persisted TanStack cache in IndexedDB (meta.persist, 7 days, wiped on sign-out), storage.persist() after sign-in, wizard disabled offline. NOT built/verified: no `vite build` run (rule) — CI builds it.
- 2026-10-10 — Milestone 10 (deploy) prepared for VERCEL (not Cloudflare as the brief said — Thomas): vercel.json (SPA rewrite, security headers, static strict CSP, noindex, git deploys off), .github/workflows/deploy.yml (vercel pull/build/deploy --prebuilt after CI green on main). Inline script removed from index.html (ScrollContext sets scrollRestoration) so the CSP needs no hash; scripts/write-headers.ts deleted. Test guards: no inline script, CSP strict.

## Decisions
- 2026-10-10 — Languages es (default), en, fr — why: Thomas, answering the brief's open question.
- 2026-10-10 — Design tokens from docs/design.html (replaced the placeholders).
- 2026-10-10 — Light theme only — why: the design has no dark theme; dark tokens removed (03 allows one theme).
- 2026-10-10 — Labels/meta at 14px minimum, not the design's 11–13px — why: house rule 03 (smallest size = --text-sm). Confirm with Thomas.
- 2026-10-10 — Terracotta split: #d2552f `accent` for large text only (3.8:1), #b8452a `accent-strong` for small text/filled actions (5:1) — the design itself uses #b8452a for "Empezar".
- 2026-10-10 — Sage #66725f → #5f6b58 — why: 4.25:1 on its pale background; 4.71:1 now, visually the same.
- 2026-10-10 — ONE schema file: `supabase/schema.sql` (no migrations folder). Every change = a dated idempotent block appended there AND pasted in the chat; Thomas runs it in the Supabase SQL Editor — why: Thomas.
- 2026-10-10 — ESLint instead of the template's oxlint — why: the purity rules (impure render, setState in effect, React Compiler bail-outs) only exist in eslint-plugin-react-hooks.
- 2026-10-10 — React Compiler via `react({ compiler: true })` (oxc-transform-react) — why: @vitejs/plugin-react 6 (Vite 8) replaces the Babel option the rules described.
- 2026-10-10 — `@size-limit/file` instead of `@size-limit/preset-app` — why: preset-app pulls 12 high-severity advisories (estimo/puppeteer) and the budget only needs gzip size.
- 2026-10-10 — Settings has no theme switch (brief §3.9 lists one) — why: light theme only (decision above).
- 2026-10-10 — Restriction/goal catalogues are my proposal (14 EU allergens, 6 diets, 14 dislikes, 7 goals) — Thomas can ask to add or remove keys; keys are DB values, labels live in common.json → catalogue.
- 2026-10-10 — scan-kitchen gets the photos in the request body (resized to 1280px JPEG in the browser), not uploaded to Storage first as brief §7 says — why: nothing to store or clean up; the photos are only looked at once.
- 2026-10-10 — Gemini text model gemini-3.8-flash, not the brief's gemini-2.5-flash — why: 2.5 answers 404 "no longer available to new users"; 3.8 Flash is Google's GA Flash model (ai.google.dev/gemini-api/docs/models).
- 2026-10-10 — AI cost ceiling (supabase/functions/_shared/gemini.ts): thinking low, max output tokens, per-user caps suggest 6/h 20/day, scan 2/h 4/day ⇒ worst case ≈ $0.26/day — why: Thomas refuses any risk of dollars a day; it's a fun app.
- 2026-10-10 — Roulette has no `roulette` Edge Function (brief §7 lists one) — why: it only filters and weights, no AI needed; running it in the app costs nothing and reads the same RLS-protected data.
- 2026-10-10 — PWA offline scope: shell + read data (brief §8) — dishes, recipes, history, people, settings, kitchen readable offline; ideas/writes need a connection.
- 2026-10-10 — Deploy builds ON Vercel (`vercel deploy --prod`), never `vercel pull` + local `vercel build` — why: the VITE_* vars are Sensitive; pull returns "[SENSITIVE]" and the app shipped "Invalid supabaseUrl". Live: https://quecenamoshoy.helloimtom.dev (DNS on Vercel).
- 2026-10-10 — Host: Vercel, not Cloudflare Pages (brief §10) — why: Thomas.
- 2026-10-10 — No `VITE_SITE_URL`: the site URL is `window.location.origin` — why: a SPA always knows its origin; one less env var to forget.

## Deviations from spec
- Brief §5 lists React Router + Zustand; the house rules add TanStack Query for server data (vite/04).
- Brief §9 text class names (`.display`, `.heading`, `.body-text`, `.label`) → house names `.text-display`, `.text-heading`, `.text-body`, `.text-label` (vite/03 house convention) — confirm with Thomas.

## Known issues / TODO
- Propose a rule change (vite/12 + nextjs/12): tests live in top-level tests/, not beside the code — Thomas's preference, not yet in the general rules.
- scan-kitchen: deploy + secrets GEMINI_API_KEY, ALLOWED_ORIGINS (Thomas). Recipes/suggestions must filter by kitchen_items when built (milestones 6–8).
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
