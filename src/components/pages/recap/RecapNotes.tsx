import { useFormatter, useTranslations } from "use-intl"
import { RatingStars } from "@/components/ui/RatingStars"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import type { MonthRecap } from "@/types/meal"
import { dateFromIso } from "@/utils/dates"

const PROTEIN_FILL: Record<string, string> = {
  red_meat: "bg-accent-strong", pork: "bg-accent", poultry: "bg-highlight-deep", fish: "bg-primary",
  seafood: "bg-primary-hover", eggs: "bg-highlight", vegetarian: "bg-sage", vegan: "bg-sage-soft", unknown: "bg-border",
}

// Side notes pinned beside the podium: the firsts, the best dinner, and what was on the plate
// as one strip split by protein (with the numbers written out — never colour alone).
export const RecapNotes = ({ recap }: { recap: MonthRecap }) => {
  const t = useTranslations("recap.notes")
  const label = useCatalogueLabel()
  const format = useFormatter()
  if (recap.dinners === 0) return null

  return (
    <div className="flex flex-col gap-6">
      <aside aria-labelledby="recap-new" data-anim="rise" className="invisible rotate-1 rounded-sm bg-paper p-5 shadow-md">
        <h2 id="recap-new" className="text-voice-lg">{t("newTitle", { count: recap.newDishes.length })}</h2>
        {recap.newDishes.length > 0 && <p className="text-body mt-2">{recap.newDishes.join(" · ")}</p>}
      </aside>

      {recap.best && (
        <aside aria-labelledby="recap-best" data-anim="rise" className="invisible -rotate-1 rounded-sm bg-highlight/40 p-5 shadow-md">
          <h2 id="recap-best" className="text-label">{t("bestTitle")}</h2>
          <p className="text-heading mt-2">{recap.best.dishName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            {recap.best.rating !== null && <RatingStars value={recap.best.rating} label={t("rating", { rating: recap.best.rating })} />}
            <span className="text-body-sm">{format.dateTime(dateFromIso(recap.best.eatenOn), { weekday: "long", day: "numeric" })}</span>
          </div>
          {recap.averageRating !== null && <p className="text-note mt-2 text-text-soft">{t("average", { rating: recap.averageRating })}</p>}
        </aside>
      )}

      <section aria-labelledby="recap-plate" data-anim="rise" className="invisible flex flex-col gap-3 rounded-xl bg-surface-2 p-5">
        <h2 id="recap-plate" className="text-label">{t("plateTitle")}</h2>
        {/* one equal cell per dinner, coloured by protein: the strip is proportional by itself */}
        <div aria-hidden="true" className="flex h-4 w-full gap-px overflow-hidden rounded-full">
          {recap.proteins.flatMap((p) => Array.from({ length: p.count }, (_, i) => (
            <span key={`${p.key}-${i}`} className={`h-full grow ${PROTEIN_FILL[p.key] ?? "bg-border"}`} />
          )))}
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {recap.proteins.map((p) => (
            <li key={p.key} className="text-body-sm flex items-center gap-1.5">
              <span aria-hidden="true" className={`h-3 w-3 shrink-0 rounded-full ${PROTEIN_FILL[p.key] ?? "bg-border"}`} />
              {p.key === "unknown" ? t("unknown") : label("protein", p.key)} · {p.count}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
