---
paths:
  - "src/**"
  - "functions/**"
  - "supabase/**"
  - "vite.config.*"
  - "index.html"
  - "public/_headers"
---

# SECURITY.md — Non-negotiable Security Rules (Vite + React)

Every rule here came from a real vulnerability found in this codebase. Do not relax any
of them "for compatibility" — that is the exact reasoning that produced each bug.

---

## Secrets — never a fallback

```ts
// ❌ BANNED — every one of these shipped to production at some point
const secret = process.env.APP_SECRET || "";
const key    = process.env.ENCRYPTION_KEY || "07bc3ffd...";
const token  = "eyJhbGciOiJIUzI1NiJ9...";   // hardcoded admin JWT

// ✅ REQUIRED — fail closed, loudly, at startup
const secret = process.env.APP_SECRET;
if (!secret) throw new Error("APP_SECRET is not set. Generate: openssl rand -hex 32");
```

- A missing env var must **fail**, never silently degrade to a weaker default.
- No credential, key, JWT, or password literal in any tracked file — ever.
- A secret that reaches a public repo, an email, or an issue is **compromised**: rotate it,
  do not just delete the line. Removing it from the working tree does not remove it from
  git history.
- Never put a credential in a value that travels in a URL or an email body.

### Vite: the frontend has NO secrets

Every file in `src/` and every `import.meta.env.VITE_*` value is inlined into a public bundle.

- Only public values in `VITE_` variables (backend URL, publishable/anon key). A key that
  bypasses access rules (service-role, admin, AI provider, payment secret) **never** gets the
  `VITE_` prefix and never appears in `src/`. It lives in the backend's secret store.
- Never widen `envPrefix` in `vite.config.ts` (e.g. to `""`) — that publishes every variable
  in `.env`, secrets included.
- A secret that was ever in a `VITE_` variable or in a deployed bundle is **compromised**:
  rotate it.

---

## Backend functions — every function is public until you guard it

A Vite app has no API routes. Anything privileged (secrets, writes that bypass access rules,
third-party APIs, email) runs in a **backend function** (serverless / edge function). Its URL is
in the public bundle, so anyone can call it directly.

Classify every function and apply the matching guard as the **first statement**, before
body parsing or any upstream call:

| Function kind | Guard |
|---|---|
| Internal / admin / cron (no frontend caller) | shared secret header — return **404**, not 401, so it does not advertise itself |
| Called by the logged-in app | verify the user's session token server-side, derive the user id from it |
| Genuinely public (contact form, newsletter) | rate limit + honeypot + field caps (below) |

```ts
// ❌ trusting the frontend: "only the app calls this"
const { userId, prompt } = await req.json()

// ✅ the token says who it is; the body never does
const user = await verifySession(req)          // throws/returns 401 on a missing or bad token
if (!user) return new Response("Unauthorized", { status: 401 })
const { prompt } = await req.json()            // userId comes from `user`, never the body
```

- Guards live in one shared module per backend (e.g. `functions/_shared/auth.ts`), never
  re-written per function.
- A function that spends money (AI, SMS, email) also gets a per-user rate limit, so a stolen
  session or a loop in the app cannot run up the bill.
- CORS: allow the app's own origin(s), never `*` on a function that uses credentials.

## Never trust a client-supplied identifier

```ts
// ❌ BANNED — write-side IDOR: anyone can target any record
const recordId = formData.recordId;

// ✅ REQUIRED — derive it from the signed/encrypted token
const bound = JSON.parse(decryptToken(formData.token));
const recordId = bound.recordId;
```

- "The page already validated it" is **not** validation. The backend is directly reachable;
  checks in `src/` are decoration — the browser can be edited.
- Never write a "lenient mode" that logs a validation failure and continues anyway.
- If a value decides *which record* is read or written, it must come from a server-verified
  source, not the request body.

---

## Database access rules — when the browser talks to the database, they ARE the API

With a backend-as-a-service (Supabase, Firebase, Appwrite…) the app queries tables directly
with the public key. Then row-level security / security rules are the **only** guard: a
missing policy is an open table, readable by anyone who opens DevTools.

- Every table: RLS enabled AND explicit policies for select / insert / update / delete, in the
  same migration that creates the table. No table "temporarily" without.
- Ownership comes from the session (`auth.uid()`), never from a column the client sends.
- **Policies are tested**, not assumed. One test per table, against the LOCAL stack, with two
  test users: anonymous cannot read or write; user B cannot read, update or delete user A's
  rows; user A can do what the app needs. A policy edit without that test passing is not done.
- Views and functions bypass RLS unless declared otherwise (`security_invoker = true` on
  views, `security definer` functions only with an explicit owner check inside).

---

## Storage — private by default, enforced by the bucket

Uploads that go straight from the browser to storage skip every check in the app. The bucket
enforces them:

- **Private** bucket unless the files are genuinely public (marketing images). Private files
  are served with short-lived **signed URLs**, never made public "to make the image load".
- **Max file size and allowed MIME types set on the bucket**, not only in the upload form.
- Path starts with the owner's id (`{user_id}/{file}`) and the storage policy checks that
  prefix against the session — user B can neither read nor overwrite user A's files.
- File names are generated (`{id}.webp`), never the uploaded name (see "File uploads").

---

## Auth hardening — configure the provider, do not trust defaults

- **Sign-ups disabled** unless the app is genuinely open to the public. A private app creates
  its accounts by hand / invite; an open sign-up endpoint is a free account for anyone.
- Rate limits on sign-in, magic link, OTP and password reset set in the provider (defaults are
  often generous or off).
- Email confirmation on, leaked-password protection on (if passwords are used), minimum length
  ≥ 10.
- Redirect URLs allow-listed to the app's own domains — never a wildcard.
- Session lifetime and refresh-token rotation set deliberately, not left at whatever came.

---

## Public forms — honeypot, limits, rate limit

Every unauthenticated form route (contact, comments, likes, newsletter) gets all four:

```ts
const isRateLimited = await rateLimit(store, { key: ip, max: 5, windowMs: 10 * 60_000 }) // shared backend module

if (body.website) return ok()                       // honeypot: hidden field only bots fill — pretend success
for (const f of FIELDS) if (value(f).length > MAX[f]) return error("…demasiado largo", 400)
if (isRateLimited) return error("…", 429)
```

- The honeypot input is `type="text" name="website" tabIndex={-1} autoComplete="off"` inside
  an `aria-hidden="true"` `sr-only` wrapper — invisible to people and screen readers.
- Cap every field (email 254, names ~120, free text 2000–5000).
- Validate identifiers against a format **and** existence (a comment or like for a slug that
  doesn't exist is rejected 404 — never creates a record).
- Rate-limit writes per IP (per IP + target for likes/votes). **Never in memory**: a serverless
  function has no memory between calls, so the counter lives in the database or a KV store.
  Key by the platform's client-IP header.
- Contact emails set `replyTo` to the visitor's address; every interpolated value goes
  through `escapeHtml()`.
- Error messages returned to the form are in the **site's language**, never upstream text.

---

## Crypto

- **AES-256-GCM only.** Never CBC — it is unauthenticated, malleable, and enables padding
  oracles.
- Fresh random IV per encryption. Never reuse, never hardcode.
- Never return `error.message` from a decrypt path to the client — a distinguishable error
  is a decryption oracle. Log detail server-side, return a fixed opaque code.
- `Math.random()` is never acceptable for anything security-relevant. Use `crypto`.

---

## File uploads

```ts
// ❌ BANNED — path.join() normalizes "../", it does not block it
const filename = `${Date.now()}-${file.name}`;

// ✅ REQUIRED — allowlist the extension, generate the basename, assert containment
const ext = extname(basename(file.name)).toLowerCase();
if (!ALLOWED_EXTENSIONS.has(ext)) throw new Error("Unsupported file type");
const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
if (!resolve(uploadPath).startsWith(resolve(uploadsDir) + sep)) throw new Error("traversal");
```

Always cap file size and file count.

---

## Output escaping

- **JSON-LD** → `serializeJsonLd()` from `@/utils/seo-utils`. Never bare `JSON.stringify`
  in `dangerouslySetInnerHTML`: the HTML parser ends the script at the first `</script`
  regardless of JSON quoting.
- **HTML emails** → `escapeHtml()` from `@/utils/api/escape-html` on every interpolated
  value. Free text reaches staff inboxes as trusted internal mail.
- **CMS HTML** → DOMPurify before render, always.
- **Query interpolation** (SQL / query languages / URLs) → validate the format (`/^\d{4}-\d{2}-\d{2}$/`)
  or `encodeURIComponent`. Auth-gating is not a substitute.

---

## Logging

- Never log a token, key, or full auth response — not even on the error path.
- Never log request bodies, CRM records, or anything with names, emails, phones, or free
  text. GDPR applies; log an id and a status code instead.
- Never return upstream error bodies, `error.message`, stack traces, or decoded JWT
  payloads to a client.
- **`logger` does not save you**: `FORCE_LOGS=true` makes it a pass-through. Keep the
  secret out of the log call, do not merely gate it.

---

## Split dev/prod schemas — every migration runs against BOTH

If the project splits its database into a production schema and a dev/mock schema (e.g. the
Galabase `public` / `dev` split — `set-up-galabase-dev-schema` skill), **every** migration
statement names its schema and runs for both. SQL applied to one schema only leaves the
feature silently doing nothing in the other: no error, the API just ignores a column that is
not there. The skill holds the full procedure and the policy/grant loops.

---

## The checked-in schema is the source of truth — update it in the SAME change

**Applies only if the project has a database.** Skip this section entirely if it does not.

Every schema change goes into the repo's schema or migration file **as you make it**, not
after someone asks. Find that file first — it differs per project (`schema.sql`,
`prisma/schema.prisma`, `drizzle/`, a `migrations/` folder). A table, column, index, access
policy or storage bucket that exists only in the live database is invisible: the next person
reads the file, believes it, and ships against a schema that is not real.

This has already bitten twice:

- A settings table was declared in the file but **never applied**, so the admin panel failed
  at runtime with "could not find the table".
- A storage bucket and several access policies existed **only** live, created by hand, so a
  fresh stack would have come up broken.

```sql
-- Append a dated, idempotent block. Never edit an earlier one: the live database
-- has already run it, so a silent edit makes the two diverge.
-- ── MIGRATION 2026-08-26 — what and why ────────────────────────────────────
alter table my_table add column if not exists my_column text;
```

Rules:
- **Idempotent always** — `if not exists`, `on conflict do nothing`, `drop policy if exists`
  before `create policy`. The file gets re-run whole.
- **A new table needs its access policy in the same block.** Row-level security enabled with
  no policy denies everyone, including staff. Writes then fail with a generic "write-failed"
  that looks like an app bug.
- **Realtime/subscriptions need the table registered** with whatever mechanism your database
  uses, or the subscription errors.
- **A new column may need a schema-cache reload** before the API stops 404-ing it — check
  whether your data layer caches the schema.
- **Changes made directly on a server count too** — record them here with a comment saying
  where they were applied, even when the SQL cannot run from a normal client.

## CMS collections

Every collection needs an explicit `access` block. The default in most CMSes is "any
authenticated user", which means any account can delete any other's content. Gate
`create`/`update`/`delete` on a role.

---

## Security headers — every project, set by the host

No server of our own, so the host sends them. One file, in the repo:

```
# public/_headers — Cloudflare Pages / Netlify  (Vercel: "headers" in vercel.json)
/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
  Content-Security-Policy: <see below>
```

Drop `camera=()`/`microphone=()` if the app uses them (e.g. photo upload from the camera).

### Strict CSP — XSS is account theft in a SPA

The session token lives in `localStorage`, so ONE injected script reads it and the account is
gone. A Vite build has no inline scripts except the tiny pre-paint one in `index.html`
(06-TRANSITIONS.md), so a strict policy costs nothing:

```
default-src 'self';
script-src 'self' 'sha256-<hash of the index.html inline script>';
style-src 'self' 'unsafe-inline';        ← style ATTRIBUTES only; GSAP writes styles via JS,
                                           which CSP does not block — scripts stay strict
img-src 'self' data: blob: https://<storage host>;
font-src 'self';
connect-src 'self' https://<backend host> wss://<backend host> https://<error-tracking ingest>;
manifest-src 'self'; worker-src 'self';
frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'
```

- The `sha256` is computed **by the build** from the built `index.html` and written into
  `dist/_headers` — never pasted by hand (any edit to the script would silently break it).
- Never `'unsafe-inline'` or `'unsafe-eval'` in `script-src`.
- `dangerouslySetInnerHTML` only with DOMPurify output, never with raw strings from a backend,
  a CMS, a URL or the AI.
- Verify on the deployed preview: open every page with DevTools → zero CSP violations in the
  console. An E2E test asserts the headers are sent (12-TESTING_CI.md).

---

## Dependencies

- `npm audit` must be clean of critical/high in direct deps before release.
- Verify a major bump at **runtime**, not just with `tsc` — a library that drops its default
  export typechecks fine while being broken at runtime.
- Never bump a framework past what its plugins peer-accept; it breaks the build.

---

## Before marking security work done

- [ ] `npx tsc -b` — zero errors
- [ ] `npx vite build` — succeeds, and `grep -r` of `dist/` finds no secret
- [ ] Function tested live: guarded functions reject (no token, bad token, other user's id), legitimate flow still works
- [ ] No secret in the diff, and none newly introduced to git history
- [ ] Never trigger an email-sending endpoint while testing; if unavoidable, send only to an
      address you control

## Testing against real data — ABSOLUTE PROHIBITION

**NEVER touch real data. No exceptions, no judgement calls, no "just this once".**

This is not a guideline. It was violated once and it wrote false information onto a real
customer's record. It must never happen again.

### The only permitted way to test anything that writes

1. **Create a dedicated test record first.** Its name MUST be unmistakably a test record, so
   no human could ever mistake it for real:
   ```
   TEST - <what you are testing> <date>
   ```
2. **Do all testing against that record and only that record.** Every write, email, and
   field update must reference it.
3. Never reuse, borrow, or "just use" an existing record — an id found in the source code,
   a log, a test file, or an earlier conversation is **NOT** permission to write to it.
   Assume every id refers to a real customer.

### Hard prohibitions

- ❌ NEVER write, update, or delete any production record that is not a `TEST -` record
  you created for this specific task.
- ❌ NEVER trigger an endpoint that writes to production using an id you did not mint yourself.
- ❌ NEVER send email to a real recipient. Send only to an address you control.
- ❌ A passing test is NEVER worth writing to production. If the only way to prove a change
  is a real write, **stop and ask** — do not decide it is acceptable.

### Preferred: do not write at all

Prove changes with:
- HTTP status codes (400/401/404 on rejection paths)
- isolated round-trip tests of the crypto/validation logic
- `tsc -b` and `vite build`
- page renders (GET only)

That covers virtually everything. Reach for a write only when nothing else can prove it,
and only on a `TEST -` record you created.

