---
paths:
  - "src/**"
  - "vite.config.*"
  - "index.html"
---

# BOOTSTRAP.md — Project Initialization (Vite + React)

Run these steps in strict order. Do not skip any. Do not write code until all commands succeed.

---

## ⚠️ Establish the stack BEFORE any infrastructure work

**Never assume a provider because a previous project used one.** Before adding auth, a
database, storage, email, analytics, or deploying anything, establish what THIS project
actually uses:

1. Read `package.json`, `.env.example`, `README.md` and the brief first.
2. If that does not answer it, **ask** — one question, before doing any work.

Several skills here are Galaga-specific and their triggers are generic:

| Skill | Fires on | But only correct if |
|---|---|---|
| `deploy-to-galaga-vps` | "deploy", "ship", "put it live", "in production" | the project deploys to the Galaga VPS (5.75.178.191) — **not** Cloudflare Pages, Vercel, Netlify, AWS, Railway, or a client's own server |
| `deploy-to-dosxdos-server` | "deploy" on a `*.dospordosgrupoimagen.com` project | the project deploys to the Dos x Dos server — **not** the Galaga VPS |
| `set-up-galabase-auth` | "needs login", magic-link email problems | the project uses Galabase (Galaga's self-hosted Supabase) — **not** Supabase Cloud, Auth0, Clerk, or a custom backend |

A skill firing is **not** confirmation that its stack applies. If the project is on another
host or another auth provider, say so and stop; do not adapt the Galaga procedure to fit.

---

## Step 0 — Read the rules FIRST

Before running a single command, read `.claude/rules/00-WORKING-STYLE.md` and every file in
`.claude/rules/vite/`. They define the architecture you are about to build. Never apply the
files in `.claude/rules/nextjs/` to a Vite project.

Then ask for the brief — project name, domain, locales, routes, fonts, colors — and fill in
the placeholders below with real values. Never invent them.

`.claude/hooks/check-rules.sh` blocks the greppable violations automatically after every
write. If it fires, fix the file before continuing; do not work around it.

---

## Step 1 — Bootstrap Commands

```bash
# Pin Node first, so the Mac, CI and the host all build with the same version
node -v | sed 's/^v//' > .nvmrc

# In the project folder (answer "ignore files and continue" if it is not empty)
npm create vite@latest . -- --template react-ts
npm install
npm install react-router @tanstack/react-query zustand react-icons gsap @gsap/react lenis
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node vitest babel-plugin-react-compiler size-limit @size-limit/preset-app rollup-plugin-visualizer
```

Add `"engines": { "node": ">=<same major>" }` to `package.json` and
`"test": "vitest run"` to its scripts. Vitest reuses `vite.config.ts`, so it costs nothing to
have from day one.

Add only what the brief asks for:

```bash
npm install @supabase/supabase-js        # Supabase backend
npm install -D vite-plugin-pwa           # installable app / offline
npm install react-hook-form              # only if the app has forms
npm install -D tsx                       # public sites: runs scripts/prerender-heads.ts (10-SEO.md)
```

## Step 2 — Delete Boilerplate

Delete these files immediately after install:
- `src/App.css`
- `src/index.css` → replaced by `src/globals.css`
- `src/assets/react.svg`
- `public/vite.svg`

Clear and replace content (keep the files):
- `src/App.tsx`
- `src/main.tsx`
- `index.html` (title, `lang`, favicon)

## Step 3 — `@/` alias — in TWO places

TypeScript and Vite resolve imports separately. Set it in only one and either the editor or
the build breaks.

```jsonc
// tsconfig.app.json → compilerOptions
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

```ts
// vite.config.ts
import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
})
```

## Step 3b — Environment variables: everything `VITE_` is PUBLIC

A Vite app has no server. Every `import.meta.env.VITE_*` value is **inlined into the JS bundle**
and readable by anyone who opens DevTools. Only public values go there (Supabase URL,
publishable/anon key). Secrets (AI keys, service-role keys) live in the backend — e.g.
Supabase secrets read by an Edge Function — **never** in a `VITE_` variable, never in `.env`
files the frontend reads.

`import.meta.env` is read in **one** file only, typed, and fails loudly when a value is missing:

```ts
// src/config/app.config.ts
const required = (name: string, value: string | undefined): string => {
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env.local.`)
  return value
}

export const appConfig = {
  isDev: import.meta.env.DEV,
  supabaseUrl: required("VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL),
  supabaseKey: required("VITE_SUPABASE_PUBLISHABLE_KEY", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
} as const
```

```ts
// src/vite-env.d.ts — so a typo in a variable name is a tsc error
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}
```

Every variable is listed (empty) in `.env.example`.

## Step 3c — Supabase types (Supabase projects only)

Generate the database types once the first migration exists, and again after every migration:

```bash
npx supabase gen types typescript --local > src/types/database.ts
```

Pass them to the client (`createClient<Database>(…)`) so every query is typed: a renamed
column becomes a `tsc` error, not a runtime bug. Generate from the **local** stack
(`supabase start`); generating from the remote project reads production, so only when Thomas
says so.

## Step 3d — SPA fallback on the host

React Router routes exist only in the browser. A refresh or a shared link on `/favourites`
asks the host for a file that does not exist. Every host must serve `index.html` instead:

| Host | What to do |
|---|---|
| Cloudflare Pages | Nothing — with no top-level `404.html` it serves `index.html` automatically. Do NOT add a `/* /index.html 200` rule: Pages flags it as an infinite loop. |
| Netlify | `public/_redirects` → `/* /index.html 200` |
| Vercel | `vercel.json` → `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` |

Verify after the first deploy: open a deep route and hard-refresh it.

## Step 4 — Create MEMORY.md

Read `.claude/rules/vite/02-MEMORY_TEMPLATE.md` and create `MEMORY.md` at project root.

## Step 5 — Create `src/globals.css`

```css
@import "tailwindcss";
@import "./styles/theme.css";
@import "./styles/base.css";
@import "./styles/animations.css";
@import "./styles/accessibility.css";
```

Import order is non-negotiable. Import once, in `src/main.tsx`, as `import "@/globals.css"`.

## Step 6 — Create `src/styles/`

Four files required: `theme.css`, `base.css`, `animations.css`, `accessibility.css`. No
`components.css`.

## Step 7 — Print the folder tree

Print the exact tree for this project — taken from the brief — before writing any source
file. Everything lives under `src/`; nothing at the root except config, `index.html`,
`public/` and backend folders (e.g. `supabase/`).

## Step 8 — Write files in folder order

The rules in `.claude/rules/vite/` apply to every file. After each file, run the checklist.

### Opt-in components — DO NOT build these unless asked

| Component | Skill |
|---|---|
| `ScrollToTop.tsx` | `/add-scroll-to-top` |
| `utils/animations/parallax.ts` | `/add-parallax` |

Build one **only** when the user explicitly asks for it or invokes its skill. If the brief
seems to imply one, ask; do not assume. If the user says to skip one, skip it silently.

### Always built — no need to ask

`Navbar.tsx` and `PageLoader.tsx` are **not** opt-in: every project has both. Build them as
part of the standard layout, and invoke `/build-navbar` and `/build-page-loader` when you do —
take the pattern, leave out anything Next-specific (`next/link`, `usePathname`, `next/image`).
