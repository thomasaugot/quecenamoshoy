import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { preferredStartPath } from "@/i18n/preferred-locale"

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  })
  vi.stubGlobal("navigator", { languages: ["es-ES"] })
})
afterEach(() => vi.unstubAllGlobals())

describe("preferredStartPath — the app reopens in the language I chose", () => {
  it("sends an unprefixed URL to the chosen language, same page", () => {
    store.set("preferred-language", "fr")
    expect(preferredStartPath("/")).toBe("/fr")
    expect(preferredStartPath("/historial")).toBe("/fr/historique")
    expect(preferredStartPath("/plato/42")).toBe("/fr/plat/42")
  })
  it("never touches an explicit /en or /fr URL", () => {
    store.set("preferred-language", "fr")
    expect(preferredStartPath("/en/history")).toBeNull()
  })
  it("stays when the choice is the default language or there is none", () => {
    store.set("preferred-language", "es")
    expect(preferredStartPath("/")).toBeNull()
    store.clear()
    expect(preferredStartPath("/historial")).toBeNull()
  })
  it("first visit to the bare home follows the browser", () => {
    vi.stubGlobal("navigator", { languages: ["fr-FR", "en"] })
    expect(preferredStartPath("/")).toBe("/fr")
  })
})
