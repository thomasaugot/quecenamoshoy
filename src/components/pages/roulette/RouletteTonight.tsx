import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Chip } from "@/components/ui/Chip"
import { Stepper } from "@/components/ui/Stepper"
import { KITCHEN_LOCATIONS } from "@/constants/equipment"
import { GUESTS_MAX } from "@/constants/meal"
import { useNow } from "@/hooks/useNow"
import { usePeople } from "@/hooks/usePeople"
import { useRouletteStore } from "@/stores/roulette-store"
import { isoDaysAgo } from "@/utils/dates"
import { toggleId } from "@/utils/people"
import { writeToday } from "@/utils/today"

// Tonight: where I am and who eats. Already said today → one line, tap to change.
// The entrance animates the wrapper, which never changes: the line and the panel swap inside it
// right after mount (useRouletteStart), and a swapped-in `invisible` node would stay hidden.
export const RouletteTonight = () => {
  const t = useTranslations("roulette.tonight")
  const now = useNow()
  const { data: people = [] } = usePeople()
  const { location, diners, guests, editingTonight, setTonight, setEditingTonight } = useRouletteStore()
  const names = people.filter((p) => diners.includes(p.id)).map((p) => p.name).join(", ")

  const update = (patch: Partial<{ location: typeof location; diners: string[]; guests: number }>) => {
    setTonight(patch)
    writeToday({ date: isoDaysAgo(0, now), location, diners, guests, ...patch })
  }

  return (
    <div data-anim="rise" className="invisible">
      {editingTonight ? (
        <section aria-labelledby="roulette-tonight" className="flex flex-col gap-4 rounded-xl bg-surface-2 p-5">
          <h2 id="roulette-tonight" className="text-label">{t("label")}</h2>
          <div role="group" aria-label={t("where")} className="flex flex-wrap gap-2">
            {KITCHEN_LOCATIONS.map((loc) => (
              <Chip key={loc} tone="diet" pressed={location === loc} onClick={() => update({ location: loc })}>{t(loc)}</Chip>
            ))}
          </div>
          <div role="group" aria-label={t("who")} className="flex flex-wrap gap-2">
            {people.map((p) => (
              <Chip key={p.id} tone="diet" pressed={diners.includes(p.id)} onClick={() => update({ diners: toggleId(diners, p.id) })}>{p.name}</Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-body-sm">{t("guests")}</span>
            <Stepper value={guests} min={0} max={GUESTS_MAX} onChange={(g) => update({ guests: g })}
              label={t("guests")} decreaseLabel={t("guestsLess")} increaseLabel={t("guestsMore")} />
          </div>
          <Button variant="outlined" size="sm" onClick={() => setEditingTonight(false)} className="self-start">{t("done")}</Button>
        </section>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-label">{t("label")}</span>
          <span className="text-voice">{t(location)} · {names}{guests ? ` +${guests}` : ""}</span>
          <Button variant="link" onClick={() => setEditingTonight(true)}>{t("change")}</Button>
        </div>
      )}
    </div>
  )
}
