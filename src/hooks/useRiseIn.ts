import { useEffect, type RefObject } from "react"
import { useMotionPreference } from "@/hooks/useMotionPreference"
import { initRiseIn } from "@/utils/animations/rise-in"

// Re-plays the rise every time `key` changes (a new question, new results)
export const useRiseIn = (rootRef: RefObject<HTMLElement | null>, key: string) => {
  const { preference } = useMotionPreference()
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    return initRiseIn(root, preference === "reduced")
  }, [rootRef, key, preference])
}
