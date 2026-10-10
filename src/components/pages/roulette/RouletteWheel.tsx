import { useEffect, useRef } from "react"
import { useTranslations } from "use-intl"
import { useMotionPreference } from "@/hooks/useMotionPreference"
import { useRouletteContext } from "@/hooks/useRouletteContext"
import { useRouletteStore } from "@/stores/roulette-store"
import { spinWheel } from "@/utils/animations/wheel-spin"
import { buildWheel } from "@/utils/roulette"
import { arcPath, labelTransform, shortLabel, wheelSegments } from "@/utils/wheel"

const C = 120          // centre of the 240×240 viewBox
const R = 104          // wheel radius, inside the plate rim
const ORIGIN = `${C} ${C}`

// Palette slices; the text colour on each keeps 4.5:1
const SLICES = [
  { fill: "fill-primary", text: "fill-on-primary" },
  { fill: "fill-highlight", text: "fill-text" },
  { fill: "fill-accent-strong", text: "fill-on-accent" },
  { fill: "fill-sage-soft", text: "fill-text" },
  { fill: "fill-sage", text: "fill-on-primary" },
  { fill: "fill-surface", text: "fill-text" },
  { fill: "fill-primary-hover", text: "fill-on-primary" },
  { fill: "fill-surface-2", text: "fill-text" },
] as const

// The wheel is a plate seen from above: an ink rim, slices for the dishes, a knob in the middle,
// and a fixed pointer at the top. Equal slices; tonight's weights decide the odds.
export const RouletteWheel = () => {
  const t = useTranslations("roulette.wheel")
  const rootRef = useRef<HTMLDivElement>(null)
  const ctx = useRouletteContext()
  const { slots, rotation, spinning, load, endSpin } = useRouletteStore()
  const { preference } = useMotionPreference()

  // A first wheel to look at before any spin (no preference yet)
  useEffect(() => {
    if (ctx && slots.length === 0) load(buildWheel(ctx, Math.random))
  }, [ctx, slots.length, load])

  useEffect(() => {
    const root = rootRef.current
    if (!root || !spinning) return
    void spinWheel(root, rotation, preference === "reduced", ORIGIN).then(endSpin)
  }, [rotation, spinning, preference, endSpin])

  const segments = wheelSegments(slots)

  return (
    <div ref={rootRef} data-anim="pin" className="invisible w-full max-w-sm lg:w-[min(34rem,calc(100svh-23rem))] lg:max-w-none">
      <svg viewBox="0 0 240 240" role="img" aria-label={t("label", { count: slots.length })} className="block h-auto w-full overflow-visible">
        <circle cx={C} cy={C + 4} r={116} className="fill-border opacity-60" />
        <circle cx={C} cy={C} r={116} className="fill-text" />
        <g data-anim="wheel">
          {slots.map((slot, i) => {
            const segment = segments[i]
            const tone = SLICES[i % SLICES.length] ?? SLICES[0]
            if (!segment) return null
            return (
              <g key={slot.dish.id}>
                <path d={arcPath(C, C, R, segment)} className={`${tone.fill} stroke-text`} strokeWidth="0.6" />
                <text transform={labelTransform(C, C, R * 0.58, segment)} textAnchor="middle" dominantBaseline="middle"
                  fontSize="7" className={`font-sans ${tone.text}`}>
                  {shortLabel(slot.dish.name)}
                </text>
              </g>
            )
          })}
        </g>
        <circle cx={C} cy={C} r={13} className="fill-text" />
        <circle cx={C} cy={C} r={6} className="fill-accent" />
        <path d={`M ${C - 9} 0 L ${C + 9} 0 L ${C} 20 Z`} className="fill-accent-strong stroke-text" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
