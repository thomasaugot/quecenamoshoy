import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { EQUIPMENT } from "@/constants/equipment"
import common from "@/locales/es/common.json"

// The Edge Functions keep their own copy (Deno cannot import from src/). Compare the source.
const functionsCopy = readFileSync(join(process.cwd(), "supabase", "functions", "_shared", "equipment.ts"), "utf8")
const listIn = (source: string) => source.slice(source.indexOf("export const EQUIPMENT"), source.indexOf("} as const")).replace(/\s+/g, "")

describe("equipment catalogue", () => {
  it("is the same in the app and in the Edge Functions", () => {
    const app = readFileSync(join(process.cwd(), "src", "constants", "equipment.ts"), "utf8")
    expect(listIn(functionsCopy)).toBe(listIn(app))
  })
  it("has a label for every key", () => {
    const labels: Record<string, string> = common.catalogue.equipment
    for (const key of Object.values(EQUIPMENT).flat()) expect(labels[key], key).toBeTruthy()
  })
})
