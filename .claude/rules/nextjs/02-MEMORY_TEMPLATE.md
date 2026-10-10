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

# MEMORY_TEMPLATE.md — Bootstrap Template for MEMORY.md

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
Values live in `styles/theme.css` — never copy hex or sizes here, they drift.
- Font(s): [FONT_NAME] — loaded via next/font/google — why: [reason]
- Palette intent: [what each colour is for, e.g. primary = actions, surface = cards]
- [other key decisions: radius, density, motion feel]

## Foundations (layout, contexts, lib — not every component)
- [ ] app/layout.tsx
- [ ] globals.css
- [ ] styles/theme.css
- [ ] styles/base.css
- [ ] styles/animations.css
- [ ] styles/accessibility.css
- [ ] components/layout/Providers.tsx
- [ ] components/layout/PageLoader.tsx
- [ ] components/layout/PageShell.tsx
- [ ] components/layout/Navbar.tsx
- [ ] components/layout/Footer.tsx
- [ ] contexts/AppReadyContext.tsx
- [ ] contexts/TransitionContext.tsx
- [ ] contexts/ScrollContext.tsx
- [ ] hooks/useAppReady.ts
- [ ] hooks/usePageReady.ts
- [ ] hooks/usePageTransition.ts
- [ ] lib/gsap.ts
- [ ] lib/lenis.ts
- [ ] utils/animations/page-transitions.ts
- [ ] components/ui/TransitionLink.tsx

## Opt-in components (only if this project asked for them — delete the rest)
- [ ] components/ui/ScrollToTop.tsx      — /add-scroll-to-top
- [ ] utils/animations/parallax.ts       — /add-parallax

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
