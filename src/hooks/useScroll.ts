import { useContext } from "react"
import { ScrollContext } from "@/contexts/ScrollContext"

export const useScroll = () => {
  const value = useContext(ScrollContext)
  if (!value) throw new Error("ScrollContext missing — mount ScrollProvider in Providers")
  return value
}
