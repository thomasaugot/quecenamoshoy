import { useRef } from "react"
import { Navigate } from "react-router"
import { useLocale } from "use-intl"
import { PageMeta } from "@/components/layout/PageMeta"
import { LoginCollage } from "@/components/pages/login/LoginCollage"
import { LoginForm } from "@/components/pages/login/LoginForm"
import { LoginIntro } from "@/components/pages/login/LoginIntro"
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher"
import { useAuth } from "@/hooks/useAuth"
import { useEntrance } from "@/hooks/useEntrance"
import { localizedPath } from "@/i18n/paths"
import { initPinDrop } from "@/utils/animations/pin-drop"

// Mobile first (design "Entrar", 390×844): one column, actions at the thumb.
// lg: the design's desktop frame — 1240px container, collage left, text column right, centred.
export const LoginPage = () => {
  const rootRef = useRef<HTMLDivElement>(null)
  const { session } = useAuth()
  const locale = useLocale()
  useEntrance(rootRef, initPinDrop)

  if (session) return <Navigate to={localizedPath("home", locale)} replace />

  return (
    <>
      <PageMeta page="login" />
      <div
        ref={rootRef}
        className="relative mx-auto flex min-h-svh w-full max-w-md flex-col lg:grid lg:max-w-310 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-16"
      >
        <div className="flex justify-end px-4 pt-[calc(0.5rem+env(safe-area-inset-top))] lg:absolute lg:top-6 lg:right-8 lg:p-0">
          <LanguageSwitcher />
        </div>
        <LoginCollage />
        <div className="flex grow flex-col lg:max-w-100 lg:grow-0">
          <LoginIntro />
          <LoginForm />
        </div>
      </div>
    </>
  )
}
