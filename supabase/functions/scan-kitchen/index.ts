import { Type } from "@google/genai"
import { requireUser } from "../_shared/auth.ts"
import { json, preflight } from "../_shared/cors.ts"
import { missingEnv } from "../_shared/env.ts"
import { EQUIPMENT, type EquipmentCategory } from "../_shared/equipment.ts"
import { gemini, LIMITS, MAX_OUTPUT_TOKENS, TEXT_MODEL, THINKING } from "../_shared/gemini.ts"
import { takeAiCall } from "../_shared/rate-limit.ts"

// Photos of the kitchen in, catalogue keys out. Nothing is saved: the app shows the list and
// I confirm (brief §3.6). Photos travel in the body (resized in the browser), never stored.

const MAX_IMAGES = 6
const MAX_IMAGE_CHARS = 3_000_000          // base64 of a ~2.2 MB image; the app sends ~300 KB
const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

const ALL_KEYS = Object.values(EQUIPMENT).flat() as string[]
const categoryOf = (key: string) =>
  (Object.keys(EQUIPMENT) as EquipmentCategory[]).find((c) => (EQUIPMENT[c] as readonly string[]).includes(key))

const PROMPT = `You are looking at photos of a home kitchen (worktop, cupboards, drawers).
List every cooking appliance, piece of cookware and kitchen tool you can actually SEE.
Answer ONLY with keys from this list, never anything else: ${ALL_KEYS.join(", ")}.
Give each a confidence from 0 to 1. Do not guess items that are not visible.`

type ImageInput = { mimeType: string; data: string }

const isImage = (value: unknown): value is ImageInput =>
  typeof value === "object" && value !== null &&
  typeof (value as ImageInput).mimeType === "string" && MIME_TYPES.has((value as ImageInput).mimeType) &&
  typeof (value as ImageInput).data === "string" && (value as ImageInput).data.length > 0 &&
  (value as ImageInput).data.length <= MAX_IMAGE_CHARS

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req)
  if (req.method !== "POST") return json(req, { error: "method" }, 405)

  const missing = missingEnv()
  if (missing.length) {
    console.error("config missing:", missing.join(", "))   // names only, never values
    return json(req, { error: "server_config" }, 500)
  }

  const user = await requireUser(req)
  if (!user) return json(req, { error: "unauthorized" }, 401)

  const body = await req.json().catch(() => null)
  const images: unknown = body?.images
  if (!Array.isArray(images) || images.length === 0 || images.length > MAX_IMAGES || !images.every(isImage)) {
    return json(req, { error: "invalid_images" }, 400)
  }

  if (!(await takeAiCall(user.client, "scan-kitchen", LIMITS.scanKitchen))) return json(req, { error: "rate_limited" }, 429)

  try {
    const response = await gemini().models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: "user", parts: [{ text: PROMPT }, ...images.map((i) => ({ inlineData: i }))] }],
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: MAX_OUTPUT_TOKENS.scanKitchen,
        thinkingConfig: THINKING,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING, enum: ALL_KEYS },
                  confidence: { type: Type.NUMBER },
                },
                required: ["key", "confidence"],
              },
            },
          },
          required: ["items"],
        },
      },
    })
    const parsed = JSON.parse(response.text ?? "{}") as { items?: { key: string; confidence: number }[] }
    // Never trust the model's output shape: catalogue keys only, each once, best first
    const seen = new Set<string>()
    const items = (parsed.items ?? [])
      .filter((i) => typeof i.key === "string" && !seen.has(i.key) && seen.add(i.key) && categoryOf(i.key))
      .map((i) => ({ key: i.key, category: categoryOf(i.key), confidence: Math.min(1, Math.max(0, Number(i.confidence) || 0)) }))
      .sort((a, b) => b.confidence - a.confidence)
    return json(req, { items })
  } catch (error) {
    // Log the kind only — never the images, never the upstream body (11-SECURITY → Logging)
    console.error("scan-kitchen: gemini failed", error instanceof Error ? error.name : "unknown")
    return json(req, { error: "upstream" }, 502)
  }
})
