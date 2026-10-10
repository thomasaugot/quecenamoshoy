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

# SEO.md — SEO & Metadata

All SEO via the Next.js Metadata API. No manual `<head>` tags. No external SEO packages.

---

## Root Metadata (app/layout.tsx)

```ts
export const metadata: Metadata = {
  metadataBase: new URL(appConfig.siteUrl),
  title: { default: "Your Business | Service", template: "%s | Your Business" },
  description: "Compelling description under 160 characters.",
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website", locale: "en_US",
    url: appConfig.siteUrl, title: "Your Business", description: "OG description",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "..." }],
    siteName: "Your Business",
  },
  twitter: { card: "summary_large_image", title: "Your Business",
             description: "Twitter description", images: ["/og-image.jpg"] },
  alternates: { canonical: appConfig.siteUrl },
}
```

---

## utils/seo.ts — Page Metadata Helper

```ts
export function generatePageMetadata({ title, description, keywords = [],
  canonical, images = ["/og-image.jpg"], type = "website" }: SEOProps): Metadata {
  return {
    title, description,
    openGraph: { title, description, type,
      images: images.map(url => ({ url, width: 1200, height: 630, alt: title })) },
    twitter: { card: "summary_large_image", title, description, images: [images[0]] },
    alternates: canonical ? { canonical } : undefined,
  }
}
```

Use `generatePageMetadata` as the default helper for all page-level metadata.

---

## ⚠️ Debugging robots.txt / sitemap.xml 404s — READ FIRST

If `/robots.txt` or `/sitemap.xml` returns **404 with `Content-Type: text/html`**, check the
response headers before changing any code:

```bash
curl -s -D - -o /dev/null http://localhost:3000/robots.txt | head -5
# x-nextjs-cache: HIT  +  x-nextjs-prerender: 1  ->  STALE CACHE, not a routing bug
```

**`rm -rf .next` alone is not always enough.** Clear both and rebuild:

```bash
pkill -f "next"; rm -rf .next node_modules/.cache && npm run build && npm run start
```

**Verify in dev first** (`npm run dev`) — the dev server does not prerender, so a 200 there
proves the route handler is correct and the production 404 is purely a cache artefact.

Things that are **NOT** the cause (do not "fix" these):
- ❌ The proxy matcher — `app/robots.ts` is a metadata route, resolved before the proxy matters
- ❌ Moving `robots.ts`/`sitemap.ts` inside `app/[locale]/` — this produces `/-/sitemap.xml`
- ❌ Wrapping `[locale]` in a route group
- ❌ `export const dynamicParams = false`

`app/robots.ts` and `app/sitemap.ts` stay at the **app root**, siblings of `[locale]`. That is correct
and works.

---

## app/sitemap.ts

```ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appConfig.siteUrl
  const staticPages = [
    { url: base, priority: 1.0, changeFrequency: "weekly" },
    { url: `${base}/about`, priority: 0.9, changeFrequency: "monthly" },
  ].map(p => ({ ...p, lastModified: new Date() }))

  try {
    const posts = await fetchPosts()
    return [...staticPages, ...posts.map(p => ({
      url: `${base}/blog/${p.slug}`, lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly", priority: 0.6,
    }))]
  } catch { return staticPages }
}
```

---

## app/robots.ts

```ts
export default function robots(): MetadataRoute.Robots {
  const base = appConfig.siteUrl
  const isProd = process.env.NODE_ENV === "production"
  if (!isProd) return { rules: { userAgent: "*", disallow: "/" } }
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/_next/", "/private/"] },
      { userAgent: "Googlebot", allow: "/", disallow: ["/api/", "/admin/", "/_next/"] },
      { userAgent: ["AhrefsBot", "SemrushBot"], disallow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`, host: base,
  }
}
```

Note: `process.env.NODE_ENV` is allowed here — it's a build-time constant, not an env variable.

---

## i18n projects — sitemap and alternates

With `app/[locale]/`, the sitemap must emit one entry per locale plus `alternates.languages`
so search engines pair the translations:

```ts
export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.flatMap((route) =>
    locales.map((locale) => ({
      url: urlFor(locale, route.path),
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: Object.fromEntries(locales.map((alt) => [alt, urlFor(alt, route.path)])),
      },
    }))
  )
}
```

Mirror the same `alternates.languages` in `generateMetadata` of the locale layout, and set
`openGraph.locale` per language (`es_ES`, `en_GB`, `de_DE`, `fr_FR`, `pt_PT`).

Both must also carry `x-default`, and the root layout must not declare `alternates` at all —
see **hreflang & x-default** below for the failure mode and the verification commands.

---

## hreflang & x-default — i18n projects

### The root layout must NOT declare `alternates`

Next merges the root layout's static metadata into every page below it. A static
`alternates` block there **overrides** the per-locale one in `app/[locale]/layout.tsx` —
every locale then emits the same canonical, and most hreflang tags vanish entirely.

This is silent: no error, no warning, and `generateMetadata` looks correct in isolation.
It only shows in the rendered `<head>`.

```ts
// app/layout.tsx
// NO `alternates` key. The locale layout owns canonical + languages.

// app/[locale]/layout.tsx — the ONLY place that declares them
alternates: {
  canonical: urlFor(locale),
  languages: {
    ...Object.fromEntries(locales.map((alt) => [alt, urlFor(alt)])),
    "x-default": urlFor(defaultLocale),
  },
},
```

### `x-default` is required, not optional

`x-default` tells Google which page to serve a visitor whose language matches **no** locale.
Without it Google picks one for you. Emit it in BOTH the locale layout and `app/sitemap.ts`.

### `urlFor` must match the real `localePrefix`

If `i18n/routing.ts` does not pass `localePrefix`, next-intl's default is `"always"` —
**every** locale is prefixed, including the default. A `urlFor` that special-cases the
default locale to an unprefixed URL then emits URLs that do not exist.

Check `routing.ts` before writing any URL helper. Do not trust a code comment about it.

### Verify in the browser, never by reading the code

```bash
pkill -f next; rm -rf .next node_modules/.cache && npm run dev
for l in es en de fr pt; do
  echo "-- /$l"
  curl -s localhost:3000/$l | grep -oE '<link rel="(canonical|alternate)"[^>]*/>'
done
curl -s localhost:3000/sitemap.xml | head -20
```

Expect, on every locale: one canonical pointing at THAT locale, one `alternate` per locale,
and exactly one `x-default`. Anything less means something upstream is overriding it.

**Clear `.next` first.** Metadata is prerendered and cached; edits to `generateMetadata` will
appear to do nothing on a warm cache. That wasted real time here — see the 404 section above.

## Organization Schema (app/layout.tsx)

```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  "@context": "https://schema.org", "@type": "Organization",
  "@id": `${appConfig.siteUrl}/#organization`,
  "name": "Your Business", "url": appConfig.siteUrl,
  "logo": { "@type": "ImageObject", "url": `${appConfig.siteUrl}/logo.png` },
  "sameAs": ["https://linkedin.com/company/..."],
})}} />
```

---

## Schema type — pick the specific one

`Organization` is the fallback, not the default. Use the most specific type available:
`SportsEvent` for a competition, `Event` for a conference, `LocalBusiness` for a physical
business, `Product` for a shop. A specific type can surface dates, venue and competitors as
rich results; `Organization` cannot.

JSON-LD belongs in a small Server Component so it stays out of the client bundle.

**On an i18n project the schema MUST be localised.** A hardcoded description means every
locale emits the same language to search engines — the German and French pages advertise
themselves in Spanish. Build the schema from a function that takes the translated strings:

```tsx
// constants/schema.ts — structure only, no copy
export const buildSportsEventSchema = (description: string) => ({
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  description,
  // …
}) as const

// components/layout/JsonLd.tsx — async Server Component, NO "use client"
export const JsonLd = async ({ locale }: { locale: string }) => {
  const t = await getTranslations({ locale, namespace: "home.meta" })
  return (
    <script type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSportsEventSchema(t("description"))) }} />
  )
}
```

Verify per locale after building:
```bash
for l in es en de; do curl -s localhost:3000/$l | grep -oE '"description":"[^"]{0,50}'; done
```

`type="application/ld+json"` is parsed as DATA, never executed, so it is exempt from the
"no script tags in components" ban in 06-TRANSITIONS.md. That ban covers runnable JavaScript only.

---

## Image Performance

```tsx
// First visible <Image> on each page gets priority
<Image src="/assets/images/home/hero.jpg" priority alt="..." />

// utils/preload-images.ts — call once in root/home client component
export function preloadImages(): void {
  if (typeof window === "undefined") return
  const paths = ["/assets/images/home/hero.jpg", ...]
  const run = () => paths.forEach(src => { const img = new window.Image(); img.src = src })
  "requestIdleCallback" in window ? requestIdleCallback(run) : setTimeout(run, 2000)
}
// useEffect(() => { preloadImages() }, [])
```

---

## Media weight — videos and SVGs

The heaviest page we shipped downloaded ~100 MB on load. These are the causes:

- **One video per breakpoint, rendered only once the breakpoint is known.** If the server
  renders a default (desktop) video, phones start downloading it from the HTML before
  hydration swaps in the mobile one. Use `useBreakpoint()` (null on the server) and render no
  `<video>` until it resolves — the loader covers that moment.
- **Encode for the web**: `ffmpeg -i in.mp4 -vf "scale=1920:-2" -c:v libx264 -preset slow
  -crf 26 -pix_fmt yuv420p -an -movflags +faststart out.mp4`. Background/hero videos: ≤1080p
  (vertical 1080×1920), no audio track (`-an` — silent tracks still cost bytes), `faststart`
  so playback starts before the download ends. Aim for ≤10 MB. Compare a frame before and
  after; never replace a video the client chose without asking.
- **No raster images wrapped in SVG.** An `.svg` that is a `data:image/png` inside an `<svg>`
  can't be optimized by `next/image` and ships at full weight (1–2 MB each). Render it to
  WebP at the same size (~30–40 KB).
- **Delete unreferenced assets** in `public/` — they don't slow pages but bloat the image.
  CMS uploads are served from the CMS CDN, never from `public/`, so a file the code doesn't
  reference is safe to remove (still in git history).
- **Every fallback/placeholder asset path must exist.** A missing one is a 400 from
  `/_next/image`; the smoke test's failed-request check catches it.

## Content freshness — CMS-driven pages

Clients expect an edit to appear the moment they publish; a cache delay looks like a bug.
CMS-driven pages use `export const revalidate = 0` (layout included, and every page the
client edits). Switch to time-based caching **only** after an on-publish webhook
(`app/api/revalidate`, signed, `revalidatePath("/", "layout")`) is configured in the CMS.
A `cache: "no-store"` fetch also forces dynamic rendering — keep layout fetches consistent
with the page setting.

## Public Assets Structure

```
public/
  favicon.ico
  assets/images/common/, [page-name]/
  assets/videos/
  assets/icons/
  assets/fonts/  (.woff2 only — if not using next/font)
  assets/email/  (transactional email templates — see below)
```

Nothing at `public/` root except `favicon.ico` and manifest icons.

---

## Transactional email templates — TWO copies, always in sync

Every email template (magic link, invite, password reset, notification) is written
**once and saved twice**:

```
<provider>/email-templates/<name>.html  ← the source pasted into the email provider
public/assets/email/<name>.html         ← the same file, viewable in a browser
```

(`<provider>` is wherever your email service keeps its templates — put it next to that
service's other config, not at the project root.)

**Why both.** The provider copy is what actually gets sent. The `public/` copy is
how anyone reviews it: an email template is the one piece of UI you cannot open in
the app, and no one is going to trigger a real send to see whether a button lost
its padding. Serving it at `/assets/email/<name>.html` means design review is a URL,
not a round-trip through a live mailbox.

**When you add or edit ANY email template, write both files in the same change.**
A template that exists in only one place is the bug this rule prevents — the two
silently drift and the reviewed version stops being the sent version.

```bash
# after editing either one, prove they match
diff public/assets/email/<name>.html <provider>/email-templates/<name>.html
```

### Writing rules for the template itself

- Table layout and inline styles only. Gmail, Outlook and Apple Mail strip
  `<style>` blocks and ignore flexbox — anything modern collapses.
- Brand colours hardcoded as hex. An email cannot read CSS custom properties, so
  `styles/theme.css` tokens must be copied in as literal values. This is the one
  place the "no hardcoded hex" rule does not apply.
- Buttons are a `<table>`, never a styled `<a>` — Outlook will not render padding
  on an anchor.
- Keep the provider's placeholder name exactly (e.g. `{{ .ConfirmationURL }}`).
  Renaming it silently produces an email with a dead button.
- Always include the raw URL as copyable text under the button, for clients that
  block the button entirely.
- Each provider template is SEPARATE. "Invite user" and "Magic Link" are different
  templates: styling one does nothing to the other.
