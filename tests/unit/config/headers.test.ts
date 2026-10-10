import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

// vercel.json carries a strict CSP with script-src 'self' only — that holds only while
// index.html has NO inline script. Adding one would be silently blocked in production.
const root = process.cwd()
const html = readFileSync(join(root, "index.html"), "utf8")
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")) as {
  git: { deploymentEnabled: boolean }
  headers: { source: string; headers: { key: string; value: string }[] }[]
}
const all = vercel.headers.find((h) => h.source === "/(.*)")?.headers ?? []
const header = (key: string) => all.find((h) => h.key === key)?.value ?? ""

describe("production headers (vercel.json)", () => {
  it("index.html has no inline script", () => {
    expect(html.match(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g) ?? []).toEqual([])
  })
  it("CSP never allows inline or eval scripts", () => {
    const csp = header("Content-Security-Policy")
    expect(csp).toContain("script-src 'self'")
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-(inline|eval)'/)
    expect(csp).toContain("worker-src 'self'")
    expect(csp).toContain("manifest-src 'self'")
  })
  it("sends the security headers, and keeps the app out of search engines", () => {
    for (const key of ["Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]) {
      expect(header(key), key).not.toBe("")
    }
    expect(header("X-Robots-Tag")).toContain("noindex")
  })
  it("only CI deploys (Vercel's deploy-on-push is off)", () => {
    expect(vercel.git.deploymentEnabled).toBe(false)
  })
})
