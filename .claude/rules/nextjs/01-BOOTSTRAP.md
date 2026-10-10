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

# BOOTSTRAP.md — Project Initialization

Run these steps in strict order. Do not skip any. Do not write code until all commands succeed.

---

## ⚠️ Establish the stack BEFORE any infrastructure work

**Never assume a provider because a previous project used one.** Before adding auth, a
database, storage, email, analytics, or deploying anything, establish what THIS project
actually uses:

1. Read `package.json`, `config/`, `.env.example`, and `README.md` first.
2. If that does not answer it, **ask** — one question, before doing any work.

This matters because several skills here are Galaga-specific and their triggers are generic:

| Skill | Fires on | But only correct if |
|---|---|---|
| `deploy-to-galaga-vps` | "deploy", "ship", "put it live", "in production" | the project deploys to the Galaga VPS (5.75.178.191) — **not** Vercel, Netlify, AWS, Railway, or a client's own server |
| `deploy-to-dosxdos-server` | "deploy" on a `*.dospordosgrupoimagen.com` project | the project deploys to the Dos x Dos server (DXD-APPSRV, Windows + WSL) — **not** the Galaga VPS |
| `set-up-galabase-auth` | "needs login", magic-link email problems | the project uses Galabase (Galaga's self-hosted Supabase) — **not** Supabase Cloud, Auth0, Clerk, NextAuth, or a custom backend |

A skill firing is **not** confirmation that its stack applies. If the project is on another
host or another auth provider, say so and stop; do not adapt the Galaga procedure to fit.
Wrong infrastructure work is expensive to unpick and can touch production.

---

## Step 0 — Read the rules FIRST

Before running a single command, read `.claude/rules/00-WORKING-STYLE.md` and every file in
`.claude/rules/nextjs/`. Never apply the files in `.claude/rules/vite/` to a Next project. They are not reference
material to consult later — they define the architecture you are about to build, and most of
them exist because something broke in a previous project.

```
02-MEMORY_TEMPLATE.md   the MEMORY.md skeleton you create in Step 4
03-CSS_TOKENS.md        styling — style={{}} is banned, semantic tokens only
04-CLIENT_SERVER.md     "use client", imports, file naming, provider tree
05-ANIMATIONS.md        GSAP, Lenis, appReady/loaderGone, the data-anim pattern
06-TRANSITIONS.md       page transitions, navigation, scroll-to-top
07-UI_PRIMITIVES.md     Button, Modal, Dropdown, Toaster, PageLoader, Icons
08-ACCESSIBILITY.md     WCAG 2.2 AA — applies to every piece of markup
09-I18N.md              next-intl (skip entirely if the project has no i18n)
10-SEO.md               metadata, sitemap, robots, JSON-LD, email templates
11-SECURITY.md          secrets, API guards, uploads, schema, logging
12-TESTING_CI.md        unit/E2E/a11y/visual tests, Safari devices, CI, deploys wait for CI
13-MONITORING.md        Sentry, reporting error boundaries, uptime, backups
14-PERFORMANCE.md       lazy loading, server cache, prefetch, fast navigation
15-CHECKLIST.md         run against EVERY file before calling it done — always LAST
```

Then ask for the brief — project name, domain, locales, routes, fonts, colors — and fill in
the placeholders in the steps below with real values. Never invent them.

`.claude/hooks/check-rules.sh` blocks the greppable violations automatically after every
write. If it fires, fix the file before continuing; do not work around it.

---

## Step 1 — Bootstrap Commands

```bash
# Pin Node first, so the Mac, CI and the host all build with the same version
node -v | sed 's/^v//' > .nvmrc

# In the project folder itself ("." — never a name, which creates a subfolder)
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-npm \
  --yes
npm install zustand react-icons gsap @gsap/react lenis
npm install -D @types/node vitest babel-plugin-react-compiler size-limit @size-limit/preset-app @next/bundle-analyzer
```

`--yes` accepts the defaults for any prompt the flags do not cover, so the command never stops
to ask. If it refuses because the folder is not empty (`.claude/`, `BRIEF.md`), scaffold into
a temporary folder and move the files over.

Add `"engines": { "node": ">=<same major>" }` and `"test": "vitest run"` to `package.json`.

Add only what the brief asks for:

```bash
npm install react-hook-form              # only if the app has forms
```

## Step 2 — Delete Boilerplate

Delete these files immediately after install:
- `app/globals.css` → replaced by `globals.css` at project root
- `app/page.module.css`
- `public/*.svg`

Clear and replace content (keep the files):
- `app/layout.tsx`
- `app/page.tsx`

## Step 3 — Verify tsconfig.json

Must contain:
```json
"baseUrl": ".",
"paths": { "@/*": ["./*"] }
```

## Step 4 — Create MEMORY.md

Read `.claude/rules/nextjs/02-MEMORY_TEMPLATE.md` and create `MEMORY.md` at project root.

## Step 5 — Create globals.css at Project Root

```css
@import "tailwindcss";
@import "./styles/theme.css";
@import "./styles/base.css";
@import "./styles/animations.css";
@import "./styles/accessibility.css";
```

Import order is non-negotiable. Import once in `app/layout.tsx` as `import "@/globals.css"`.

## Step 6 — Create styles/ at Project Root

Four files required: `theme.css`, `base.css`, `animations.css`, `accessibility.css`. No `components.css`.
Read `.claude/rules/nextjs/03-CSS_TOKENS.md` for their full content.

## Step 7 — Print the folder tree

Invoke `/check-project-structure` for the house tree and naming conventions, then print the exact
tree for this specific project before writing any source files.

Once files exist, audit with:

```bash
python3 .claude/skills/check-project-structure/scripts/check_structure.py .
```

## Step 8 — Write files in folder order

Rules `03`–`10` in `.claude/rules/nextjs/` apply to every file. Follow them.
After each file: run `.claude/rules/nextjs/15-CHECKLIST.md`.

### Opt-in components — DO NOT build these unless asked

These two live in `.claude/skills/` and are **opt-in**. Do not build them on your own
initiative, and do not infer them from a design brief, a reference site, or a mockup:

| Component                      | Skill            |
|--------------------------------|------------------|
| `ScrollToTop.tsx`              | `/add-scroll-to-top` |
| `utils/animations/parallax.ts` | `/add-parallax`      |

Build one **only** when the user explicitly asks for it or invokes its skill. When they do,
invoke the skill first and follow it — the pattern in each is hard-won and non-obvious.

If the brief seems to imply one, ask; do not assume. If the user says to skip one, skip it
silently — do not re-raise it later in the build.

### Always built — no need to ask

`Navbar.tsx` and `PageLoader.tsx` are **not** opt-in: every project has both. Build them as
part of the standard layout, and invoke `/build-navbar` and `/build-page-loader` when you do — those
skills hold the patterns.
