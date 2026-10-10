---
paths:
  - "src/**"
  - "vite.config.*"
  - "index.html"
---

# STACK.md — Vite specifics for the working style

## Stack

Vite + React · React Router · Zustand · vite-plugin-pwa when it is an installable app · strings
in `src/locales/`. The shared defaults are in `00-WORKING-STYLE.md`.

## Verify

```bash
npx tsc -b
npm run lint
```

Never `npx tsc --noEmit`: the root `tsconfig.json` has `files: []` and only references
`tsconfig.app.json` / `tsconfig.node.json`, so it checks nothing and always passes.

## Preview pages

Plain route, e.g. `/zzloader` (dev server port defaults to 5173, still check with `lsof`).
Register it only in development, so it is not even in the production bundle:

```tsx
...(import.meta.env.DEV ? [{ path: "/zzloader", element: <ZzLoader /> }] : [])
```
