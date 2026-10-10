import { useTranslations } from "use-intl"
import { useRouletteContext } from "@/hooks/useRouletteContext"
import { useRouletteStore } from "@/stores/roulette-store"
import { showToast } from "@/stores/toast-store"
import { buildWheel, hasPreference, pickWeighted } from "@/utils/roulette"
import { landingRotation, wheelSegments } from "@/utils/wheel"

const TURNS = 6

// A spin: fresh wheel from tonight's rules and preference, the winner drawn by weight, and the
// rotation that lands it under the pointer. The wheel component animates to it.
export const useSpin = () => {
  const t = useTranslations("roulette.toasts")
  const ctx = useRouletteContext()
  const rotation = useRouletteStore((s) => s.rotation)
  const startSpin = useRouletteStore((s) => s.startSpin)
  return () => {
    if (!ctx) return
    const slots = buildWheel(ctx, Math.random)
    if (!slots.length) return showToast(t("empty"), "warning")
    if (hasPreference(ctx.preference) && !slots.some((s) => s.matches)) showToast(t("noMatch"), "info")
    const winner = pickWeighted(slots, Math.random)
    const segment = wheelSegments(slots)[winner]
    if (!segment) return
    startSpin(slots, winner, landingRotation(rotation, segment, TURNS, Math.random()))
  }
}
