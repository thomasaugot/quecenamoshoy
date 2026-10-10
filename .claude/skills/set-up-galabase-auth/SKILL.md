---
name: set-up-galabase-auth
description: Set up passwordless (magic link) auth on a self-hosted Galabase/Supabase project — creating the first admin user, wiring profiles.role, and fixing "fake_sender" emails by configuring GoTrue SMTP on the VPS. Use when a Galabase project needs login, when magic-link emails do not arrive or come from a fake sender, or when Supabase Studio shows no Authentication settings because the project is self-hosted.
---

# Galabase auth: magic links end to end

## ⚠️ STOP — confirm this project uses Galabase before anything else

This skill fires on login and magic-link-email requests, but it is **specific to Galabase**
(Galaga's self-hosted Supabase). It is wrong for Supabase Cloud, Auth0, Clerk, NextAuth, or a
custom backend.

Before step 1, confirm the backend:
- Check `package.json`, `.env.example`, `lib/supabase/`, `docs/GALABASE.md`.
- A `NEXT_PUBLIC_SUPABASE_URL` pointing at a `supabase.co` domain means **Supabase Cloud**,
  not Galabase — the GoTrue/SMTP steps below do not apply.
- If it is not Galabase, say so and stop. Do not apply VPS-level GoTrue configuration to a
  managed provider.


Galabase is Galaga's **self-hosted** Supabase (see `docs/GALABASE.md` in a project
that has it). Everything below differs from Supabase Cloud, and that difference is
what wastes the time.

## The one thing to know first

**Studio has no Authentication settings page.** On self-hosted, Project Settings
shows "Self-hosted Supabase — Project settings are configured via environment
variables." SMTP, redirect URLs and rate limits are env vars on the VPS, not UI.
Do not hunt for the panel; it does not exist.

## Use the right compose project — this wastes the most time

A stack may be up under a project name that does NOT match the directory. Running
plain `docker compose` in the project folder then targets a **different**
container, and every edit silently applies to the wrong one.

```bash
docker ps --format '{{.Names}}' | grep -E "auth|gotrue"
# supabase-auth-1        ← generic default, may be a leftover stack
# fronton-king-auth-1    ← the real one, behind fronton-king-kong-1
```

Always pass `-p <project>` and verify against the CONTAINER, not the compose file:

```bash
docker compose -p fronton-king up -d --force-recreate auth
docker exec fronton-king-auth-1 env | grep -i smtp
```

Symptom that you are on the wrong one: config looks right, `docker compose logs`
shows only startup lines and **no send attempt** when a link is requested.

## Where things live

| Thing | Location |
|---|---|
| Per-project stack | `/mnt/HC_Volume_104520317/galabase-projects/<project>/` |
| Env file | `<that dir>/.env` |
| Compose file | `<that dir>/docker-compose.yml` |
| Auth container | service `auth` (image `supabase/gotrue`) |
| Galabase repo | `~/proyectos/galabase` (its `projects/` dir is EMPTY — stacks are on the volume) |

VPS: `5.75.178.191`, user `galagaagency`.

## 1. Fix "fake_sender" emails

Magic links sent by a fresh stack come from a shared dev sender, are heavily
rate-limited, and usually land in spam. Point GoTrue at real SMTP.

### The var names are SMTP_*, NOT GOTRUE_SMTP_*

This is the trap. Inside the container the vars are `GOTRUE_SMTP_*`, so that is
what `docker compose exec auth env | grep smtp` prints — but `docker-compose.yml`
maps them from **short** names:

```yaml
GOTRUE_SMTP_HOST: ${SMTP_HOST}      # .env key is SMTP_HOST
GOTRUE_SMTP_PASS: ${SMTP_PASS}      # .env key is SMTP_PASS
```

Adding `GOTRUE_SMTP_HOST=` to `.env` therefore does **nothing**: compose never
reads it, the container keeps the seeded `fake_sender` values, and a restart looks
like it failed for no reason. Always confirm the mapping first:

```bash
cd /mnt/HC_Volume_104520317/galabase-projects/<project>
grep -n -A40 "auth:" docker-compose.yml | grep -iE "smtp|env_file|environment"
grep -E "^SMTP_" .env
```

A fresh stack ships with placeholders (`supabase-mail`, `fake_sender`,
`fake_mail_user`, port 2500). **Edit those lines in place** rather than appending:

```bash
sed -i \
 -e 's|^SMTP_HOST=.*|SMTP_HOST=smtp.gmail.com|' \
 -e 's|^SMTP_PORT=.*|SMTP_PORT=587|' \
 -e 's|^SMTP_USER=.*|SMTP_USER=soporte@galagaagency.com|' \
 -e 's|^SMTP_PASS=.*|SMTP_PASS=<16-char Gmail app password>|' \
 -e 's|^SMTP_ADMIN_EMAIL=.*|SMTP_ADMIN_EMAIL=soporte@galagaagency.com|' \
 -e 's|^SMTP_SENDER_NAME=.*|SMTP_SENDER_NAME=<Project display name>|' \
 .env

grep -E "^SMTP_" .env
docker compose up -d --force-recreate auth
docker compose exec auth env | grep -i smtp   # must show the real values now
```

`--force-recreate` matters: a plain `up -d` often decides nothing changed.

**If you do ever append to `.env`, lead with a newline.** The last line usually
has no trailing newline, so a blind append produces
`...15010SMTP_HOST=smtp.gmail.com` and the container dies with
`invalid hostPort`. Repair:

```bash
sed -i 's/\([0-9]\)SMTP_HOST/\1\nSMTP_HOST/' .env
```

**Gmail app password**: myaccount.google.com → Security → 2-Step Verification must
be ON → App passwords → create. Galaga already has one for
`soporte@galagaagency.com`; other projects' `.env.local` may hold a working copy
rather than minting a new one.

## 2. Redirect URLs — where the magic link actually lands

Two separate things decide this, and confusing them is what makes a link open the
Supabase Studio panel instead of your app.

### On the VPS (`.env`)

```bash
grep -E "^(SITE_URL|API_EXTERNAL_URL|ADDITIONAL_REDIRECT_URLS)" .env
```

A stock stack sets **all** of them to the Supabase host, which is wrong for two
of the three:

| Var | Correct value | Why |
|---|---|---|
| `API_EXTERNAL_URL` | the Supabase host | correct as shipped — leave it |
| `SITE_URL` | **your app**, not Supabase | the fallback target of every link; if it points at Supabase, links open Studio |
| `ADDITIONAL_REDIRECT_URLS` | every origin you sign in from | empty by default, so anything except `SITE_URL` is rejected |

```bash
sed -i 's|^SITE_URL=.*|SITE_URL=http://localhost:3000|' .env
sed -i 's|^ADDITIONAL_REDIRECT_URLS=.*|ADDITIONAL_REDIRECT_URLS=http://localhost:3000/**,https://<prod-domain>/**|' .env
docker compose -p <project> up -d --force-recreate auth
```

With both allow-listed you can develop locally and ship without editing this
again: whichever origin the app sends decides where each individual link goes.
`SITE_URL` is only the fallback.

### In the app — do NOT build the link from the request

```ts
// ❌ behind a proxy this is the PRODUCTION host, so a link requested from
//    localhost comes back pointing at production.
emailRedirectTo: `${request.nextUrl.origin}/auth/callback?next=...`

// ✅ the origin the app was actually configured with
emailRedirectTo: `${appConfig.siteUrl}/auth/callback?next=...`
```

`appConfig.siteUrl` reads `NEXT_PUBLIC_SITE_URL`, so localhost stays localhost and
production stays production with no code change. Same applies to
`window.location.origin` in a client component — fine locally, wrong the moment a
proxy is involved.

### i18n projects: three things must agree

Getting one of these wrong sends the user straight back to the login page with
no error, which is impossible to debug from the browser.

**1. `/auth` must bypass locale routing.** GoTrue builds the callback URL itself,
so it is never locale-prefixed. Without the bypass the proxy rewrites it to
`/es/auth/callback` and every link 404s:

```ts
// proxy.ts — alongside /_next and /api
pathname.startsWith("/auth") ||     // magic-link callback, built by GoTrue
```

**2. If the consoles ARE localised, `/admin` must NOT bypass it.** A stack that
started Spanish-only usually has `pathname.startsWith("/admin")` in that same
list. The moment the routes move under `app/[locale]/`, that line stops the
locale rewrite and every admin URL 404s. Remove it when you localise.

**3. Every redirect must carry the locale.** These are the three places, and
missing any one bounces the user back to login:

```ts
// login page — send the locale-qualified destination
<RoleLoginClient redirectTo={`/${locale}/admin`} />

// callback route — locale-aware fallback, and NOT request.nextUrl.origin
const origin   = appConfig.siteUrl              // proxy host would be wrong
const fallback = `/${appConfig.defaultLocale}/admin`
const next     = searchParams.get("next") ?? fallback

// shell / sign-out
router.push(`/${locale}/admin/login`)
```

Symptom of getting these wrong: the link works, the session is created, and the
user still lands on the login page — because the redirect went to a path that
does not exist and the guard bounced them.

### Force the IMPLICIT flow. Do not fight PKCE.

**Do this first and skip the whole debugging spiral.** supabase-js defaults to
PKCE, which stores a code verifier when the link is REQUESTED and reads it back
after the user returns from their email — a full page load later. On this stack
that verifier is not reliably persisted, and every callback dies with:

```
AuthPKCECodeVerifierMissingError: PKCE code verifier not found in storage
```

Implicit needs no verifier, so there is nothing to lose between page loads:

```ts
// lib/supabase/client.ts — memoised, one instance per tab
let client: SupabaseClient | null = null

export const createSupabaseBrowserClient = (): SupabaseClient => {
  if (client) return client
  client = createBrowserClient(url, anonKey, {
    auth: { flowType: "implicit" },   // ← the whole fix
  })
  return client
}
```

The link is single-use, short-lived, and the console is behind an allowlist, so
the practical security difference is small.

### The browser must request the link, not the server

Whichever client calls `signInWithOtp` is the one that can complete the sign-in.
A server route that sends the link leaves the browser unable to finish it.

Keep the allowlist server-side without breaking that:

```ts
// 1. ask the server whether this address is allowed
const gate = await fetch("/api/admin/magic-link", { method: "POST", body: ... })
const { allowed } = await gate.json()

// 2. the BROWSER sends the link
if (allowed) {
  await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=...`,
    },
  })
}
```

The route returns `{ ok: true }` either way, so it still cannot be used to probe
who has access.

### The callback is a PAGE, and it parses the fragment itself

Implicit returns the session in the URL **fragment**, which never reaches the
server — so `app/[locale]/auth/callback/page.tsx` rendering a client component,
not a route handler:

```ts
const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
const access_token  = hash.get("access_token")
const refresh_token = hash.get("refresh_token")

if (access_token && refresh_token) {
  await supabase.auth.setSession({ access_token, refresh_token })
}
// only now is getSession() reliable
window.history.replaceState(null, "", window.location.pathname)  // drop tokens
```

Parse it explicitly. `detectSessionInUrl` does the same thing asynchronously, so
`getSession()` on the first tick returns null and the page bounces to login —
which looks exactly like a broken link.

### Diagnose in one step instead of guessing

Log what actually arrived before changing anything:

```ts
console.log({ search: location.search, hash: location.hash.slice(0, 80) })
```

| What you see | Flow in use | Handle it |
|---|---|---|
| `?code=…`, empty hash | PKCE | switch to implicit (above) |
| `#access_token=…` | implicit | `setSession` from the fragment |
| neither | link never reached the app | check redirect URLs, section 2 |

**`admin/generate_link` is not a valid test.** It emits implicit-style links even
when the app's `signInWithOtp` is using PKCE — two endpoints, two flows, same
server. Testing with it sent this exact investigation down the wrong path for an
hour. Always reproduce with the real login form.

## 3. Create the first admin

A brand-new stack has **zero** users, so this SQL succeeds while matching nothing:

```sql
insert into profiles (id, display_name, role)
select id, 'Name', 'admin' from auth.users where email = '...';
-- "Success. No rows returned" = the auth user does not exist yet
```

Create the auth user first. Studio's Authentication → Users → Add user works, or
via the service-role key:

```js
// email_confirm:true matters — an unconfirmed user cannot use a magic link.
await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: "POST",
  headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
             "Content-Type": "application/json" },
  body: JSON.stringify({ email, email_confirm: true }),
})
```

Then insert the profile row with the returned id.

**Two tables, both needed, and this confuses people:**
- `auth.users` — the login identity. Supabase owns it; you cannot add columns.
- `public.profiles` — your app's data for that user, same id. `role` lives here
  because `auth.users` has none.

## 4. Branded email templates

GoTrue's default email is plain and unbranded. Templates are HTML files mounted
into the container.

### GoTrue fetches templates over HTTP — it CANNOT read a file path

This is the whole trap, and it costs an hour if you assume otherwise. The value
of `MAILER_TEMPLATES_*` is a **URL**, always. GoTrue prepends the site URL to
anything that is not one:

| Value set | What GoTrue actually requests | Result |
|---|---|---|
| `/etc/gotrue/templates/x.html` | `https://<site>/etc/gotrue/templates/x.html` | 404 |
| `file:///etc/gotrue/templates/x.html` | `https://<site>file///etc/...` | DNS failure |
| `http://<reachable-host>/x.html` | that URL | works |

Mounting the file into the container is therefore pointless on its own — the
mount succeeds, `docker exec ... ls` shows the file, and it is still never read.
Diagnose with:

```bash
docker compose -p <project> logs --tail=30 auth | grep -iE "template|error"
# templatemailer: template type "magic_link": http: GET ... status code 404
```

**Serve it from the project's own Next.js app.** Put the template in
`public/assets/email/` (version-controlled, deploys with the app):

```
public/assets/email/magic-link.html
```

Then point GoTrue at a URL its container can actually reach. The public domain
may 503 behind the proxy; the **Docker host gateway** to the app's published port
is reliable and needs no DNS:

```bash
docker port <app-container>            # e.g. 3000/tcp -> 0.0.0.0:3013
docker exec <project>-auth-1 wget -qO- http://172.17.0.1:3013/assets/email/magic-link.html | head -3
```

`172.17.0.1` is the default Docker bridge gateway — the auth container's route
back to the host. Container-name DNS (`http://app:3000`) does **not** work when
the app and the Supabase stack are on different Docker networks, and hangs
rather than erroring.

Once that `wget` prints HTML:

```bash
sed -i 's|^MAILER_TEMPLATES_MAGIC_LINK=.*|MAILER_TEMPLATES_MAGIC_LINK=http://172.17.0.1:<port>/assets/email/magic-link.html|' .env
grep MAILER_TEMPLATES .env          # ALWAYS verify — an earlier sed may have lost
docker compose -p <project> up -d --force-recreate auth
```

A 404 from that wget means the file is not deployed yet, not that the route is
wrong: deploy the app first, then re-test.

**Template rules** (email clients are not browsers):
- Table layout + inline styles only. `<style>` blocks and flexbox are stripped.
- Buttons must be a `<table>` with a background colour, not a styled `<a>`, or
  Outlook drops the fill.
- Brand colours hardcoded as hex — an email cannot read CSS custom properties.
- Keep `{{ .ConfirmationURL }}` verbatim; it is GoTrue's placeholder.
- Always include the raw URL as text under the button, for clients that block it.

Other templates use the same pattern: `MAILER_TEMPLATES_INVITE`,
`_CONFIRMATION`, `_RECOVERY`, `_EMAIL_CHANGE`.

### Worth knowing: GOTRUE_MAILER_AUTOCONFIRM

Galabase stacks ship with `GOTRUE_MAILER_AUTOCONFIRM=true`, which auto-confirms
addresses without a verification step. That is fine for a staff-only backoffice
(the magic link itself proves the mailbox), but it is NOT what you want if the
project ever opens sign-up to the public. Check it before launch.

## 5. Next.js layouts: only the root may render <html>

A second `<html>`/`<body>` in `app/admin/layout.tsx` (or `app/sponsor/…`) that
re-declares `next/font` generates a DIFFERENT font class than the root layout's,
so the server and client HTML disagree and every admin page throws a hydration
mismatch. Admin routes sit outside the locale tree but still inherit the root
shell:

```tsx
// app/admin/layout.tsx — metadata only, no <html>, no fonts
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
```

If the sub-layout set a different background on `<body>`, move it to a wrapper
`<div className="min-h-screen bg-...">`.

## 6. App-side wiring

- **Do not** build a separate `admin_allowlist` table. `profiles.role` is already
  the single source of truth, and a profile cannot exist without an auth user, so
  being `staff`/`admin` IS the allowlist. Building one was a wasted migration.
- Send the link from a **server route**, never the browser: a client-side
  allowlist check is trivially bypassable.
- `shouldCreateUser: false` on `signInWithOtp` stops the form enrolling strangers.
- Return the same `{ ok: true }` for allowed and rejected addresses, so nobody can
  enumerate who has access.
- Rate limit the route (public endpoint).
- The callback route must validate `next` is a same-origin path before
  redirecting, or it is an open redirect.

## Verify

```bash
curl -s https://<project-api>/auth/v1/health   # {"name":"GoTrue",...}
docker compose logs --tail=50 auth             # SMTP errors show here
```

Then request a link from the real login page and check the sender address.
