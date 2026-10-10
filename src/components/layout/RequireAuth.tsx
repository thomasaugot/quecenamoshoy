import { Navigate, Outlet } from "react-router"
import { useLocale } from "use-intl"
import { PageLoading } from "@/components/ui/PageLoading"
import { useAuth } from "@/hooks/useAuth"
import { localizedPath } from "@/i18n/paths"

// UX guard only — the data is protected by RLS, not by this component (11-SECURITY).
export const RequireAuth = () => {
  const { session, isLoading } = useAuth()
  const locale = useLocale()
  if (isLoading) return <PageLoading />
  if (!session) return <Navigate to={localizedPath("login", locale)} replace />
  return <Outlet />
}
