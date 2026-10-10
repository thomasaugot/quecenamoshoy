import { createClient } from "@supabase/supabase-js"
import { appConfig } from "@/config/app.config"
import type { Database } from "@/types/database"

// Publishable key only: row-level security is the guard (11-SECURITY).
export const supabase = createClient<Database>(appConfig.supabaseUrl, appConfig.supabaseKey)
