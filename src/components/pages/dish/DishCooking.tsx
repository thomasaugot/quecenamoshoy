import { useEffect, useState } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconArrow, IconClose } from "@/components/ui/Icons"
import { Modal } from "@/components/ui/Modal"
import { useCountdown } from "@/hooks/useCountdown"
import { useSwipe } from "@/hooks/useSwipe"
import { useWakeLock } from "@/hooks/useWakeLock"
import type { Recipe } from "@/types/recipe"
import { announce } from "@/utils/announce"
import { formatCountdown, stepMinutes } from "@/utils/recipes"

// Cooking mode: the whole screen, one step at a time in big type, read from across the
// counter. Swipe, tap or arrow keys to move; the screen stays on; ingredients a tap away;
// a step with a time gets a one-tap timer that vibrates when it's done.
export const DishCooking = ({ name, recipe, onClose }: { name: string; recipe: Recipe; onClose: () => void }) => {
  const t = useTranslations("dish.cooking")
  const [index, setIndex] = useState(0)
  const [showIngredients, setShowIngredients] = useState(false)
  const last = recipe.steps.length - 1
  const step = recipe.steps[index] ?? ""
  const minutes = stepMinutes(step)
  const timer = useCountdown(() => announce(t("timerDone"), "assertive"))
  const next = () => setIndex((i) => Math.min(last, i + 1))
  const previous = () => setIndex((i) => Math.max(0, i - 1))
  const swipe = useSwipe(next, previous)
  useWakeLock(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next()
      if (e.key === "ArrowLeft") previous()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  return (
    <Modal isOpen onClose={onClose} title={name} size="full">
      <div className="flex grow flex-col gap-6 lg:mx-auto lg:w-full lg:max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-label" aria-live="polite">{t("step", { current: index + 1, total: last + 1 })}</p>
          <Button variant="outlined" size="sm" aria-expanded={showIngredients} aria-controls="cooking-ingredients"
            onClick={() => setShowIngredients((v) => !v)}>
            {showIngredients ? t("hideIngredients") : t("ingredients")}
          </Button>
        </div>

        {showIngredients && (
          <ul id="cooking-ingredients" className="-rotate-1 flex flex-col gap-2 rounded-sm bg-paper p-5 shadow-md">
            {recipe.ingredients.map((i, n) => (
              <li key={n} className="text-body flex gap-3">
                {i.quantity && <span className="shrink-0 text-accent-strong">{i.quantity}</span>}
                <span>{i.item}</span>
              </li>
            ))}
          </ul>
        )}

        <div {...swipe} className="flex grow touch-pan-y flex-col justify-center gap-6 py-4 select-none">
          <span aria-hidden="true" className="text-display text-primary">{index + 1}</span>
          <p className="text-title">{step}</p>
          {minutes && (
            timer.remaining !== null ? (
              <div className="flex items-center gap-4">
                <span role="timer" className="text-display text-accent-strong">{formatCountdown(timer.remaining)}</span>
                <Button variant="ghost" size="icon" aria-label={t("stopTimer")} onClick={timer.stop}
                  icon={<IconClose className="h-5 w-5 shrink-0" />} />
              </div>
            ) : (
              <Button variant="outlined" size="lg" onClick={() => timer.start(minutes * 60)} className="self-start">
                {t("startTimer", { count: minutes })}
              </Button>
            )
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pb-[env(safe-area-inset-bottom)]">
          <Button variant="outlined" size="lg" onClick={previous} disabled={index === 0}
            icon={<IconArrow className="h-5 w-5 shrink-0 rotate-180" />}>{t("previous")}</Button>
          {index < last ? (
            <Button size="lg" onClick={next} icon={<IconArrow className="h-5 w-5 shrink-0" />}>{t("next")}</Button>
          ) : (
            <Button size="lg" onClick={onClose}>{t("done")}</Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
