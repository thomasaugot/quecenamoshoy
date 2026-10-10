import type { Session } from "@supabase/supabase-js"
import { createContext, useEffect, useState, type ReactNode } from "react"
import { getSession, onSessionChange } from "@/services/auth"
import { logger } from "@/utils/logger"

export type AuthValue = { session: Session | null; isLoading: boolean }

export const AuthContext = createContext<AuthValue | null>(null)

// The session decides what the UI shows; RLS decides what the data allows (11-SECURITY).
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getSession()
      .then((current) => { if (!cancelled) setSession(current) })
      .catch((error: unknown) => logger.error("getSession failed", error))
      .finally(() => { if (!cancelled) setIsLoading(false) })
    const unsubscribe = onSessionChange((next) => setSession(next))
    return () => { cancelled = true; unsubscribe() }
  }, [])

  const value = { session, isLoading }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
