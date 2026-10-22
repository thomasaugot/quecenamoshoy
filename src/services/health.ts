import { FunctionsHttpError } from "@supabase/supabase-js"
import type { Locale } from "@/config/i18n.config"
import { supabase } from "@/lib/supabase"
import type { HealthReport, HealthTips } from "@/types/health"
import { functionErrorCode, RateLimitedError } from "@/utils/errors"

// The month's figures read back as three changes (Edge Function health-tips). Figures only.
export const fetchHealthTips = async ({ report, language }: { report: HealthReport; language: Locale }): Promise<HealthTips> => {
  const { data, error } = await supabase.functions.invoke<HealthTips>("health-tips", { body: { ...report, language } })
  if (error instanceof FunctionsHttpError && error.context.status === 429) throw new RateLimitedError("health-tips")
  if (error || !data) throw new Error(`health tips failed: ${await functionErrorCode(error)}`)
  return data
}
