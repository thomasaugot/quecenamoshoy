import { useContext } from "react"
import { MotionPreferenceContext } from "@/contexts/MotionPreferenceContext"

export const useMotionPreference = () => {
  const value = useContext(MotionPreferenceContext)
  if (!value) throw new Error("MotionPreferenceContext missing — mount MotionPreferenceProvider")
  return value
}
