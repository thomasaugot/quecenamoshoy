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

# STACK.md — Next.js specifics for the working style

## Stack

Next.js App Router · next-intl when the project has i18n. The shared defaults are in
`00-WORKING-STYLE.md`.

## Verify

```bash
npx tsc --noEmit
npm run lint
```

## Preview pages

Locale-prefixed route, e.g. `/es/zzloader`. Guard it so production answers 404:

```tsx
if (!appConfig.isDev) notFound()
```
