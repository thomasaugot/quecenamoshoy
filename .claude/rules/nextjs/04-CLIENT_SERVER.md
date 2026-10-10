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

# CLIENT_SERVER.md — "use client" Rules & Imports

---

## Default: Server Component

Every file is a Server Component unless it needs one of these:
- Any React hook (`useState`, `useEffect`, `useRef`, `useContext`, …)
- Any browser API (`window`, `document`, `navigator`, `localStorage`, …)
- Event listeners or DOM manipulation
- GSAP, Lenis, or any animation library
- Context provider or consumer
- `react-hook-form`

`"use client"` must be the very first line. Nothing before it.

---

## Always "use client" (no exceptions)

- All files in `contexts/`
- All files in `hooks/`
- All files in `lib/`
- All files in `utils/animations/`

**Why:** these four all touch React state or the DOM at module scope. `lib/gsap.ts` calls
`gsap.registerPlugin()` on import; `contexts/` and `hooks/` are React-runtime by definition;
`utils/animations/` reaches for `window` and `document`. Importing any of them from a Server
Component without the directive is a build error, not a style issue.

**The one documented inversion:** a `lib/` file holding a secret — typically a server-side
database client carrying an admin/service key that bypasses all access rules. Such a file uses
`server-only` instead, because marking it client-side would ship that key to the browser. If a
`lib/` file holds a credential, `server-only` is the correct guard and this rule does not
apply. Log the deviation in MEMORY.md.

## Never "use client"

- `app/layout.tsx` and `app/*/page.tsx` — Server Components
- `utils/logger.ts` — pure logic
- `services/` files — unless exclusively client-side

---

## PageClient Pattern (required for every page)

```tsx
// app/about/page.tsx — Server Component, NO directive
import { AboutPageClient } from "@/components/pages/AboutPageClient"
export default async function AboutPage() {
  const data = await fetchAboutData()
  return <AboutPageClient data={data} />
}

// components/pages/about/AboutPageClient.tsx
"use client"
// All hooks, GSAP, refs, markReady() live here
```

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
| Pure data transform (sort, filter, group, format, parse, derive) | `utils/` |
| Stateful / lifecycle / subscription / anything with hooks | `hooks/` |
| Network, database, external API | `services/` |
| GSAP timelines and ScrollTriggers | `utils/animations/` |
| Fixed values, option lists, hrefs, keys, thresholds | `constants/` |
| Type declarations | `types/` |

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

## IMPORTS.md inline — Import Rules

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
or forgotten. The barrels themselves (`lib/gsap.ts`, `lib/lenis.ts`, `components/ui/Icons.tsx`)
are the sanctioned exception — they must import the real package.

```tsx
// ❌ Direct library imports
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import { FiMenu } from "react-icons/fi"
import Link from "next/link"

// ✅ Through lib/ or Icons.tsx
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap"
import { Lenis } from "@/lib/lenis"
import { IconMenu } from "@/components/ui/Icons"
import { TransitionLink } from "@/components/ui/TransitionLink"
```

### Environment variables — only in config/
```tsx
// ❌ anywhere else
process.env.NEXT_PUBLIC_API_URL

// ✅ only in config/app.config.ts, then import the value
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
app/                    routes only — Server Components, no hooks, no refs
  [locale]/             when the project has i18n
components/
  layout/               Navbar, Footer, PageShell, Providers, PageLoader
  ui/                   primitives — Button, Modal, Dropdown, Icons, Toaster
  pages/[page]/         page sections — [Page]Client.tsx, [Page][Section].tsx
  <feature>/            optional, per feature area (admin/, dashboard/, …)
config/                 app.config.ts, i18n.config.ts — the ONLY place reading process.env
constants/              keys, hrefs, option lists, thresholds — never translated text
contexts/               React providers — always "use client"
hooks/                  use* — always "use client"
i18n/                   request.ts, routing.ts
lib/                    third-party barrels — gsap.ts, lenis.ts, store.ts, <client>/
locales/                translation JSON — NEVER "messages/"
public/assets/          images, videos, icons, fonts, email templates
services/               network / database / external API calls
styles/                 theme.css, base.css, animations.css, accessibility.css
types/                  shared TypeScript types
utils/                  pure helpers
  animations/           GSAP init functions — always "use client"
  api/                  route guards, escaping helpers

globals.css             project ROOT, never app/globals.css
proxy.ts                project ROOT, never middleware.ts
```

Audit any tree against this with:

```bash
python3 .claude/skills/check-project-structure/scripts/check_structure.py .
```

Invoke `/check-project-structure` when scaffolding, adding a folder, or unsure where a file belongs.

---

## Types — `types/` by default

Every type that more than one file could ever use lives in `types/`, in a kebab-case file
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
| `components/` | PascalCase | `PageLoader.tsx`, `HomeHero.tsx` |
| `contexts/` | PascalCase | `ScrollContext.tsx`, `AppReadyContext.tsx` |
| `hooks/` | `use` + camelCase | `usePageReady.ts`, `useScroll.ts` |
| `utils/`, `lib/`, `config/`, `services/`, `types/`, `constants/`, `i18n/` | kebab-case | `page-transitions.ts`, `app.config.ts`, `nav.ts` |

Full tree + a validator: `/check-project-structure` (run its `check_structure.py` to audit a tree).

```
✅ utils/animations/page-transitions.ts
✅ hooks/usePageReady.ts          ← hooks are the exception: camelCase with "use" prefix
✅ components/layout/PageShell.tsx
✅ lib/gsap.ts

❌ utils/animations/pageTransitions.ts
❌ components/layout/page-shell.tsx
```

Hooks (`hooks/`) use camelCase with the `use` prefix by React convention — that's the only exception.

---

## Provider Tree (Providers.tsx)

```tsx
// app/layout.tsx — Server Component
import { Providers } from "@/components/layout/Providers"
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body><Providers>{children}</Providers></body>
    </html>
  )
}

// components/layout/Providers.tsx — "use client"
<AppReadyProvider>
  <ScrollProvider>
    <TransitionProvider>
      <MotionPreferenceProvider>
        <PageLoader />
        <PageShell>{children}</PageShell>
        <Toaster />
        <LiveRegion />
      </MotionPreferenceProvider>
    </TransitionProvider>
  </ScrollProvider>
</AppReadyProvider>
```

---

## lib/ files

```ts
// lib/gsap.ts  "use client"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
gsap.registerPlugin(ScrollTrigger, useGSAP)
export { gsap, ScrollTrigger, useGSAP }

// lib/lenis.ts  "use client"
import Lenis from "lenis"
export { Lenis }

// lib/store.ts  "use client"
// All Zustand stores created and exported here.
```

**Zustand holds UI state only** (open panels, multi-step form progress, preferences). Server
data never goes into a store: it comes from Server Components or the server cache
(14-PERFORMANCE.md), and a client-side copy goes stale the moment the server changes.
