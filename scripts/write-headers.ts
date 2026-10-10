// Runs after `vite build` (Node ≥ 23 runs .ts directly). Writes dist/_headers for Cloudflare
// Pages with a STRICT CSP: the sha256 of every inline <script> in the built index.html is
// computed here, never pasted by hand (11-SECURITY → Strict CSP).
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const dist = join(import.meta.dirname, "..", "dist")
const html = readFileSync(join(dist, "index.html"), "utf8")

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1] ?? "")
  .filter((body) => body.trim().length > 0)
const hashes = inlineScripts.map((body) => `'sha256-${createHash("sha256").update(body).digest("base64")}'`)

const origin = (url: string | undefined) => {
  if (!url) return null
  try { return new URL(url).origin } catch { return null }
}
const supabase = origin(process.env.VITE_SUPABASE_URL)
if (!supabase) throw new Error("VITE_SUPABASE_URL is not set in the build environment — CSP cannot be written.")
const sentry = origin(process.env.VITE_SENTRY_DSN)

const csp = [
  "default-src 'self'",
  ["script-src 'self'", ...hashes].join(" "),
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase}`,
  "font-src 'self'",
  ["connect-src 'self'", supabase, supabase.replace(/^https:/, "wss:"), sentry].filter(Boolean).join(" "),
  "manifest-src 'self'",
  "worker-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

const headers = `/*
  Strict-Transport-Security: max-age=63072000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: microphone=(), geolocation=(), browsing-topics=()
  Content-Security-Policy: ${csp}

/sw.js
  Cache-Control: no-cache
`

writeFileSync(join(dist, "_headers"), headers)
process.stdout.write(`dist/_headers written — ${hashes.length} inline script hash(es)\n`)
