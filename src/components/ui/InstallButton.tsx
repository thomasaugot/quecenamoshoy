import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { useInstallPrompt } from "@/hooks/useInstallPrompt"

// "Instalar la app" when the browser offers it; the iOS steps on iPhone; nothing once installed.
export const InstallButton = () => {
  const t = useTranslations("pwa")
  const { canInstall, showIosHint, install } = useInstallPrompt()
  if (canInstall) return <Button variant="outlined" onClick={() => void install()} className="self-start">{t("install")}</Button>
  if (showIosHint) return <p className="text-body-sm">{t("iosHint")}</p>
  return null
}
