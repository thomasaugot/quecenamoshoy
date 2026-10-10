---
paths:
  - "src/**"
  - "vite.config.*"
  - "index.html"
---

# MEMORY_TEMPLATE.md — Bootstrap Template for MEMORY.md (Vite + React)

Create `MEMORY.md` at the project root with this structure, filled in from the brief:

```markdown
# [PROJECT_NAME] Memory

## Project
- Name: [PROJECT_NAME]
- Domain: [DOMAIN]
- Default locale: [DEFAULT_LOCALE]
- Locales: [LOCALES]
- i18n enabled: yes/no

## Routes (canonical slugs in default language)
- / — home
- [list every route]

## Design System
Values live in `src/styles/theme.css` — never copy hex or sizes here, they drift.
- Font(s): [FONT_NAME] — loaded via [@fontsource / self-hosted woff2] — why: [reason]
- Palette intent: [what each colour is for, e.g. primary = actions, surface = cards]
- [other key decisions: radius, density, motion feel]

## Foundations (layout, contexts, lib — not every component)
- [ ] src/main.tsx
- [ ] src/App.tsx (router)
- [ ] src/config/app.config.ts
- [ ] src/vite-env.d.ts
- [ ] src/globals.css
- [ ] src/styles/theme.css
- [ ] src/styles/base.css
- [ ] src/styles/animations.css
- [ ] src/styles/accessibility.css
- [ ] src/components/layout/Providers.tsx
- [ ] src/components/layout/PageLoader.tsx
- [ ] src/components/layout/PageShell.tsx
- [ ] src/components/layout/Navbar.tsx
- [ ] src/components/layout/Footer.tsx
- [ ] src/contexts/AppReadyContext.tsx
- [ ] src/contexts/TransitionContext.tsx
- [ ] src/contexts/ScrollContext.tsx
- [ ] src/hooks/useAppReady.ts
- [ ] src/hooks/usePageReady.ts
- [ ] src/hooks/usePageTransition.ts
- [ ] src/lib/gsap.ts
- [ ] src/lib/lenis.ts
- [ ] src/utils/animations/page-transitions.ts
- [ ] src/components/ui/TransitionLink.tsx

## Opt-in components (only if this project asked for them — delete the rest)
- [ ] src/components/ui/ScrollToTop.tsx      — /add-scroll-to-top
- [ ] src/utils/animations/parallax.ts       — /add-parallax

## Session Log
- [DATE] — Bootstrapped project
- [DATE] — [what was done]

## Decisions
- [DATE] — [decision] — why: [reason]

## Deviations from spec
- [list any intentional brief-driven deviations here]

## Known issues / TODO
- [list unresolved issues]
```

---

## Rules for maintaining MEMORY.md

- Check off foundation files as they are written and pass the checklist.
- Add an entry to Session Log at the END of every session, saying what was done. Keep only
  the last ~10 entries; git holds the rest.
- Document every deviation from the spec in the Deviations section.
- Record every decision that answers an open question in Decisions, with the reason.
- When resuming, read MEMORY.md first to know what is done and what remains.
