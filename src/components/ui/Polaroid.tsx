import { TransitionLink } from "@/components/ui/TransitionLink"
import { initialOf } from "@/utils/people"

// Alternating tilts so a row of photos reads as pinned by hand
const TILTS = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3"] as const

// A dish photo with a handwritten caption. No photo: the dish's initial on note paper.
// With `href`, the whole polaroid (photo and caption) is one link.
export const Polaroid = ({ imageUrl, title, caption, index, href }: {
  imageUrl: string | null
  title: string
  caption: string
  index: number
  href?: string
}) => {
  const tilt = TILTS[index % TILTS.length]
  const figure = (
    <figure className="flex w-28 shrink-0 flex-col gap-2 lg:w-full">
      {imageUrl ? (
        <img src={imageUrl} alt={title} width={224} height={224} loading="lazy" decoding="async"
          className={`photo-frame-sm aspect-square w-full ${tilt}`} />
      ) : (
        <div aria-hidden="true" className={`flex aspect-square w-full items-center justify-center rounded-xs border-3 border-surface bg-paper shadow-sm ${tilt}`}>
          <span className="text-voice-lg text-accent">{initialOf(title)}</span>
        </div>
      )}
      <figcaption className="flex flex-col">
        <span className="text-note line-clamp-2">{title}</span>
        <span className="text-body-sm">{caption}</span>
      </figcaption>
    </figure>
  )
  return href ? (
    <TransitionLink href={href} className="keyboard-focus-ring group block w-28 shrink-0 rounded-sm lg:w-full [&_img]:transition-transform hover:[&_img]:-translate-y-1 hover:[&_img]:rotate-0">
      {figure}
    </TransitionLink>
  ) : figure
}
