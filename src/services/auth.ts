import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { RateLimitedError } from "@/utils/errors"

export const getSession = async (): Promise<Session | null> => {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(`getSession failed: ${error.name}`)
  return data.session
}

export const onSessionChange = (callback: (session: Session | null) => void): (() => void) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

// Sign-ups are disabled in the Supabase dashboard: one account (brief §3.1).
export const signInWithPassword = async (email: string, password: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`signIn failed: ${error.status ?? "unknown"}`)
}

// Magic link for the EXISTING account only: shouldCreateUser false, sign-ups stay closed.
// 429 = Supabase's email limit (built-in mailer: a few emails an hour, one per address a minute).
export const sendMagicLink = async (email: string, redirectTo: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
  })
  if (error?.status === 429) throw new RateLimitedError("magic-link")
  if (error) throw new Error(`magic link failed: ${error.status ?? "unknown"}`)
}

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(`signOut failed: ${error.status ?? "unknown"}`)
}
