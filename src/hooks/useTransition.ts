import { useContext } from "react"
import { TransitionContext } from "@/contexts/TransitionContext"

export const useTransition = () => {
  const value = useContext(TransitionContext)
  if (!value) throw new Error("TransitionContext missing — mount TransitionProvider inside the router")
  return value
}
