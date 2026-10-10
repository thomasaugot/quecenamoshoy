---
paths:
  - "src/**"
  - "e2e/**"
  - ".github/**"
  - "vite.config.*"
  - "playwright.config.*"
---

# TESTING_CI.md — Tests, CI and Deploy Gating (Vite + React)

Every rule here comes from a bug a client found before we did. Load the `write-and-run-tests`
skill for the Vitest/Playwright setup; this file is the contract.

---

## Never against real data, never against Thomas's dev server

- E2E runs on its **own** Vite server: `vite --mode test --port <free port> --strictPort`,
  started by Playwright's `webServer`. `.env.test` points at the LOCAL backend or mocks. Never
  `reuseExistingServer` against `npm run dev`. Never `npm run build` locally (CI may).
- A global setup **aborts** if the configured backend URL is not a local/test one — before a
  single test runs. Same check in `vitest.setup.ts`.
- External services are **mocked**: email, AI providers, payment, the database API. In E2E,
  `page.route("**/functions/v1/**", …)` / `page.route("**/rest/v1/**", …)` — a test never sends a
  real email, calls a paid API, or writes a real record.

---

## Test data — reset and seed before every run

- E2E and backend tests start from a known state: reset the LOCAL database and apply a fixed
  seed before the run (e.g. `supabase db reset` runs migrations + `seed.sql`). Never run
  against whatever the last run left behind.
- Every test creates the records it needs (named `TEST - <what> <date>`) and never depends on
  another test's records or on test order. Two tests touching the same record = a flaky pair.

---

## Flaky tests — wait for a state, never for time

- `page.waitForTimeout(…)` / `sleep` is **banned**. Wait for what the user would see:
  `expect(locator).toBeVisible()`, `waitForResponse`, `window.__loadingComplete`.
- `retries: process.env.CI ? 2 : 0`, `trace: "on-first-retry"`. A test that only passes on a
  retry is a bug to fix (read the trace), never a pass to ignore.

---

## Unit tests (Vitest) — what is worth it

| Test | Why |
|---|---|
| Every backend function: valid call, no token (401), bad token, another user's id ignored, each rejection (400/404/429), honeypot, rate limit, upstream failure, missing secret | Their URL is in the public bundle — anyone can call them |
| Database access rules (RLS): per table, anonymous and user B are refused, user A allowed — on the LOCAL stack | When the browser talks to the database, these rules are the only guard (11-SECURITY.md) |
| Locale parity: every language has every key (09-I18N.md) | A missing key is otherwise found by a visitor |
| Every CMS schema `preview` (`select` → `prepare`) returns **string** titles/subtitles (if a CMS is used) | Studio calls string methods on them: a number crashes the whole field editor |
| HTML escaping of every value interpolated into an email | Free text lands in staff inboxes as trusted mail |
| Pure business logic, dates, parsing | See the skill |

Mock the module, not the network: `vi.mock("@/services/…", …)`, the email/AI SDK module.
Give each test its own client IP so rate-limit counters don't leak between tests. Prove a test catches the bug once: reintroduce it, see red, restore.

---

## E2E smoke — every route, every device

Keep the route list in **one** shared file (`e2e/routes.ts`) with the shared `waitForPageReady`.
For every route:

```ts
page.on("pageerror", …)                       // uncaught errors
page.on("response", r => r.status() >= 400 && …) // failed requests: missing assets, broken fallbacks
page.on("console", m => error/warning && …)   // ignore only the project's own debug prefixes
expect(response.status()).toBeLessThan(400)
await page.waitForFunction(() => window.__loadingComplete === true)  // a loader that never finishes fails here
expect(problems).toEqual([])
await expect(page.locator("h1")).toHaveCount(1)
```

Plus, once per run: an unknown URL renders the 404 page (not a blank screen), a deep route
opened directly (not via a click) renders, back/forward restores the scroll position,
switching breakpoints does not reload the page, and with i18n every route × locale renders.

**Security headers and CSP are tested against the deployed PREVIEW URL** (never production):
the Vite dev server does not read `public/_headers`. Assert every header, and zero CSP
violations in the console on every route.

Pre-set the cookie consent in `addInitScript` for tests that click near the bottom of the
page — the banner covers submit buttons.

---

## Accessibility (axe)

`@axe-core/playwright`, tags `wcag2a/2aa/21a/21aa/22aa`, fail on **serious and critical**. Wait
for entrance fades to finish before analysing (axe reads half-faded text as low contrast).
Run it in Chromium only — results don't depend on the engine. An exclusion needs a comment
naming the design decision it waits on; fix the colour token instead whenever possible.

---

## Devices — Safari is not optional

Layout bugs get reported from iPads and iPhones. Chromium at the same width is not Safari.

```ts
projects: [
  { name: "mobile",  use: { ...devices["Desktop Chrome"], viewport: { width: 390,  height: 844 } } },
  { name: "tablet",  use: { ...devices["Desktop Chrome"], viewport: { width: 768,  height: 1024 } } },
  { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  { name: "iphone",             use: { ...devices["iPhone 15"] } },
  { name: "ipad-mini",          use: { ...devices["iPad Mini"] } },
  { name: "ipad-pro-landscape", use: { ...devices["iPad Pro 11 landscape"] } },
  { name: "ipad-13-landscape",  use: { ...devices["iPad Pro 11 landscape"], viewport: { width: 1376, height: 1032 } } },
]
```

**CI must install every browser the config uses** — `npx playwright install --with-deps
chromium webkit`. Adding a WebKit project without it fails every Safari test on CI with
"Executable doesn't exist" and blocks the deploy.

**Which devices when.** All seven on every push makes CI slow enough that people stop waiting
for it. Pull requests: `mobile` + `desktop` (Chromium) + `iphone` (WebKit). Push to `main`
(the run that gates the deploy): all seven.

---

## Visual regression — local only

Full-page `toHaveScreenshot` per route and device, tagged `@visual`, run with
`npm run test:visual`. Scroll through the page first so scroll-triggered entrances have
played, mask videos and auto-rotating content, `animations: "disabled"`,
`maxDiffPixelRatio: 0.01`. Baselines are rendered on macOS, so they **never run in CI**
(Linux fonts differ): `test:e2e` uses `--grep-invert @visual`. After an intended design
change: `npm run test:visual -- --update-snapshots`, then run once more to prove stability.

---

## Scripts

```json
"test": "vitest run",
"test:e2e": "playwright test --grep-invert @visual",
"test:visual": "playwright test --grep @visual"
```

---

## CI — `.github/workflows/ci.yml`

On every push and PR:

| Job | Steps | Blocks deploy? |
|---|---|---|
| checks | `npm ci` → `npm run lint` → `npx tsc -b` → `npm test` → `vite build --mode test` → `npm run size` | yes |
| backend | typecheck + lint the backend functions (`deno check` / `deno lint` for Deno functions, or their own tsconfig) → start the local backend (e.g. `supabase start`) → `db reset` + seed → RLS + function tests | yes |
| e2e | install chromium + webkit → `npm run test:e2e`, upload the report on failure | yes |
| lighthouse | `vite build --mode test` → `vite preview` → `@lhci/cli autorun`, report as artifact, `continue-on-error: true` | **no** — scores vary run to run |

Backend functions usually sit OUTSIDE `tsc -b` (another runtime, another tsconfig): without
their own typecheck in CI, a typo there reaches production untouched.

Lint must be **zero errors**: an existing error backlog means CI can never go green, so clear
it before turning CI on (several will be real bugs — conditional hooks, cascading setState).

## Deploys wait for CI

```yaml
# deploy.yml
on:
  workflow_run: { workflows: [CI], types: [completed], branches: [main] }
  workflow_dispatch:
jobs:
  deploy:
    if: github.event_name == 'workflow_dispatch' || (github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push')
```

The deploy job builds and uploads itself (e.g. `wrangler pages deploy dist`, `netlify deploy
--prod`, `vercel deploy --prod`) with a host token stored as a repository secret.

**Turn OFF the host's automatic deploy on push.** Cloudflare Pages, Netlify and Vercel all
deploy every push by default, straight from their own Git integration — CI is then a
spectator, and a red build is already live. Disable "automatic production deployments" in the
host's settings (keep preview deploys for PRs if wanted) so the workflow above is the only path
to production.

A failed CI run means nothing deploys — including the commits before it. Say so when
reporting a red run.

---

## Before calling it done

- [ ] `npm run lint` and `npx tsc -b` clean
- [ ] `npm test` and `npm run test:e2e` green locally
- [ ] Visual baselines updated if the design changed, and stable on a second run
- [ ] New route added to `e2e/routes.ts`; new browser engine added to the CI install step
