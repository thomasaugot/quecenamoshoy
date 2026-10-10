import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { defaultLocale, locales } from "@/config/i18n.config"

const dir = join(import.meta.dirname, "..", "locales")
const filesOf = (locale: string) => readdirSync(join(dir, locale)).sort()

const flatten = (tree: unknown, prefix = ""): string[] =>
  typeof tree === "object" && tree !== null
    ? Object.entries(tree).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k))
    : [prefix]

const keysOf = (locale: string, file: string) =>
  flatten(JSON.parse(readFileSync(join(dir, locale, file), "utf8"))).sort()

describe("locale parity — every language has every key (09-I18N)", () => {
  const reference = filesOf(defaultLocale)
  for (const locale of locales.filter((l) => l !== defaultLocale)) {
    it(`${locale} has the same files as ${defaultLocale}`, () => {
      expect(filesOf(locale)).toEqual(reference)
    })
    for (const file of reference) {
      it(`${locale}/${file} has exactly the keys of ${defaultLocale}/${file}`, () => {
        expect(keysOf(locale, file)).toEqual(keysOf(defaultLocale, file))
      })
    }
  }
})
