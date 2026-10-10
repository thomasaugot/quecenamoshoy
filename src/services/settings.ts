import { AVOID_DAYS_DEFAULT } from "@/constants/settings"
import { supabase } from "@/lib/supabase"
import type { AppSettings } from "@/types/person"

// One row per account, created on the first save — defaults until then.
export const getSettings = async (): Promise<AppSettings> => {
  const { data, error } = await supabase.from("settings").select("avoid_days, default_diners").maybeSingle()
  if (error) throw new Error(`settings query failed: ${error.code}`)
  return { avoidDays: data?.avoid_days ?? AVOID_DAYS_DEFAULT, defaultDiners: data?.default_diners ?? [] }
}

export const saveSettings = async (patch: Partial<AppSettings>): Promise<void> => {
  const row = {
    ...(patch.avoidDays !== undefined && { avoid_days: patch.avoidDays }),
    ...(patch.defaultDiners !== undefined && { default_diners: patch.defaultDiners }),
  }
  const { error } = await supabase.from("settings").upsert(row, { onConflict: "user_id" })
  if (error) throw new Error(`settings write failed: ${error.code}`)
}
