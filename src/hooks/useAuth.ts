import { useContext } from "react"
import { AuthContext } from "@/contexts/AuthContext"

export const useAuth = () => {
  const value = useContext(AuthContext)
  if (!value) throw new Error("AuthContext missing — mount AuthProvider in Providers")
  return value
}
