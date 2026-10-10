import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Cloche } from "@/components/ui/Cloche"
import { IconAddToHome, IconCheck, IconShare } from "@/components/ui/Icons"
import { Modal } from "@/components/ui/Modal"
import { useInstallPrompt } from "@/hooks/useInstallPrompt"
import type { InstallPlatform } from "@/types/install"

const PERKS = ["standalone", "offline", "oneTap"] as const

// The install offer: the cloche lifting its lid, why it's worth it, then either the browser's
// own install (Chrome, Android, desktop) or the three iPhone steps (Safari has no prompt).
export const InstallModal = ({ platform, onClose, onLater }: {
  platform: Exclude<InstallPlatform, null>
  onClose: () => void
  onLater: () => void
}) => {
  const t = useTranslations("pwa.offer")
  const { install } = useInstallPrompt()

  return (
    <Modal isOpen onClose={onLater} title={t("title")}>
      <div className="flex flex-col gap-7">
        <div className="flex items-center gap-5">
          <Cloche inLoader className="h-20 shrink-0" />
          <p className="text-voice text-primary">{t("note")}</p>
        </div>

        <ul className="flex flex-col gap-3">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-3">
              <IconCheck className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <span className="text-body">{t(`perks.${perk}`)}</span>
            </li>
          ))}
        </ul>

        {platform === "ios" ? (
          <ol aria-label={t("iosTitle")} className="-rotate-1 flex flex-col gap-4 rounded-sm bg-paper p-5 shadow-md">
            <li className="flex items-center gap-3">
              <span className="text-voice-lg w-6 shrink-0 text-accent-strong">1</span>
              <span className="text-body">{t("ios.share")}</span>
              <IconShare className="h-5 w-5 shrink-0 text-info" />
            </li>
            <li className="flex items-center gap-3">
              <span className="text-voice-lg w-6 shrink-0 text-accent-strong">2</span>
              <span className="text-body">{t("ios.add")}</span>
              <IconAddToHome className="h-5 w-5 shrink-0 text-info" />
            </li>
            <li className="flex items-center gap-3">
              <span className="text-voice-lg w-6 shrink-0 text-accent-strong">3</span>
              <span className="text-body">{t("ios.confirm")}</span>
            </li>
          </ol>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {platform === "prompt" ? (
            <Button size="lg" onClick={() => void install().then(onClose)}>{t("install")}</Button>
          ) : (
            <Button size="lg" onClick={onClose}>{t("gotIt")}</Button>
          )}
          <Button size="lg" variant="ghost" onClick={onLater}>{t("later")}</Button>
        </div>
      </div>
    </Modal>
  )
}
