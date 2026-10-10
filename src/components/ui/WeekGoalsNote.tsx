import { useLocale, useTranslations } from "use-intl"
import { TransitionLink } from "@/components/ui/TransitionLink"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useCountedMeals } from "@/hooks/useMeals"
import { useNow } from "@/hooks/useNow"
import { usePeople } from "@/hooks/usePeople"
import { localizedPath } from "@/i18n/paths"
import { startOfWeekIso } from "@/utils/dates"
import { goalProgress } from "@/utils/goals"

// "Esta semana: 1/2 carne roja, 0/1 vegano" (brief §3.9) — a handwritten note pinned on the
// page. Only people with goals appear; with none, it invites setting them. Used on the home
// and the history pages; the caller places it and animates it.
export const WeekGoalsNote = ({ headingId, className = "" }: { headingId: string; className?: string }) => {
  const t = useTranslations("weekGoals")
  const label = useCatalogueLabel()
  const locale = useLocale()
  const now = useNow()
  const { data: people = [] } = usePeople()
  const { data: meals = [] } = useCountedMeals(startOfWeekIso(now))
  const withGoals = people.filter((p) => p.goals.length > 0)

  return (
    <aside aria-labelledby={headingId} className={`-rotate-1 rounded-sm bg-paper p-6 shadow-lg ${className}`}>
      <h2 id={headingId} className="text-voice-lg">{t("title")}</h2>
      {withGoals.length === 0 ? (
        <div className="mt-2 flex flex-col items-start gap-2">
          <p className="text-body-sm">{t("none")}</p>
          <TransitionLink href={localizedPath("settings", locale)}
            className="keyboard-focus-ring text-button rounded-md text-primary underline underline-offset-4 hover:text-primary-hover">
            {t("setGoals")}
          </TransitionLink>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-5">
          {withGoals.map((person) => (
            <div key={person.id}>
              {people.length > 1 && <p className="text-label mb-2">{person.name}</p>}
              <ul className="flex flex-col gap-1.5">
                {goalProgress(person, meals).map((g) => (
                  <li key={g.key} className="flex items-baseline justify-between gap-3">
                    <span className="text-body">{label("goal", g.key)}</span>
                    <span className={`text-note shrink-0 ${g.met ? "text-primary" : "text-accent-strong"}`}>
                      {t(g.met ? "met" : "behind", { count: g.count, target: g.target })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
