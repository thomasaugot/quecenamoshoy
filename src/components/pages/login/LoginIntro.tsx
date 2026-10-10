import { useTranslations } from "use-intl"
import { Cloche } from "@/components/ui/Cloche"

export const LoginIntro = () => {
  const t = useTranslations("login.hero")
  return (
    <div className="px-6 pt-2.5 lg:px-0 lg:pt-0">
      <div data-anim="rise" className="invisible mb-3">
        <Cloche className="h-16 lg:h-20" />
      </div>
      <h1 data-anim="rise" className="invisible text-display">
        {t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}
      </h1>
      <p data-anim="rise" className="invisible text-voice mt-1.5 lg:mt-3">{t("tagline")}</p>
    </div>
  )
}
