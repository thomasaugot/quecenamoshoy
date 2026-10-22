import { useLocale, useTranslations } from "use-intl"
import { FavouritesHearts } from "@/components/pages/favourites/FavouritesHearts"
import { Button } from "@/components/ui/Button"
import { IconEdit } from "@/components/ui/Icons"
import { TransitionLink } from "@/components/ui/TransitionLink"
import { localizedPath } from "@/i18n/paths"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useFavouritesStore } from "@/stores/favourites-store"
import type { Dish } from "@/types/dish"
import { initialOf } from "@/utils/people"

// Alternating tilts: photos pinned by hand, as on the home page
const TILTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-0"] as const

export const FavouritesCard = ({ dish, index }: { dish: Dish; index: number }) => {
  const t = useTranslations("favourites.card")
  const label = useCatalogueLabel()
  const openEditor = useFavouritesStore((s) => s.openEditor)
  const locale = useLocale()
  const tilt = TILTS[index % TILTS.length]

  return (
    // The whole card opens the dish: the title's link stretches over it (after:inset-0). The
    // pencil and the hearts are positioned and come later in the DOM, so they sit above it.
    <article aria-labelledby={`dish-${dish.id}`} className="group relative flex w-full flex-col gap-3">
      {dish.imageUrl ? (
        <img src={dish.imageUrl} alt="" width={320} height={320} loading={index < 8 ? "eager" : "lazy"} decoding="async"
          className={`photo-frame aspect-square w-full transition-transform group-hover:-translate-y-1 group-hover:rotate-0 ${tilt}`} />
      ) : (
        <div aria-hidden="true"
          className={`flex aspect-square w-full items-center justify-center rounded-sm border-6 border-surface bg-paper shadow-lg transition-transform group-hover:-translate-y-1 group-hover:rotate-0 ${tilt}`}>
          <span className="text-voice-lg text-accent">{initialOf(dish.name)}</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={`dish-${dish.id}`} className="text-subheading line-clamp-2">
            <TransitionLink href={localizedPath("dish", locale, { dishId: dish.id })}
              className="keyboard-focus-ring rounded-sm group-hover:text-primary group-hover:underline group-hover:underline-offset-4 after:absolute after:inset-0 after:content-['']">
              {dish.name}
            </TransitionLink>
          </h3>
          {dish.proteins.length > 0 && <p className="text-body-sm">{dish.proteins.map((x) => label("protein", x)).join(" · ")}</p>}
        </div>
        <Button variant="ghost" size="icon" aria-label={t("edit", { name: dish.name })}
          onClick={() => openEditor(dish.id)} icon={<IconEdit className="h-4 w-4 shrink-0" />} className="relative text-text-muted" />
      </div>
      <div className="relative self-start"><FavouritesHearts dish={dish} /></div>
    </article>
  )
}
