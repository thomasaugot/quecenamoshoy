---
name: check-project-structure
description: "The house project tree and file-naming conventions, for Next.js AND Vite + React projects. Invoke when scaffolding a new project, adding a new folder or top-level file, deciding where a file belongs, naming a component/hook/util/context, or when asked to check or audit the project structure. Run scripts/check_structure.py to validate a tree; it exits non-zero on violations."
---

# Project Structure

Run the validator before trusting a manual read:

```bash
python3 .claude/skills/check-project-structure/scripts/check_structure.py .
```

Exit 0 = clean. Errors are violations; warnings are worth a look. The script detects the
stack (`vite.config.*` → Vite, `next.config.*` → Next) and prints it first.

**Which tree?** Next.js → the tree below, code at the ROOT. Vite + React → the
"Vite tree" section, code under `src/`. Naming, `layout/` vs `ui/`, one component per file
and the settled preferences are the same for both.

## The tree — Next.js

```
globals.css              ← project ROOT, not app/. Imports the 4 styles files in order.
proxy.ts                 ← routing proxy. NEVER middleware.ts.
MEMORY.md                ← per-project state, checklist, session log
CLAUDE.md / AGENTS.md
next.config.ts  tsconfig.json  eslint.config.mjs  postcss.config.mjs

app/
  layout.tsx             ← Server Component. No "use client".
  global-error.tsx       ← last-resort boundary; must render its own <html>/<body>
  robots.ts sitemap.ts   ← stay at app root, siblings of [locale]
  manifest.ts
  api/<name>/route.ts    ← REST handlers. Webhooks, third-party callbacks, cron.
  [locale]/              ← i18n projects. Canonical default-language slugs ONLY.
    layout.tsx
    error.tsx            ← "use client" + reset(). Localised, styled.
    not-found.tsx
    page.tsx
    <route>/
      page.tsx           ← Server Component; hooks live in a *Client.tsx
      actions.ts         ← "use server". Mutations for THIS route.
      error.tsx          ← optional, when this route needs its own fallback

tests/                   ← mirrors the source path being tested
  services/conditions/evaluate.test.ts

components/
  layout/                ← mounted ONCE by Providers or a layout. Navbar, Footer,
                           PageShell, Providers, PageLoader…
  ui/                    ← imported by pages/sections, any number of times.
                           Button, Input, Modal, Dropdown, Icons, TransitionLink…
  pages/<route>/         ← <Route>Client.tsx + <Route><Section>.tsx
  dev/                   ← dev-only panels

contexts/                ← PascalCase.  AppReadyContext.tsx, ScrollContext.tsx…
hooks/                   ← useCamelCase.ts.  usePageReady.ts, useScroll.ts…
lib/                     ← kebab-case. Library barrels: gsap.ts, lenis.ts, store.ts
utils/                   ← kebab-case. logger.ts, seo.ts, preload-images.ts
  animations/            ← named after BEHAVIOUR, never a page
config/                  ← app.config.ts, i18n.config.ts  (only place reading process.env)
constants/               ← kebab-case. Keys, hrefs, structure — never translated text.
types/                   ← kebab-case.
services/                ← kebab-case. Data access.
styles/                  ← theme.css, base.css, animations.css, accessibility.css
locales/<lang>/*.json    ← ALWAYS "locales/", never "messages/"
i18n/                    ← request.ts, routing.ts
public/                  ← favicon.ico + assets/ ONLY at root
docs/
```

## The tree — Vite + React

```
index.html               ← lang, theme pre-paint script, <!--app-head--> placeholder
vite.config.ts  tsconfig.json  tsconfig.app.json  tsconfig.node.json  eslint.config.js
MEMORY.md  CLAUDE.md / AGENTS.md
scripts/                 ← build scripts (prerender-heads.ts — public sites only)
e2e/                     ← Playwright: routes.ts, smoke, a11y, visual
<backend>/               ← backend functions + migrations, e.g. supabase/{migrations,functions}/
public/                  ← favicon.ico + assets/ + host/PWA files (_headers, _redirects) ONLY

src/
  main.tsx               ← entry: fonts, globals.css, Sentry, <RouterProvider>. Nothing else.
  globals.css            ← imports the 4 styles files in order
  vite-env.d.ts          ← typed import.meta.env
  app/
    router.tsx           ← the ONLY place routes are declared: errorElement + path "*"
    route-modules.ts     ← lazy page imports + data prefetch, keyed by routeKey
  components/
    layout/              ← RootLayout, Navbar, Footer, PageShell, Providers, PageLoader…
    ui/                  ← Button, Input, Modal, Dropdown, Icons, TransitionLink…
    pages/<route>/       ← <Route>Page.tsx + <Route><Section>.tsx
  config/                ← app.config.ts, i18n.config.ts (only place reading import.meta.env.VITE_*)
  constants/  contexts/  hooks/  i18n/  lib/  locales/<lang>/*.json
  services/              ← raw calls, no React
  stores/                ← Zustand, one store per domain, UI state only
  styles/                ← theme.css, base.css, animations.css, accessibility.css
  types/  utils/  utils/animations/
```

No `app/[locale]/` folders, no `page.tsx`, no `loading.tsx`, no `error.tsx`: the router file
does all of that (rules `vite/04`, `vite/09`, `vite/15`). Error and 404 are `errorElement` +
`path: "*"` in `router.tsx`. Backend code (functions, migrations) never lives in `src/` — every
byte of `src/` ships to the browser.

## Error and not-found boundaries — required (Next.js)

Every locale segment gets them. Without an `error.tsx`, a throw in any Server Component
renders Next's default error page — unstyled, untranslated, and wrong in every locale.

```
app/[locale]/error.tsx        "use client"; takes { error, reset }; calls reset() to retry
app/[locale]/not-found.tsx    triggered by notFound() and unmatched routes
app/global-error.tsx          only fires when the root layout itself throws;
                              it REPLACES the root layout, so it must render <html> and <body>
```

Rules:
- `error.tsx` is always `"use client"` — it receives a `reset` callback.
- Translate the copy. An error page in the wrong language is worse than none.
- A route whose data source is flaky deserves its own `error.tsx`, not just the segment one.

## `loading.tsx` — Next.js: every public page that awaits data

Follow `nextjs/14-PERFORMANCE.md` → "Page loading state": `loading.tsx` renders
`<PageLoading />` (nothing for one second, then the brand mark). A bespoke skeleton only for a
panel whose layout is known and stable. The earlier "never a loading.tsx" decision (2026-08-22)
was superseded by that rule (Oct 2026): it relied on the ink-curtain overlay, which was removed.

Vite has no `loading.tsx`: a page shows `<PageLoading />` while its query `isPending`
(`vite/14-PERFORMANCE.md`).

## API routes vs server actions (Next.js)

Both belong in the tree; they solve different problems.

```
app/api/<name>/route.ts     ← something EXTERNAL calls you
app/[locale]/<route>/actions.ts  ← your own UI mutates data
```

Use a **route handler** for: webhooks, third-party callbacks, cron targets, anything needing
a stable public URL, non-HTML responses (files, feeds), or a client that isn't your own form.

Use a **server action** for: form submits and mutations from your own components. Prefer it —
no URL to secure, no fetch boilerplate, progressive enhancement for free.

Rules:
- Route handlers are Server Components' territory: never import one from a client component.
- `actions.ts` starts with `"use server"` and lives beside the route that uses it.
- A shared action used by 3+ routes moves to `services/`, and the action becomes a thin wrapper.
- Validate input in BOTH — a server action is a public endpoint, not a private function.
- Secrets stay in `services/` behind `server-only`; handlers and actions call into it.

## Vite: backend functions instead of routes

A Vite app has no API routes or server actions. Privileged work (secrets, AI, email, writes
that bypass access rules) is a backend function in `<backend>/functions/<name>/`, guarded as
its first statement (`vite/11-SECURITY.md`). The app calls it through `src/services/`.

## Tests

`tests/` mirrors the source path (in Vite, the path under `src/`): `services/conditions/evaluate.ts` →
`tests/services/conditions/evaluate.test.ts`.

Do not chase coverage on a marketing site. Test the things where being wrong is expensive:
pure business logic with real thresholds, date/timezone maths, price or score calculation,
and anything parsing a third-party API response shape.

Skip: components, styling, animation, anything that is mostly JSX.

## `layout/` vs `ui/`

One question: **is it mounted once by the shell, or imported by several things?**

| | Goes in | Examples |
|---|---|---|
| Mounted once by `Providers` or a layout | `layout/` | Navbar, Footer, PageShell, PageLoader, BottomTabs |
| Imported by pages or sections, any number of times | `ui/` | Button, Input, Modal, Dropdown, Icons, TransitionLink, NavIcon |

A component that starts in `layout/` and gains a second consumer moves to `ui/`.
`NavIcon` did exactly that — used by both `Navbar` and `BottomTabs`, so it is a `ui/` primitive.

A component that renders no visible UI but is still mounted once by the layout
(e.g. `JsonLd`, which emits a `<script type="application/ld+json">`) stays in `layout/`.
Do not invent a folder for it.

## Naming

| Folder | Convention | Example |
|---|---|---|
| `components/` | PascalCase | `PageShell.tsx`, `HomeHero.tsx` |
| `contexts/` | PascalCase | `ScrollContext.tsx` |
| `hooks/` | `use` + camelCase | `usePageReady.ts` |
| `utils/ lib/ config/ services/ stores/ types/ constants/ i18n/` (+ Vite `app/`) | kebab-case | `page-transitions.ts`, `app.config.ts`, `router.tsx` |

`components/pages/<route>/` holds the page controller plus `<Route><Section>.tsx`:
Next `HomeClient.tsx`, Vite `HomePage.tsx` — then `HomeHero.tsx`, `HomeAbout.tsx`.

`utils/animations/` files are named for what they DO, never for where they appear:
`scroll-reveal.ts`, `hero-entrance.ts`, `page-transitions.ts` — not `home-hero.ts`.
Ask: could this animation appear on another page? Almost always yes.

## Banned outright

Both: `tailwind.config.*` · `*.module.css` · `styles/components.css` · `messages/` (use
`locales/`) · assets loose in `public/` root

Next: `src/` · `middleware.ts` · `app/globals.css`

Vite: `src/App.css` · `src/index.css` · `globals.css`/`styles/`/`components/` at the root
(they live in `src/`) · `"use client"` / `"use server"` anywhere

## One component per file

Never two exports from one file. A modal and its form are two files.
Never define a component inside another component or function.

## Settled preferences — do not re-litigate

**Page-prefixed section components stay.** `components/pages/home/HomeHero.tsx`, not
`home/Hero.tsx`. The prefix is redundant with the folder name and that is fine — Thomas wants
the filename to name its page on sight, and unique filenames keep fuzzy-search unambiguous.
Reviewed and kept, 2026-08-22.

**`docs/` is a mixed dump on purpose.** Markdown, client PDFs, API guides, briefings all live
together, all committed. It is the project's single reference drawer. Do not split it into
`docs/*.md` + external assets. Reviewed and kept, 2026-08-22.
