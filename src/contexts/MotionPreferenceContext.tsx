import { createContext, useState, type ReactNode } from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"

export type MotionPreference = "full" | "reduced"
export type MotionPreferenceValue = {
  preference: MotionPreference
  setPreference: (preference: MotionPreference) => void
}

export const MotionPreferenceContext = createContext<MotionPreferenceValue | null>(null)

const STORAGE_KEY = "motion-preference"

const readStored = (): MotionPreference | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "full" || stored === "reduced" ? stored : null
  } catch {
    return null
  }
}

// Three layers (05-ANIMATIONS): system preference → app override → persisted override.
export const MotionPreferenceProvider = ({ children }: { children: ReactNode }) => {
  const systemReduced = useMediaQuery("(prefers-reduced-motion: reduce)")
  const [override, setOverride] = useState<MotionPreference | null>(readStored)

  const setPreference = (next: MotionPreference) => {
    setOverride(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* private mode: in-memory only */ }
  }

  const preference: MotionPreference = override ?? (systemReduced ? "reduced" : "full")
  const value = { preference, setPreference }
  return <MotionPreferenceContext.Provider value={value}>{children}</MotionPreferenceContext.Provider>
}
