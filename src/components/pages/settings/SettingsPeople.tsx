import { useState } from "react"
import { useTranslations } from "use-intl"
import { SettingsAddPerson } from "@/components/pages/settings/SettingsAddPerson"
import { SettingsPerson } from "@/components/pages/settings/SettingsPerson"
import { usePeople } from "@/hooks/usePeople"

export const SettingsPeople = () => {
  const t = useTranslations("settings.people")
  const { data: people = [] } = usePeople()
  // one sheet open at a time, so the page stays a short list of names
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <section aria-labelledby="settings-people" className="flex flex-col gap-6">
      <div data-anim="rise" className="invisible">
        <h2 id="settings-people" className="text-heading">{t("title")}</h2>
        <p className="text-body mt-1 max-w-[52ch] text-text-soft">{t("intro")}</p>
      </div>
      <ul className="flex flex-col gap-6">
        {people.map((person) => (
          <li key={person.id} data-anim="rise" className="invisible">
            <SettingsPerson person={person} open={openId === person.id} onToggle={() => setOpenId(openId === person.id ? null : person.id)} />
          </li>
        ))}
      </ul>
      <div data-anim="rise" className="invisible">
        <SettingsAddPerson hasMe={people.some((p) => p.isMe)} />
      </div>
    </section>
  )
}
