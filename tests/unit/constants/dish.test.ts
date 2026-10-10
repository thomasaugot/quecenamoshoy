import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

// The Edge Functions keep their own copy of the dish catalogues (Deno cannot import src/).
const listOf = (file: string, name: string) => {
  const source = readFileSync(join(process.cwd(), file), "utf8")
  const start = source.indexOf(`export const ${name} = [`)
  return source.slice(start, source.indexOf("]", start)).replace(/\s+/g, "")
}

describe("dish catalogues", () => {
  for (const name of ["PROTEINS", "TRAITS"]) {
    it(`${name} is the same in the app and in the Edge Functions`, () => {
      expect(listOf("supabase/functions/_shared/dish.ts", name)).toBe(listOf("src/constants/dish.ts", name))
    })
  }
})
