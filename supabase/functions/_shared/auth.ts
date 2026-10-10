import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { env } from "./env.ts"

// The caller's own client: every query runs under THEIR row-level security, never the
// service role. The user comes from the verified token, never from the body (11-SECURITY).
export const requireUser = async (req: Request): Promise<{ client: SupabaseClient; userId: string } | null> => {
  const authorization = req.headers.get("Authorization")
  if (!authorization?.startsWith("Bearer ")) return null
  const client = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: authorization } },
  })
  const { data, error } = await client.auth.getUser(authorization.slice("Bearer ".length))
  if (error || !data.user) return null
  return { client, userId: data.user.id }
}
