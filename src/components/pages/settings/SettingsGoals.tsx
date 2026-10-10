import { useTranslations } from "use-intl"
import { Checkbox } from "@/components/ui/Checkbox"
import { Stepper } from "@/components/ui/Stepper"
import { GOALS, PER_WEEK_MAX, PER_WEEK_MIN } from "@/constants/goals"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useSetGoal } from "@/hooks/usePeople"
import type { Person } from "@/types/person"
import { findGoal } from "@/utils/people"

// Soft nudges: tick a goal, then set how many times a week (brief §3.9).
export const SettingsGoals = ({ person }: { person: Person }) => {
  const t = useTranslations("settings.goals")
  const label = useCatalogueLabel()
  const setGoal = useSetGoal()
  const titleId = `${person.id}-goals`

  return (
    <div role="group" aria-labelledby={titleId} className="flex flex-col gap-2">
      <p className="flex items-baseline gap-3">
        <span id={titleId} className="text-label">{t("title")}</span>
        <span className="text-note text-primary">{t("note")}</span>
      </p>
      <ul className="flex flex-col gap-1">
        {GOALS.map((goal) => {
          const current = findGoal(person, goal.key)
          const name = label("goal", goal.key)
          return (
            <li key={goal.key} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <Checkbox
                name={`goal-${person.id}-${goal.key}`}
                checked={!!current}
                onChange={(on) => setGoal.mutate({ personId: person.id, key: goal.key, perWeek: on ? goal.defaultPerWeek : null })}
              >
                {name}
              </Checkbox>
              {current && (
                <div className="flex items-center gap-2 pl-9">
                  <span className="text-body-sm">{t(goal.kind)}</span>
                  <Stepper
                    value={current.perWeek}
                    min={PER_WEEK_MIN}
                    max={PER_WEEK_MAX}
                    onChange={(perWeek) => setGoal.mutate({ personId: person.id, key: goal.key, perWeek })}
                    label={`${name} — ${t(goal.kind)}`}
                    decreaseLabel={t("decrease")}
                    increaseLabel={t("increase")}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
