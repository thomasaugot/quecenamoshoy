import { GoogleGenAI, ThinkingLevel } from "@google/genai"
import { env } from "./env.ts"
import type { AiLimits } from "./rate-limit.ts"

// Brief §4.4 named gemini-2.5-flash; Google closed 2.5 to new users (404) — 3.8 Flash is the GA Flash model now
export const TEXT_MODEL = "gemini-3.8-flash"

// ── COST CEILING ───────────────────────────────────────────────────────────────────────
// gemini-3.8-flash: $0.75 / 1M tokens in, $3.75 / 1M out (thinking is billed as output).
// Every call: thinking "low" (3.8 Flash has no "minimal") and a hard cap on output tokens.
// Worst case per call ≈ input 8k × 0.75 + output cap × 3.75 (per 1M):
//   suggest       ≈ 4k in + 2048 out ≈ $0.011  × 20/day ≈ $0.22/day max
//   scan-kitchen  ≈ 8k in + 1024 out ≈ $0.010  ×  4/day ≈ $0.04/day max
//   enrich-dishes ≈ 3k in + 8192 out ≈ $0.033  ×  3/day ≈ $0.10/day max (one-off: sorts my dishes)
//   recipe        ≈ 2k in + 3072 out ≈ $0.013  × 10/day ≈ $0.13/day max (saved: once per dish)
// Normal use (a few suggestions a night) ≈ well under $1 a month.
export const LIMITS = {
  suggest: { perHour: 6, perDay: 20 },
  scanKitchen: { perHour: 2, perDay: 4 },
  enrichDishes: { perHour: 2, perDay: 3 },
  recipe: { perHour: 5, perDay: 10 },
  // not AI (free), but it fetches pages from the internet: capped all the same
  importRecipe: { perHour: 10, perDay: 30 },
} as const satisfies Record<string, AiLimits>

export const MAX_OUTPUT_TOKENS = { suggest: 2048, scanKitchen: 1024, enrichDishes: 8192, recipe: 3072 } as const
export const THINKING = { thinkingLevel: ThinkingLevel.LOW }

let client: GoogleGenAI | null = null
export const gemini = () => (client ??= new GoogleGenAI({ apiKey: env("GEMINI_API_KEY") }))
