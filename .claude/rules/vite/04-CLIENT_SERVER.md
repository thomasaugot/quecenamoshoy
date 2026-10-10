---
paths:
  - "src/**"
  - "vite.config.*"
  - "index.html"
---

# CLIENT_SERVER.md — Code Boundaries, Imports & Structure (Vite + React)

---

## Everything runs in the browser

A Vite app has no Server Components and no server. Every file in `src/` ends up in a public
JavaScript bundle.

- **No `"use client"` directive, anywhere.** It means nothing here; it is noise copied from Next.
- **No secret in `src/`, ever** — no API key, service key, token or password, not even "just in
  dev". Anything secret runs in a backend (serverless / edge function) the app calls with the
  user's session. The only env values in `src/` are public ones (see `01-BOOTSTRAP.md`).
- A value that decides *which record* is read or written is enforced by the backend (access
  policies, function checks), never by a check in `src/` — the browser can be edited.

---

## Page Pattern (required for every page)

```tsx
// src/app/router.tsx — the ONLY place routes are declared
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  () => load().then((m) => ({ Component: m[name] }))

// i18n projects generate one branch per locale instead — see 09-I18N.md
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        errorElement: <RouteError />,   // pathless: errors render INSIDE the layout, nav stays
        children: [
          { index: true, element: <HomePage /> },   // first screen: static import
          { path: "about", lazy: page(routeModules.about, "AboutPage") },   // same import as preloadRoute (06)
          { path: "*", lazy: page(routeModules.notFound, "NotFoundPage") },
        ],
      },
    ],
  },
])

// src/components/pages/about/AboutPage.tsx — the page controller
// Hooks, data loading and GSAP for the page live here; it renders sections with no content props
export const AboutPage = () => {
  return <><AboutHero /><AboutTeam /></>
}
```

### Every route is lazy except the home page

A static import in `router.tsx` puts that page in the first download. Only the entry route is
static; every other page uses `lazy`, so a visitor downloads only the page they open. The
layout (`RootLayout`, Navbar, PageLoader, Providers) is never lazy.

### Errors and 404 — never React Router's default screen

Without an `errorElement`, a thrown render or loader error shows React Router's raw debug
screen. Two routes are mandatory:

- **`errorElement: <RouteError />`** on a pathless child of the root layout — so the navbar
  stays and the visitor can leave. `RouteError` reads `useRouteError()`, reports it
  (`logger.error` + `Sentry.captureException` in an effect, 13-MONITORING.md) and shows a short
  message in the site's language with a way home. It never shows `error.message`.
- **`path: "*"` → `NotFoundPage`** — a real page, not a blank screen. The host's SPA fallback
  (01-BOOTSTRAP.md) serves `index.html` for unknown URLs, so this route is the only 404 there is.

---

## Data & State — three owners, never mixed

| Data | Owner | Never |
|---|---|---|
| Server data (anything fetched or written) | **TanStack Query** (`useQuery` / `useMutation`) | in Zustand, in `useState` + `useEffect` |
| App-wide UI state (wizard steps, open panels, preferences) | **Zustand**, one store per domain in `src/stores/` | server data copied into it |
| State of one component | `useState` | lifted into a store "just in case" |

```ts
// src/services/items.ts — raw calls only: no React, no cache, throws on error
export const listItems = async (): Promise<Item[]> => { /* fetch / client call */ }

// src/hooks/useItems.ts — the ONLY way components read it
export const useItems = () => useQuery({ queryKey: queryKeys.items.all, queryFn: listItems })

// src/hooks/useCreateItem.ts — every write invalidates what it changed, and toasts
export const useCreateItem = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.items.all }),
  })
}
```

**Why:** `useEffect` + `fetch` in a component has no cache (refetch on every visit), no
dedupe (two components = two requests), and races (navigate fast, the old response lands
last). TanStack Query solves all three and gives retry, background refresh and offline
persistence. It is a data library, not a UI library — the "no component libraries" rule
does not apply.

- Query keys live in `src/constants/query-keys.ts`, never as inline arrays.
- A service **throws** on error; it never returns a fallback the cache would keep.
- A copy of server data in Zustand goes stale the moment the server changes — that is the bug
  this split prevents.

---

## One File, One Component — Always

```tsx
// ❌ Wrong
// Navbar.tsx — two components in one file
const MobileMenu = () => { ... }
export const Navbar = () => { ... }

// ✅ Right — two files
// MobileMenu.tsx
export const MobileMenu = () => { ... }

// Navbar.tsx
import { MobileMenu } from "@/components/layout/MobileMenu"
export const Navbar = () => { ... }
```

No exceptions. Applies to every folder.

---

## Components Are Render-Only — No Logic In JSX Files

A component decides **what the markup looks like**. It never decides *what the data means*.
Every computation, transformation, validation, sort, filter, aggregation, date maths, string
building or fetch belongs somewhere else — imported in, never written inline.

| Kind of logic | Where it goes |
|---|---|
| Pure data transform (sort, filter, group, format, parse, derive) | `src/utils/` |
| Stateful / lifecycle / subscription / anything with hooks | `src/hooks/` |
| Network, database, external API | `src/services/` |
| GSAP timelines and ScrollTriggers | `src/utils/animations/` |
| Fixed values, option lists, hrefs, keys, thresholds | `src/constants/` |
| Type declarations | `src/types/` |

```tsx
// ❌ BANNED — business logic living in a component
export const ItemList = ({ items }: { items: Item[] }) => {
  const sorted = [...items]
    .filter((i) => i.status === "active" && i.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
  const label = `${sorted.length} of ${items.length} items`
  return <ul>{sorted.map((i) => <ItemRow key={i.id} item={i} />)}</ul>
}

// ✅ RIGHT — utils/items.ts owns the rule, the component only renders
import { topActiveItems } from "@/utils/items"

export const ItemList = ({ items }: { items: Item[] }) => {
  const sorted = topActiveItems(items)
  return <ul>{sorted.map((i) => <ItemRow key={i.id} item={i} />)}</ul>
}
```

**Why:** logic in a component cannot be unit-tested without rendering it, cannot be reused by
the next component that needs the same rule, and gets silently duplicated-then-diverged. Moving
it out costs one import and makes the component readable at a glance.

### What IS allowed to stay in a component

- JSX and conditional rendering (`&&`, ternaries, early `return null`)
- Calling a hook and destructuring its result
- Wiring an imported handler to an event (`onClick={handleSubmit}`)
- `map` over already-prepared data to render rows
- Trivial presentational branching (`isOpen ? "rotate-180" : ""`)

### The ONE exception — trivial, presentational, used exactly once

If a piece of logic is **all three** of these, leave it in the component:

1. **Used in exactly one place** — nothing else will ever need it, and
2. **Purely presentational** — it shapes how something looks, it does not encode a business
   rule, and
3. **Trivial** — one short expression; a separate file would be overkill.

```tsx
// ✅ stays — one line, one use, presentation only
const initials = name.slice(0, 2).toUpperCase()
const label = isOpen ? "Hide details" : "Show details"

// ❌ moves — a business rule, even though it is one line
const canSubmit = user.status === "active" && !user.suspended && slot.remaining > 0
```

The moment it is reused, tested, or expresses a rule of the domain, it moves out. When in
doubt, move it — the cost of an extra import is far lower than the cost of duplicated,
diverging logic.

### The test

If you can describe a block as "it *works out* / *decides* / *calculates* / *fetches*
something", it is logic — move it. If it only *shows* something, it stays.

---

## Import Rules

### Always use @/ aliases
```tsx
// ❌ Never
import { Button } from "../../components/ui/Button"

// ✅ Always
import { Button } from "@/components/ui/Button"
```

### Library imports — always through lib/

**Why:** one import site per library means swapping or version-pinning it is a one-file change,
and plugin registration (`gsap.registerPlugin`) happens exactly once instead of being duplicated
or forgotten. The barrels themselves (`src/lib/gsap.ts`, `src/lib/lenis.ts`,
`src/components/ui/Icons.tsx`, `src/components/ui/TransitionLink.tsx`) are the sanctioned
exception — they must import the real package.

```tsx
// ❌ Direct library imports
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import { FiMenu } from "react-icons/fi"
import { Link, NavLink } from "react-router"

// ✅ Through lib/ or the UI barrels
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap"
import { Lenis } from "@/lib/lenis"
import { IconMenu } from "@/components/ui/Icons"
import { TransitionLink } from "@/components/ui/TransitionLink"
```

### Environment variables — only in config/
```tsx
// ❌ anywhere else
import.meta.env.VITE_API_URL

// ✅ only in src/config/app.config.ts, then import the value
import { appConfig } from "@/config/app.config"
```

### Logging — never console.*
```tsx
// ❌
console.log("error", e)
console.error(e)

// ✅
import { logger } from "@/utils/logger"
logger.error(e)
```

---

## Canonical Project Structure — mirror this exactly

Every project uses this tree. Do not invent folders, do not rename these, do not flatten them.
If something does not obviously belong in one of these, it goes in the closest match — never
in a new top-level folder.

```
src/
  main.tsx              entry — fonts, globals.css, <RouterProvider>; nothing else
  globals.css
  vite-env.d.ts         typed import.meta.env
  app/                  router.tsx — route declarations only
  components/
    layout/             RootLayout, Navbar, Footer, PageShell, Providers, PageLoader
    ui/                 primitives — Button, Modal, Dropdown, Icons, Toaster, TransitionLink
    pages/[page]/       [Page]Page.tsx, [Page][Section].tsx
    <feature>/          optional, per feature area (admin/, dashboard/, …)
  config/               app.config.ts, i18n.config.ts — the ONLY place reading import.meta.env
  constants/            keys, hrefs, option lists, thresholds — never translated text
  contexts/             React providers
  hooks/                use*
  i18n/                 i18n setup
  lib/                  third-party barrels — gsap.ts, lenis.ts, query-client.ts, <client>/
  locales/              translation JSON — NEVER "messages/"
  services/             network / database / external API calls — raw, no React
  stores/               Zustand — one store per domain, UI state only
  styles/               theme.css, base.css, animations.css, accessibility.css
  types/                shared TypeScript types
  utils/                pure helpers
    animations/         GSAP init functions

public/assets/          images, videos, icons, fonts
index.html · vite.config.ts · tsconfig*.json   project root
```

---

## Types — `types/` by default

Every type that more than one file could ever use lives in `src/types/`, in a kebab-case file
named for the domain (`types/user.ts`, `types/order.ts`).

The **only** exception: a type used by exactly one component, describing only that component's
own props or internal shape, may stay in that file.

```tsx
// ✅ fine to keep local — nothing else will ever use it
type ButtonVariant = "filled" | "outlined"

// ❌ move to types/user.ts — this is domain data, it will be needed elsewhere
type User = { id: string; name: string; score: number }
```

If you find yourself importing a type from a component file, it was in the wrong place — move
it to `types/`.

---

## File Naming Convention

| Location | Convention | Examples |
|---|---|---|
| `components/` | PascalCase | `PageLoader.tsx`, `HomeHero.tsx`, `HomePage.tsx` |
| `contexts/` | PascalCase | `ScrollContext.tsx`, `AppReadyContext.tsx` |
| `hooks/` | `use` + camelCase | `usePageReady.ts`, `useScroll.ts` |
| `app/`, `utils/`, `lib/`, `config/`, `services/`, `stores/`, `types/`, `constants/`, `i18n/` | kebab-case | `router.tsx`, `page-transitions.ts`, `wizard-store.ts` |

```
✅ src/utils/animations/page-transitions.ts
✅ src/hooks/usePageReady.ts          ← hooks are the exception: camelCase with "use" prefix
✅ src/components/layout/PageShell.tsx
✅ src/lib/gsap.ts

❌ src/utils/animations/pageTransitions.ts
❌ src/components/layout/page-shell.tsx
```

---

## Provider Tree — Providers live INSIDE the router

Any provider that uses a router hook (`useNavigate`, `useLocation` — `TransitionContext`,
`PageShell`) crashes with "useNavigate() may be used only in the context of a <Router>" if it
wraps `<RouterProvider>`. So the providers mount in the root layout route, not in `main.tsx`.

```tsx
// src/main.tsx — entry only
import "@fontsource-variable/inter"
import "@/globals.css"

const root = document.getElementById("root")
if (!root) throw new Error("#root not found in index.html")
createRoot(root).render(<StrictMode><RouterProvider router={router} /></StrictMode>)

// src/components/layout/RootLayout.tsx — the root route's element
<Providers>
  <SkipLink targetId="main-content" />
  <Navbar />
  <PageShell><Outlet /></PageShell>
  <Footer />
</Providers>

// src/components/layout/Providers.tsx
<QueryClientProvider client={queryClient}>
<AppReadyProvider>
  <ScrollProvider>
    <TransitionProvider>
      <MotionPreferenceProvider>
        <PageLoader />
        {children}
        <Toaster />
        <LiveRegion />
      </MotionPreferenceProvider>
    </TransitionProvider>
  </ScrollProvider>
</AppReadyProvider>
</QueryClientProvider>
```

---

## lib/ files

```ts
// src/lib/gsap.ts
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
gsap.registerPlugin(ScrollTrigger, useGSAP)
export { gsap, ScrollTrigger, useGSAP }

// src/lib/lenis.ts
import Lenis from "lenis"
export { Lenis }

// src/lib/query-client.ts — the single QueryClient
import { QueryClient } from "@tanstack/react-query"
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
})
```

```ts
// src/stores/wizard-store.ts — one file per domain
import { create } from "zustand"
export const useWizardStore = create<WizardState>()((set) => ({ /* … */ }))
```
