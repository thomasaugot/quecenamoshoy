import { useId, useRef } from "react"
import { useEntrance } from "@/hooks/useEntrance"
import { initClocheReveal } from "@/utils/animations/cloche-reveal"

// The animated logo: a serving cloche that lifts on carbonara, a burger, a salad and sushi, in turn.
// Plate and lid are drawn here; the dishes are illustrations cut out of their backgrounds.
// The lid is visible at rest (it only rotates), so it is targeted with data-part, not the
// fade-in data-anim contract; the dishes are revealed one by one, so they ship `invisible`.
// plateOnly: the plate alone, no lid and no dish (the dev preview shows it beside the logo)
export const Cloche = ({ className = "", inLoader = false, plateOnly = false }: { className?: string; inLoader?: boolean; plateOnly?: boolean }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  // gradient ids must be unique per cloche on the page (navbar + loader + login can coexist)
  const uid = useId().replace(/[^\w-]/g, "")
  const body = `${uid}-body`, glow = `${uid}-glow`, shade = `${uid}-shade`, base = `${uid}-base`
  const ring = `${uid}-ring`, knob = `${uid}-knob`, collar = `${uid}-collar`
  const rim = `${uid}-rim`, well = `${uid}-well`, behindLid = `${uid}-behind-lid`
  useEntrance(rootRef, initClocheReveal, { waitForLoader: !inLoader })

  // the dome and its knob
  const dome = (
    <>
      <path d="M22.5 72 C22.5 49 39 35.5 60 35.5 C81 35.5 97.5 49 97.5 72 A37.5 6 0 0 1 22.5 72 Z" fill={`url(#${body})`} />
      <path d="M22.5 72 C22.5 49 39 35.5 60 35.5 C81 35.5 97.5 49 97.5 72 A37.5 6 0 0 1 22.5 72 Z" fill={`url(#${shade})`} />
      <path d="M22.5 72 C22.5 49 39 35.5 60 35.5 C81 35.5 97.5 49 97.5 72 A37.5 6 0 0 1 22.5 72 Z" fill={`url(#${glow})`} />
      <path d="M22.5 72 C22.5 49 39 35.5 60 35.5 C81 35.5 97.5 49 97.5 72 A37.5 6 0 0 1 22.5 72 Z" fill={`url(#${base})`} />
      {/* light along the top-left edge, a window reflected on the left, a soft one on the right */}
      <path d="M24.2 63 C25.5 48 40 37.3 58 37" fill="none" strokeWidth="1.1" strokeLinecap="round" className="stroke-paper opacity-55" />
      <path d="M30.5 64 C29 55 34 45.5 44.5 40.5 C38.5 46.5 35 55 35.5 64 Q33 67.5 30.5 64 Z" className="fill-paper opacity-80" />
      <ellipse cx="49" cy="41.2" rx="2.6" ry="1.3" transform="rotate(-22 49 41.2)" className="fill-paper opacity-90" />
      <path d="M89 66 C90.5 57 87.5 49 81 43.5 C85 50 87 58 86.5 66 Z" className="fill-paper opacity-20" />
      {/* the knob: collar, stem, ball */}
      <ellipse cx="60" cy="36" rx="7.5" ry="2" fill={`url(#${collar})`} />
      <rect x="57.6" y="30" width="4.8" height="6" rx="1" fill={`url(#${collar})`} />
      <circle cx="60" cy="27" r="5.2" fill={`url(#${knob})`} />
      <ellipse cx="58.2" cy="25.2" rx="1.6" ry="1.1" className="fill-paper opacity-80" />
    </>
  )

  // the box covers the lid's whole lift (straight up, slightly tilted), so no parent crops it
  return (
    <div ref={rootRef} aria-hidden="true" className={`aspect-[96/110] shrink-0 ${className}`}>
      <svg viewBox="12 -24 96 110" className="block h-full w-full overflow-visible">
        {/* light comes from the upper left, for the lid and the plate alike */}
        <defs>
          {/* lacquered terracotta: bright where the light hits, deepening to the far side */}
          <linearGradient id={body} gradientUnits="userSpaceOnUse" x1="22" y1="0" x2="98" y2="0">
            <stop offset="0" className="stop-accent-strong" />
            <stop offset="0.2" className="stop-accent" />
            <stop offset="0.5" className="stop-accent" />
            <stop offset="1" className="stop-accent-strong" />
          </linearGradient>
          <linearGradient id={shade} gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="98" y2="0">
            <stop offset="0" className="stop-text [stop-opacity:0]" />
            <stop offset="1" className="stop-text [stop-opacity:0.42]" />
          </linearGradient>
          <radialGradient id={glow} gradientUnits="userSpaceOnUse" cx="44" cy="46" r="26">
            <stop offset="0" className="stop-paper [stop-opacity:0.55]" />
            <stop offset="1" className="stop-paper [stop-opacity:0]" />
          </radialGradient>
          {/* the plate reflected low on the dome */}
          <linearGradient id={base} gradientUnits="userSpaceOnUse" x1="0" y1="56" x2="0" y2="78">
            <stop offset="0" className="stop-text [stop-opacity:0]" />
            <stop offset="1" className="stop-text [stop-opacity:0.35]" />
          </linearGradient>
          <linearGradient id={ring} gradientUnits="userSpaceOnUse" x1="22" y1="0" x2="98" y2="0">
            <stop offset="0" className="stop-accent-strong" />
            <stop offset="0.25" className="stop-accent" />
            <stop offset="0.6" className="stop-accent-strong" />
            <stop offset="1" className="stop-text-soft" />
          </linearGradient>
          <radialGradient id={knob} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" className="stop-text-muted" />
            <stop offset="0.5" className="stop-text-soft" />
            <stop offset="1" className="stop-text" />
          </radialGradient>
          <linearGradient id={collar} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" className="stop-text-soft" />
            <stop offset="0.35" className="stop-text-muted" />
            <stop offset="1" className="stop-text" />
          </linearGradient>
          {/* the plate: glazed stoneware lit from the same upper left */}
          {/* one gradient in plate coordinates for rim AND front lip, so they meet without a seam */}
          <linearGradient id={rim} gradientUnits="userSpaceOnUse" x1="30" y1="62" x2="78" y2="86">
            <stop offset="0" className="stop-text-soft" />
            <stop offset="0.55" className="stop-text" />
          </linearGradient>
          <radialGradient id={well} cx="0.45" cy="0.62" r="0.6">
            <stop offset="0" className="stop-text-soft" />
            <stop offset="1" className="stop-text" />
          </radialGradient>
          {/* the dish shows except where the lid's shell is in front of it; through the lid's
              opening it shows again. Its shapes move with the lid (data-part), so this holds at
              every height of the lift. */}
          <mask id={behindLid} maskUnits="userSpaceOnUse" x="-40" y="-60" width="200" height="180">
            <rect x="-40" y="-60" width="200" height="180" className="mask-show" />
            <g data-part="cloche-lid">
              <path d="M22.5 72 C22.5 49 39 35.5 60 35.5 C81 35.5 97.5 49 97.5 72 A37.5 6 0 0 1 22.5 72 Z" className="mask-hide" />
              {/* the opening only lets the dish through while the lid is up (fades with the rim) */}
              <ellipse data-anim="cloche-rim" cx="60" cy="73" rx="38" ry="5.5" className="invisible mask-show" />
            </g>
          </mask>
        </defs>
        {/* The plate is seen from slightly above (an ellipse): back rim and well, then the front
            lip, then the lid and the dish. */}
        {/* its thickness, showing under the front edge */}
        <ellipse cx="60" cy="75.8" rx="45.6" ry="9" className="fill-text" />
        <ellipse cx="60" cy="74" rx="46" ry="9" fill={`url(#${rim})`} />
        {/* light catching the back of the rim */}
        <path d="M24 70 A44 8 0 0 1 68 65.2" fill="none" strokeWidth="1.1" strokeLinecap="round" className="stroke-paper opacity-25" />
        <ellipse cx="60" cy="74" rx="38" ry="6.5" fill={`url(#${well})`} />
        {/* the inner wall where the rim steps down into the well, in shadow */}
        <path d="M22 74 A38 6.5 0 0 1 98 74 A38 5.4 0 0 0 22 74 Z" className="fill-text opacity-60" />
        <path d="M14 74 A46 9 0 0 0 106 74 L98 74 A38 6.5 0 0 1 22 74 Z" fill={`url(#${rim})`} />
        {/* the glaze's sheen on the front lip */}
        <path d="M30 80.4 A44 8.6 0 0 0 74 82.6" fill="none" strokeWidth="1" strokeLinecap="round" className="stroke-paper opacity-20" />
        {!plateOnly && (
          <>
            {/* The lid moves as layers: its shell and dark inside behind the dish, the dish masked
                by the shell, and the front of its base ring in front. */}
            <g data-part="cloche-lid">
              {dome}
              <ellipse data-anim="cloche-rim" cx="60" cy="73" rx="38" ry="5.5" className="invisible fill-accent-strong" />
            </g>
            <g mask={`url(#${behindLid})`}>
              {/* carbonara first, then burger, salad, sushi */}
              <image data-anim="cloche-dish" href="/assets/images/logo/carbonara.webp" x="34" y="44.6" width="52" height="33.4" className="invisible" />
              <image data-anim="cloche-dish" href="/assets/images/logo/burger.webp" x="40" y="43.4" width="40" height="34.6" className="invisible" />
              <image data-anim="cloche-dish" href="/assets/images/logo/salad.webp" x="34" y="42.9" width="52" height="35.1" className="invisible" />
              <image data-anim="cloche-dish" href="/assets/images/logo/sushi.webp" x="33" y="51.9" width="54" height="26.1" className="invisible" />
            </g>
            <g data-part="cloche-lid">
              <path d="M21.5 71.5 A38.5 6.2 0 0 0 98.5 71.5 L98.5 74.2 A38.5 6.7 0 0 1 21.5 74.2 Z" fill={`url(#${ring})`} />
              <path d="M25 73.4 A36 5.4 0 0 0 55 77.4" fill="none" strokeWidth="0.8" strokeLinecap="round" className="stroke-paper opacity-45" />
            </g>
          </>
        )}
      </svg>
    </div>
  )
}
