---
name: write-and-run-tests
description: "How this stack is tested: Vitest for unit tests, Playwright (Node, already a devDependency) for E2E and for looking at a running app. Invoke when asked to write, run, set up or debug tests, add a test runner, check something works in the real browser, screenshot a page, or read console errors from the app. Covers what is worth testing here and what is not."
---

# Testing

Two tools, two jobs. Never Python — Playwright is already a Node devDependency.

| Job | Tool | Committed? |
|---|---|---|
| Pure logic: thresholds, dates, parsing | **Vitest** | yes, `tests/` |
| Real browser: does the page work | **Playwright** | yes, `e2e/` |
| "Let me look at the app" | Playwright, throwaway script | no, delete after |

## What is worth testing here

These projects are mostly presentational. Do not chase coverage.

**Test:**
- Pure business logic with real thresholds (e.g. "does the competition run today?")
- Date and timezone maths
- Parsing a third-party API response shape
- Anything where being wrong is expensive and silent

**Do not test:**
- Components, styling, animation, anything that is mostly JSX
- Context providers, hooks that only wire GSAP or Lenis
- Snapshot tests of markup — they break on every design tweak and prove nothing

## Vitest — unit

Use Vitest, not Jest. It reads the existing `tsconfig` paths (`@/`) with almost no config;
Jest needs `next/jest`, a transform, and `moduleNameMapper`.

```bash
npm i -D vitest vite-tsconfig-paths
# add @vitejs/plugin-react + jsdom ONLY if a test ever needs to render a component
```

```ts
// vitest.config.ts — verified working 2026-08-22
import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
})
```

`vite-tsconfig-paths` is what makes `@/` imports resolve in tests. Without it every
import fails and the usual "fix" is a wrong `alias` block in the config.

```jsonc
// package.json
"scripts": { "test": "vitest run", "test:watch": "vitest" }
```

`tests/` mirrors the source path:
`services/conditions/evaluate.ts` → `tests/services/conditions/evaluate.test.ts`

Use `environment: "node"` unless a test needs the DOM. It is much faster, and nothing
worth testing here needs a DOM.

## Playwright — E2E

Already installed. It needs a config, not an install.

**Never point E2E at Thomas's dev server** (`reuseExistingServer` against `npm run dev`): it
can read production data, and starting a second `next dev` in the same folder collides with
his. Playwright starts its **own** server — own port, own build folder, mock/fallback data —
and a global setup refuses to run if that server serves real data.

```ts
// next.config.ts — separate build folder so the test server never touches .next
distDir: process.env.NEXT_DIST_DIR ?? ".next",

// playwright.config.ts
const PORT = 3100
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `next dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    env: { NEXT_DIST_DIR: ".next-e2e", USE_REAL_DATA: "false" /* the project's mock/fallback switch */ },
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [/* see 12-TESTING_CI.md: Chrome sizes + Safari engine on Apple sizes */],
})
```

```ts
// e2e/global-setup.ts — the page marks its data source, e.g. <html data-content-source="fallback">
export default async function globalSetup(config: FullConfig) {
  const html = await (await fetch(config.projects[0].use.baseURL!)).text()
  if (!html.includes('data-content-source="fallback"')) throw new Error("Refusing to run against real data")
}
```

Add `.next-e2e/`, `test-results/` and `playwright-report/` to `.gitignore` and the ESLint ignores.

What to cover — the full contract is in `.claude/rules/<stack>/12-TESTING_CI.md` (`nextjs/` or `vite/`):
- every route: 200, loader finishes, no console errors or failed requests, one `<h1>`
- every route: no serious/critical axe violations
- forms: submit with the API intercepted (`page.route`) — never a real send
- the language switcher actually changes language (not just the URL — see 09-I18N)
- the mobile nav opens, traps focus, and closes on Escape

## Looking at the app (no test file)

For "does this actually work / what does it look like / any console errors" — write a
throwaway script at the project ROOT (module resolution needs `node_modules` above it),
run it, then delete it.

```js
// .probe.mjs — delete after running
import { chromium } from "playwright"
const b = await chromium.launch()
const p = await b.newPage()
p.on("console", (m) => m.type() === "error" && console.log("ERR:", m.text()))
await p.goto("http://localhost:3000/es", { waitUntil: "networkidle" })
console.log(await p.title())
await p.screenshot({ path: "/tmp/probe.png", fullPage: true })
await b.close()
```

```bash
node ./.probe.mjs && rm .probe.mjs
```

### Two traps

**Entrance animations.** Elements are `invisible` until GSAP reveals them, so reading text
immediately after `networkidle` can return empty. Wait for the element to be visible, or
wait out the loader, before asserting on content.

**Stale `.next`.** Metadata and prerendered routes are cached. An edit to `generateMetadata`
or a route can appear to do nothing. Before concluding the code is wrong:

```bash
pkill -f next; rm -rf .next node_modules/.cache && npm run dev
```

## Rules

- Playwright is a **devDependency already** — never install a second copy, never use Python.
- Probe scripts live at the project root and are deleted after use; never commit one.
- A test that needs the app running uses Playwright's `webServer`, not a hand-rolled spawn.
- `npx tsc --noEmit` and `npm run lint` are not tests, but they gate every change anyway.
