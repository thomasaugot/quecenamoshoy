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

# MONITORING.md — Know Before the Client Does

A section that crashes silently, a container that can't write its cache, a site that is down
at night: without monitoring, the client reports all of these. Every production project gets
the three pieces below.

---

## Error tracking — Sentry

`@sentry/nextjs`, wired manually (no wizard, no `withSentryConfig` — it rewrites the build).
**Off unless `NEXT_PUBLIC_SENTRY_DSN` is set, and only in production**, so dev and CI never
report.

```ts
// instrumentation.ts
import * as Sentry from "@sentry/nextjs"
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
export async function register() {
  if (!dsn || process.env.NODE_ENV !== "production") return
  Sentry.init({ dsn, tracesSampleRate: 0.1, environment: process.env.NEXT_PUBLIC_SITE_URL })
}
export const onRequestError = Sentry.captureRequestError

// instrumentation-client.ts — same init guard for the browser
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
```

- `NEXT_PUBLIC_SENTRY_DSN` is baked in at build time: add it to the Dockerfile `ARG`/`ENV`
  **and** to the compose file's `build.args`, then rebuild (a restart is not enough).
- Read the DSN through `config/` like every env var (04-CLIENT_SERVER.md).
- Verify on the live site: in the console, `setTimeout(() => { throw new Error("Sentry test") })`
  — a bare `throw` in the console is not captured. Resolve the test issue afterwards.

## Noise, alerts, releases — make every event worth reading

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
  and Sentry flags "new in this release" / "regressed in this release". Pass it as a build arg (`GIT_SHA`) → `release` in both `Sentry.init` calls, and upload
  source maps for that release.
- **Alert rules, configured on day one** — nobody opens a dashboard on their own:
  new issue → email (or Slack) immediately; regression of a resolved issue → immediately;
  weekly digest of the top issues. An error tracker without alerts is a log nobody reads.
- Add a filter only for errors you have read and understood. Never ignore a whole category
  "to calm the noise" — that is how a real bug hides for months.

## Error boundaries report — they never swallow

A section `ErrorBoundary` that renders nothing on error hides the bug from everyone. It must
report:

```tsx
componentDidCatch(error: Error, info: React.ErrorInfo) {
  logger.error(`Error in ${this.props.section}`, error)
  Sentry.captureException(error, { tags: { section: this.props.section }, extra: { componentStack: info.componentStack } })
}
```

Plus `app/global-error.tsx` (client component, its own `<html>`/`<body>`) calling
`Sentry.captureException(error)` in an effect, with a short message in the site's language.

## Uptime — `.github/workflows/uptime.yml`

Every 10 minutes, `curl` the homepage (3 attempts, 20 s apart) and check it contains the brand
name. A failed run emails whoever last edited the schedule. `SITE_URL` comes from a repository
variable with the production URL as default. This pings production read-only — it is the one
standing exception, agreed when the workflow is added.

## Backups

Confirm the project's data (CMS dataset, database) is backed up and where. Don't add a second
backup job if one already runs elsewhere — a redundant job that fails weekly is noise.

---

## Before calling a deploy done

- [ ] DSN in the build args, test error received, test issue resolved
- [ ] Error boundaries report to Sentry
- [ ] Uptime workflow green on its first manual run
- [ ] Backups confirmed (not necessarily added)
