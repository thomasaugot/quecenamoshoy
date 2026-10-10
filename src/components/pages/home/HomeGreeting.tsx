import { useFormatter, useTranslations } from "use-intl"
import { useMe } from "@/hooks/useHomeData"
import { useNow } from "@/hooks/useNow"

export const HomeGreeting = () => {
  const t = useTranslations("home")
  const format = useFormatter()
  const now = useNow()
  const me = useMe()
  const name = me.data?.name

  return (
    <header className="flex flex-col gap-2">
      <p data-anim="rise" className="invisible text-label">
        {format.dateTime(now, { weekday: "long" })} · {format.dateTime(now, { hour: "2-digit", minute: "2-digit" })}
      </p>
      <h1 data-anim="rise" className="invisible text-display">
        {name ? t.rich("greetingNamed", { name, em: (chunks) => <em>{chunks}</em> }) : t("greeting")}
      </h1>
      <p data-anim="rise" className="invisible text-voice-lg text-primary">{t("question")}</p>
    </header>
  )
}
