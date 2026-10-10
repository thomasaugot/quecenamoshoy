---
paths:
  - "src/**"
  - ".github/**"
  - "vite.config.*"
---

# MONITORING.md — Know Before the Client Does (Vite + React)

A section that crashes silently, a deploy that serves a blank page, a site that is down at
night: without monitoring, the client reports all of these. Every production project gets
the three pieces below.

---

## Error tracking — Sentry

`@sentry/react`, wired by hand. **Off unless `VITE_SENTRY_DSN` is set, and only in production
builds**, so dev, tests and CI never report.

```ts
// src/main.tsx — BEFORE createRoot, so errors during the first render are caught
import * as Sentry from "@sentry/react"

if (appConfig.sentryDsn && import.meta.env.PROD) {
  Sentry.init({
    dsn: appConfig.sentryDsn,
    environment: appConfig.siteUrl,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes,
      }),
    ],
  })
}

createRoot(root, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(<StrictMode><RouterProvider router={router} /></StrictMode>)
```

```ts
// src/app/router.tsx — route names in performance traces instead of raw URLs
const createRouter = Sentry.wrapCreateBrowserRouterV7(createBrowserRouter)
export const router = createRouter([...])
```

- `VITE_SENTRY_DSN` is public by design (a DSN only accepts events). It is read through
  `src/config/app.config.ts` like every env var, and set in the **host's build environment** —
  it is baked in at build time, so changing it needs a rebuild, not a restart.
- Never send personal data: `sendDefaultPii: false`, and no names, emails or free text in
  `extra`/breadcrumbs (11-SECURITY.md → Logging).
- `connect-src` in the CSP must allow the Sentry ingest host (11-SECURITY.md).


### Noise, alerts, releases — make every event worth reading

```ts
// in Sentry.init — events that are never our bug, and burn the free quota (~5k/month)
ignoreErrors: [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  "AbortError",                 // navigation cancelled a request
  "Non-Error promise rejection captured",
],
denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-(web-)?extension:\/\//],
```

- **Release = the commit SHA**, set at build, so every event says which deploy produced it
  and Sentry flags "new in this release" / "regressed in this release". `sentryVitePlugin({ release: { name: process.env.GIT_SHA } })` injects it into the
  bundle; the SDK picks it up — no `release` in `Sentry.init` by hand.
- **Alert rules, configured on day one** — nobody opens a dashboard on their own:
  new issue → email (or Slack) immediately; regression of a resolved issue → immediately;
  weekly digest of the top issues. An error tracker without alerts is a log nobody reads.
- Add a filter only for errors you have read and understood. Never ignore a whole category
  "to calm the noise" — that is how a real bug hides for months.

### Source maps — uploaded, never published

Without source maps every stack trace is minified noise. Published source maps hand your
source code to anyone. So: generate them hidden, upload them at build, delete them.

```ts
// vite.config.ts
import { sentryVitePlugin } from "@sentry/vite-plugin"

export default defineConfig({
  build: { sourcemap: "hidden" },          // generated, but no //# sourceMappingURL comment
  plugins: [
    react(), tailwindcss(),
    sentryVitePlugin({                    // LAST plugin; no-ops without the auth token
      org: "<org>", project: "<project>",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
    }),
  ],
})
```

- `SENTRY_AUTH_TOKEN` is a **build secret** (CI / host build env). Never `VITE_`-prefixed —
  that would put it in the bundle.
- After a build: `find dist -name "*.map"` must print nothing.

### Verify on the live site

In the console, `setTimeout(() => { throw new Error("Sentry test") })` — a bare `throw` in the
console is not captured. Check the issue shows readable file names and line numbers (source
maps worked), then resolve it.

---

## Stale tabs after a deploy — reload once, never a blank page

Every deploy renames the JS chunks (content hashes) and the old ones are gone. A visitor who
kept the app open clicks a lazy route, the browser asks for the OLD chunk, gets a 404, and the
page stays blank: `Failed to fetch dynamically imported module`. With lazy routes this
happens after EVERY deploy, to everyone with an open tab.

```ts
// src/main.tsx — one reload per 10 s at most, so a genuinely missing chunk cannot loop
window.addEventListener("vite:preloadError", (event) => {
  const key = "chunk-reload-at"
  const last = Number(sessionStorage.getItem(key) ?? 0)
  if (Date.now() - last < 10_000) return        // already tried: let RouteError show it
  event.preventDefault()                         // not a bug — do not report it
  sessionStorage.setItem(key, String(Date.now()))
  window.location.reload()
})
```

A reload fetches the new `index.html`, which points at the new chunks. Keep the old chunks
deployable for a while if the host allows it (some keep previous assets by default), but never
rely on it alone.

---

## Error boundaries report — they never swallow

A section `ErrorBoundary` that renders nothing on error hides the bug from everyone. It must
report:

```tsx
componentDidCatch(error: Error, info: React.ErrorInfo) {
  logger.error(`Error in ${this.props.section}`, error)
  Sentry.captureException(error, { tags: { section: this.props.section }, extra: { componentStack: info.componentStack } })
}
```

Plus, at the top of the tree:

- **`RouteError`** — the router's `errorElement` (04-CLIENT_SERVER.md) reports
  `useRouteError()` with `Sentry.captureException` in an effect.
- **`Sentry.ErrorBoundary`** around `<RouterProvider>` in `main.tsx`, with a short fallback in
  the site's language and a reload button — the last net for anything that breaks outside
  the routes (providers, the layout itself).

---

## Uptime — `.github/workflows/uptime.yml`

Every 10 minutes, `curl` the homepage (3 attempts, 20 s apart). A failed run emails whoever
last edited the schedule. `SITE_URL` comes from a repository variable with the production URL
as default. This pings production read-only — it is the one standing exception, agreed when
the workflow is added.

**A SPA can be "up" and blank.** The host serves a perfect `index.html` while its JS bundle
404s (a half-finished deploy, a purged asset) — the visitor gets an empty page and a naive
check stays green. So the check asserts three things:

```bash
html=$(curl -fsS "$SITE_URL")
echo "$html" | grep -q "<title>[^<]*$BRAND"                        # 1. the right page
js=$(echo "$html" | grep -oE '/assets/index-[^"]+\.js' | head -1)
curl -fsS -o /dev/null "$SITE_URL$js"                             # 2. its bundle loads
[ -z "$HEALTH_URL" ] || curl -fsS -o /dev/null "$HEALTH_URL"      # 3. the backend answers (if any)
```

---

## Backups

Confirm the project's data (database, storage, CMS dataset) is backed up and where — and on a
free tier, check whether backups are included at all; if not, schedule a dump. Don't add a
second backup job if one already runs elsewhere — a redundant job that fails weekly is noise.

---

## Before calling a deploy done

- [ ] DSN in the host's build env, test error received with readable stack, test issue resolved
- [ ] No `.map` file in the deployed `dist/`
- [ ] Error boundaries and `RouteError` report to Sentry
- [ ] Uptime workflow green on its first manual run
- [ ] Backups confirmed (not necessarily added)
