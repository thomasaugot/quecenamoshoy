import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { InstallButton } from "@/components/ui/InstallButton"
import { IconSignOut } from "@/components/ui/Icons"
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher"
import { Stepper } from "@/components/ui/Stepper"
import { TransitionLink } from "@/components/ui/TransitionLink"
import { localizedPath } from "@/i18n/paths"
import { AVOID_DAYS_MAX, AVOID_DAYS_MIN } from "@/constants/settings"
import { useMotionPreference } from "@/hooks/useMotionPreference"
import { usePeople } from "@/hooks/usePeople"
import { useSaveSettings, useSettings } from "@/hooks/useSettings"
import { useSignOut } from "@/hooks/useSignOut"
import { existingDiners, toggleId } from "@/utils/people"

// The house rules: a sand panel beside the table, sticky on wide screens.
export const SettingsGeneral = () => {
  const t = useTranslations("settings.general")
  const locale = useLocale()
  const { data: people = [] } = usePeople()
  const { data: settings } = useSettings()
  const save = useSaveSettings()
  const { preference, setPreference } = useMotionPreference()
  const signOut = useSignOut()
  if (!settings) return null
  const diners = existingDiners(settings.defaultDiners, people)

  return (
    <section
      aria-labelledby="settings-general"
      data-anim="rise"
      className="invisible flex flex-col gap-8 rounded-xl bg-surface-2 p-6 lg:sticky lg:top-28 lg:p-8"
    >
      <h2 id="settings-general" className="text-heading">{t("title")}</h2>

      <div className="flex flex-col gap-2">
        <p className="text-label">{t("avoid.label")}</p>
        <Stepper
          value={settings.avoidDays}
          min={AVOID_DAYS_MIN}
          max={AVOID_DAYS_MAX}
          onChange={(avoidDays) => save.mutate({ avoidDays })}
          label={t("avoid.label")}
          decreaseLabel={t("avoid.decrease")}
          increaseLabel={t("avoid.increase")}
          unit={t("avoid.unit")}
        />
        <p className="text-body-sm">{t("avoid.hint")}</p>
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-label mb-2">{t("diners.label")}</legend>
        {people.map((person) => (
          <Checkbox
            key={person.id}
            name={`diner-${person.id}`}
            checked={diners.includes(person.id)}
            onChange={() => save.mutate({ defaultDiners: toggleId(diners, person.id) })}
          >
            {person.name}
          </Checkbox>
        ))}
        <p className="text-body-sm mt-1">{t("diners.hint")}</p>
      </fieldset>

      <div className="flex flex-col gap-1">
        <p className="text-label">{t("kitchen.label")}</p>
        <TransitionLink href={localizedPath("kitchen", locale)} className="keyboard-focus-ring text-button self-start rounded-md text-primary underline underline-offset-4 hover:text-primary-hover">
          {t("kitchen.link")}
        </TransitionLink>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-label">{t("language")}</p>
        <LanguageSwitcher />
      </div>

      <Checkbox
        name="reduce-motion"
        checked={preference === "reduced"}
        onChange={(on) => setPreference(on ? "reduced" : "full")}
      >
        {t("motion")}
      </Checkbox>

      <InstallButton />

      <Button variant="outlined" onClick={() => void signOut()} icon={<IconSignOut className="h-5 w-5 shrink-0" />} className="self-start">
        {t("signOut")}
      </Button>
    </section>
  )
}
