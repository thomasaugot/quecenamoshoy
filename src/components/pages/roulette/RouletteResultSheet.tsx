import { useState } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useRouletteWinner } from "@/hooks/useRouletteWinner"
import { useRouletteStore } from "@/stores/roulette-store"
import { initialOf } from "@/utils/people"

// Phones: the moment the wheel stops, the page dims and what it picked rises from the bottom —
// it can't end up off screen. Closing it (outside tap, Escape, ✕) keeps the wheel as it landed;
// the next spin brings a new sheet.
export const RouletteResultSheet = () => {
  const t = useTranslations("roulette.result")
  const desktop = useMediaQuery("(min-width: 1024px)")
  const rotation = useRouletteStore((s) => s.rotation)
  const [closedAt, setClosedAt] = useState<number | null>(null)
  const { dish, eat, eating, again } = useRouletteWinner()
  const open = !desktop && !!dish && closedAt !== rotation

  return (
    <Modal isOpen={open} onClose={() => setClosedAt(rotation)} title={t("tonight")} size="sheet">
      {dish && (
        <div aria-live="polite" className="flex flex-col items-center gap-5 text-center">
          {dish.imageUrl ? (
            <img src={dish.imageUrl} alt="" width={240} height={240} decoding="async" className="photo-frame aspect-square w-32 -rotate-3" />
          ) : (
            <div aria-hidden="true" className="flex aspect-square w-32 -rotate-3 items-center justify-center rounded-sm border-6 border-surface bg-surface-2 shadow-md">
              <span className="text-voice-lg text-accent">{initialOf(dish.name)}</span>
            </div>
          )}
          <p className="text-title">{dish.name}</p>
          <div className="flex w-full flex-col gap-2">
            <Button size="lg" onClick={eat} loading={eating} className="w-full">{t("eat")}</Button>
            <Button size="lg" variant="outlined" onClick={again} className="w-full">{t("again")}</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
