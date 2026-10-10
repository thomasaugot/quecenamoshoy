---
paths:
  - "src/**"
  - "scripts/**"
  - "vite.config.*"
  - "index.html"
---

# SEO.md — SEO, Metadata & Media (Vite + React)

No SEO library (no react-helmet). React 19 renders `<title>` / `<meta>` / `<link>` from any
component and hoists them into `<head>`; a build script covers what bots need.

---

## First: is the app public?

| App | What to do |
|---|---|
| **Private** (everything behind a login) | `<meta name="robots" content="noindex, nofollow">` in `index.html`, `robots.txt` = `Disallow: /`, no sitemap, no JSON-LD, no prerendered heads. Skip the rest of this file except **Media** and **Email templates**. |
| **Public app / tool** (pages anyone can open, value is the interaction) | Everything below: prerendered heads. |
| **Content site** (blog, marketing, editorial — ranking and AI answers matter) | Head-only is NOT enough: AI crawlers (GPTBot, ClaudeBot, PerplexityBot) and several search engines never run JavaScript and see an empty `<body>`. Prerender the FULL page at build (React Router framework-mode `prerender`, or `renderToString` per route in the same script) — or build that project on Next instead. Decide before the first page, not after launch. |

---

## The SPA problem — every URL serves the same `index.html`

Without help, `/about`, `/en/about` and `/` all return the same HTML: same `<title>`, same
description, no canonical, no hreflang. Google renders JavaScript (late, eventually); link
previews (WhatsApp, Slack, LinkedIn, X, iMessage) and most other crawlers **never** do — so
every shared link shows the home page's title and image.

**Fix: prerender the `<head>` at build time.** A script writes one HTML file per route ×
locale, with the right head. The `<body>` stays the normal React app.

```json
// package.json
"build": "tsc -b && vite build && tsx scripts/prerender-heads.ts"
```

```ts
// scripts/prerender-heads.ts — runs in Node after vite build
// For every routeKey × locale (from config/i18n.config.ts):
//   1. read dist/index.html (the built template)
//   2. replace the <!--app-head--> placeholder with, from src/locales/<locale>/<page>.json → meta:
//        <title>, <meta name="description">, <link rel="canonical">,
//        one <link rel="alternate" hreflang> per locale + hreflang="x-default",
//        Open Graph + Twitter tags (og:locale per language: es_ES, en_GB…),
//          og:image = ABSOLUTE URL, 1200×630 — the page's own image or the site default,
//          with og:image:width/height/alt; twitter:card = summary_large_image,
//        the localised JSON-LD (see "Schema type")
//      every tag carries data-prerendered
//   3. write dist/<localizedPath>/index.html  (e.g. dist/en/about/index.html)
// Then write dist/sitemap.xml and dist/robots.txt (below).
```

```html
<!-- index.html <head> -->
<!--app-head-->
```

```ts
// src/main.tsx — before render: drop ONLY the tags PageMeta re-renders
document.querySelectorAll('title[data-prerendered], meta[name="description"][data-prerendered]')
  .forEach((node) => node.remove())
```

Canonical, hreflang, Open Graph and JSON-LD **stay**. Google indexes the page *after* running
its JavaScript: if the app removed them, the rendered page would have no canonical and no
hreflang, contradicting the raw HTML. They are correct for the URL that was loaded, and bots
never navigate client-side, so they never go stale for a bot.

- Hosts serve `dist/en/about/index.html` for `/en/about` automatically, and fall back to
  `index.html` for anything else (SPA fallback, 01-BOOTSTRAP.md).
- URLs come from the SAME `localizedPath()` the app uses (09-I18N.md), with
  `SITE_URL` read from the build environment — never hardcoded, never `localhost`.
- The script fails the build if a route × locale has no `meta.title` / `meta.description`, or
  if its `og:image` file does not exist in `dist/`.
- **One URL form, the one the host serves WITHOUT a redirect.** Some hosts redirect
  `/en/about` → `/en/about/` when the file is `en/about/index.html`; others serve
  `en/about.html` at `/en/about`. Canonical, hreflang, sitemap and every internal link must use
  the final form exactly, or Google sees two URLs per page. After the first deploy:
  ```bash
  for u in / /en /en/about; do curl -sI "https://example.com$u" | head -1; done   # all 200, no 301/308
  ```

### Verify after every build

```bash
for f in $(find dist -name index.html); do
  echo "-- $f"; grep -oE '<title>[^<]*|rel="canonical"[^>]*|hreflang="[^"]*"' "$f"
done
```

Expect on every file: its own title, a canonical pointing at ITSELF, one `alternate` per
locale and exactly one `x-default`.

---

## Page metadata inside the app — `PageMeta`

While browsing, the title must follow the page (tabs, history, the route announcer in
08-ACCESSIBILITY.md reads `document.title`).

```tsx
// src/components/layout/PageMeta.tsx — rendered by every page controller
export const PageMeta = ({ routeKey }: { routeKey: RouteKey }) => {
  const t = useTranslations(`${routeKey}.meta`)
  return (
    <>
      <title>{t("title")}</title>
      <meta name="description" content={t("description")} />
    </>
  )
}
```

The SAME `meta.title` / `meta.description` keys feed the build script and `PageMeta`, so the
prerendered head and the live head never disagree.

---

## sitemap.xml and robots.txt — generated at build

Written by `scripts/prerender-heads.ts` from the route table, never by hand:

```xml
<!-- one <url> per route × locale, each listing every alternate + x-default -->
<url>
  <loc>https://example.com/en/about</loc>
  <xhtml:link rel="alternate" hreflang="es" href="https://example.com/sobre-nosotros"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://example.com/en/about"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/sobre-nosotros"/>
</url>
```

```
# robots.txt — production build only; preview/staging builds write Disallow: /
User-agent: *
Allow: /
User-agent: AhrefsBot
User-agent: SemrushBot
Disallow: /
Sitemap: https://example.com/sitemap.xml
```

`x-default` is required, not optional: it tells Google which page to serve a visitor whose
language matches no locale. It points at the default locale's URL.

---

## Schema type — pick the specific one

`Organization` is the fallback, not the default. Use the most specific type available:
`SportsEvent` for a competition, `Event` for a conference, `LocalBusiness` for a physical
business, `Product` for a shop. A specific type can surface dates, venue and competitors as
rich results; `Organization` cannot.

**On an i18n project the schema MUST be localised** — built by the script from each locale's
strings, never one hardcoded description for every language.

```ts
// src/constants/schema.ts — structure only, no copy
export const buildSportsEventSchema = (description: string) => ({
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  description,
  // …
}) as const
```

Serialize with `serializeJsonLd()` (escapes `</script`), never bare `JSON.stringify`
(11-SECURITY.md).

---

## Images

No `next/image` — so the browser gets no free optimisation. Every `<img>`:

```tsx
// first visible image of the page
<img src="/assets/images/home/hero.webp" alt="…" width={1600} height={900}
     fetchPriority="high" decoding="async" />

// everything below the first screen
<img src="…" alt="…" width={800} height={600} loading="lazy" decoding="async" />
```

- `width` and `height` ALWAYS — without them the page jumps as images load (CLS).
- WebP/AVIF, sized for their largest display size (×2 for retina), never a 4000px original.
- `srcSet` + `sizes` when the same image shows at very different widths.
- User-uploaded images are resized/converted before storage, never served as uploaded.

```ts
// src/utils/preload-images.ts — call once from the home page controller
export function preloadImages(): void {
  const paths = ["/assets/images/home/hero.webp", ...]
  const run = () => paths.forEach(src => { const img = new window.Image(); img.src = src })
  "requestIdleCallback" in window ? requestIdleCallback(run) : setTimeout(run, 2000)
}
```

---

## Media weight — videos and SVGs

The heaviest page we shipped downloaded ~100 MB on load. These are the causes:

- **One video per breakpoint, only the matching one rendered.** `useBreakpoint()` returns the
  real value on the first render in Vite (05-ANIMATIONS.md), so render exactly one `<video>`
  — never all of them hidden with CSS, which downloads every one.
- **Encode for the web**: `ffmpeg -i in.mp4 -vf "scale=1920:-2" -c:v libx264 -preset slow
  -crf 26 -pix_fmt yuv420p -an -movflags +faststart out.mp4`. Background/hero videos: ≤1080p
  (vertical 1080×1920), no audio track (`-an`), `faststart`. Aim for ≤10 MB. Compare a frame
  before and after; never replace a video the client chose without asking.
- **No raster images wrapped in SVG.** An `.svg` that is a `data:image/png` inside an `<svg>`
  ships at full weight (1–2 MB each). Render it to WebP at the same size (~30–40 KB).
- **Delete unreferenced assets** in `public/` — they bloat the deploy.
- **Every fallback/placeholder asset path must exist.** A missing one is a 404 the smoke
  test's failed-request check catches.

---

## Public Assets Structure

```
public/
  favicon.ico
  assets/images/common/, [page-name]/
  assets/videos/
  assets/icons/
  assets/fonts/  (.woff2 only — if not using @fontsource)
  assets/email/  (transactional email templates — see below)
```

Nothing at `public/` root except `favicon.ico`, manifest icons, and host config files
(`_headers`, `_redirects`) when the host needs them.

---

## Transactional email templates — TWO copies, always in sync

Every email template (magic link, invite, password reset, notification) is written
**once and saved twice**:

```
<provider>/email-templates/<name>.html  ← the source pasted into the email provider
public/assets/email/<name>.html         ← the same file, viewable in a browser
```

**Why both.** The provider copy is what actually gets sent. The `public/` copy is how anyone
reviews it: an email template is the one piece of UI you cannot open in the app. Serving it at
`/assets/email/<name>.html` makes design review a URL, not a round-trip through a live mailbox.

**When you add or edit ANY email template, write both files in the same change.**

```bash
diff public/assets/email/<name>.html <provider>/email-templates/<name>.html
```

### Writing rules for the template itself

- Table layout and inline styles only. Gmail, Outlook and Apple Mail strip `<style>` blocks
  and ignore flexbox.
- Brand colours hardcoded as hex — an email cannot read CSS custom properties. This is the one
  place the "no hardcoded hex" rule does not apply.
- Buttons are a `<table>`, never a styled `<a>` — Outlook will not render padding on an anchor.
- Keep the provider's placeholder name exactly (e.g. `{{ .ConfirmationURL }}`).
- Always include the raw URL as copyable text under the button.
- Each provider template is SEPARATE: styling "Invite user" does nothing to "Magic Link".
