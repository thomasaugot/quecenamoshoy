import { useRef } from "react"
import { IconDishBowl, IconDishBurger, IconDishFish, IconDishPot } from "@/components/ui/Icons"
import { useEntrance } from "@/hooks/useEntrance"
import { initClocheReveal } from "@/utils/animations/cloche-reveal"

// The animated logo: a serving cloche that lifts to reveal a different dish each time.
// Plate and lid are drawn here; the dishes are Phosphor icons. No photos, no generated art.
// The lid is visible at rest (it only rotates), so it is targeted with data-part, not the
// fade-in data-anim contract; the dishes are revealed one by one, so they ship `invisible`.
export const Cloche = ({ className = "", inLoader = false }: { className?: string; inLoader?: boolean }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  useEntrance(rootRef, initClocheReveal, { waitForLoader: !inLoader })

  return (
    <div ref={rootRef} aria-hidden="true" className={`aspect-[120/92] shrink-0 ${className}`}>
      <svg viewBox="0 0 120 92" className="block h-full w-full overflow-visible">
        {/* The plate is seen from slightly above (an ellipse), so the dish sits IN it: back rim
            and well first, then the dish on its shadow, then the front lip drawn over its base. */}
        <ellipse cx="60" cy="74" rx="46" ry="9" className="fill-text" />
        <ellipse cx="60" cy="74" rx="38" ry="6.5" className="fill-surface-2" />
        <ellipse cx="60" cy="77" rx="15" ry="2.6" className="fill-border" />
        {/* Phosphor's 256 grid has ~3 units of padding at size 34: y puts each base at 77, mid-well */}
        <IconDishBowl data-anim="cloche-dish" className="invisible text-primary" x="43" y="46" size={34} />
        <IconDishBurger data-anim="cloche-dish" className="invisible text-highlight-deep" x="43" y="46" size={34} />
        <IconDishFish data-anim="cloche-dish" className="invisible text-sage" x="43" y="46" size={34} />
        <IconDishPot data-anim="cloche-dish" className="invisible text-accent-strong" x="43" y="46" size={34} />
        <path d="M14 74 A46 9 0 0 0 106 74 L98 74 A38 6.5 0 0 1 22 74 Z" className="fill-text" />
        {/* the lid sits on the well's edge, leaving the rim visible all round */}
        <g data-part="cloche-lid">
          <path d="M22 74 A38 36 0 0 1 98 74 A38 6.5 0 0 1 22 74 Z" className="fill-accent" />
          <path d="M32 65 A30 28 0 0 1 48 45" fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-paper opacity-50" />
          <rect x="57" y="33" width="6" height="6" rx="1" className="fill-text" />
          <circle cx="60" cy="31" r="5.5" className="fill-text" />
        </g>
      </svg>
    </div>
  )
}
