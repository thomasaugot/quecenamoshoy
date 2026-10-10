import type { SupabaseClient } from "@supabase/supabase-js"

const HOUR_MS = 60 * 60_000
const DAY_MS = 24 * HOUR_MS

export type AiLimits = { perHour: number; perDay: number }

const countSince = async (client: SupabaseClient, fn: string, ms: number) => {
  const { count, error } = await client.from("ai_calls")
    .select("id", { count: "exact", head: true }).eq("fn", fn).gte("created_at", new Date(Date.now() - ms).toISOString())
  return error ? null : count
}

// The spending cap. Counts this user's calls of `fn` (ai_calls, under their RLS) in the last
// hour AND the last 24 h, then logs this one. Refuses once either cap is reached. A failed
// count fails CLOSED: no count, no Gemini call.
export const takeAiCall = async (client: SupabaseClient, fn: string, limits: AiLimits): Promise<boolean> => {
  const [hour, day] = await Promise.all([countSince(client, fn, HOUR_MS), countSince(client, fn, DAY_MS)])
  if (hour === null || day === null || hour >= limits.perHour || day >= limits.perDay) return false
  const { error } = await client.from("ai_calls").insert({ fn })
  return !error
}
