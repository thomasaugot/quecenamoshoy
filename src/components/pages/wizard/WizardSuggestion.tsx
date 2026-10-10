import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { TransitionLink } from "@/components/ui/TransitionLink"
import { IconAlert, IconHeart } from "@/components/ui/Icons"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useDishes } from "@/hooks/useDishes"
import { useNow } from "@/hooks/useNow"
import { usePeople } from "@/hooks/usePeople"
import { useAcceptSuggestion, useSaveSuggestion } from "@/hooks/useSuggest"
import { useTransition } from "@/hooks/useTransition"
import { localizedPath } from "@/i18n/paths"
import { useWizardStore } from "@/stores/wizard-store"
import type { Suggestion } from "@/types/suggestion"
import { isoDaysAgo } from "@/utils/dates"
import { initialOf } from "@/utils/people"
import { suggestionAllergens } from "@/utils/suggestions"

const TILTS = ["-rotate-2", "rotate-1", "-rotate-1"] as const

// One idea, as a recipe card with its photo pinned on. An allergen match replaces
// "Cenamos esto" with a warning (brief §3.8): the AI is never trusted alone.
export const WizardSuggestion = ({ suggestion: s, index }: { suggestion: Suggestion; index: number }) => {
  const t = useTranslations("wizard.suggestion")
  const label = useCatalogueLabel()
  const locale = useLocale()
  const now = useNow()
  const { navigateTo } = useTransition()
  const { data: people = [] } = usePeople()
  const { data: dishes = [] } = useDishes()
  const { answers, saved } = useWizardStore()
  const accept = useAcceptSuggestion()
  const save = useSaveSuggestion()
  const diners = people.filter((p) => answers.diners.includes(p.id))
  const allergens = suggestionAllergens(s, diners, answers.guestRestrictions)
  const imageUrl = s.dishId ? dishes.find((d) => d.id === s.dishId)?.imageUrl ?? null : null
  const savedId = saved[s.name] ?? null
  const me = people.find((p) => p.isMe)

  const eat = () =>
    accept.mutate({ suggestion: s, dishId: savedId, answers, todayIso: isoDaysAgo(0, now) },
      { onSuccess: () => void navigateTo(localizedPath("history", locale)) })

  return (
    <article aria-labelledby={`idea-${index}`} className="flex flex-col gap-5 rounded-xl bg-paper p-5 shadow-md md:flex-row md:items-start lg:p-6">
      {imageUrl ? (
        <img src={imageUrl} alt="" width={240} height={240} decoding="async"
          className={`photo-frame aspect-square w-32 shrink-0 md:w-36 ${TILTS[index % TILTS.length]}`} />
      ) : (
        <div aria-hidden="true" className={`flex aspect-square w-32 shrink-0 items-center justify-center rounded-sm border-6 border-surface bg-surface-2 shadow-md md:w-36 ${TILTS[index % TILTS.length]}`}>
          <span className="text-voice-lg text-accent">{initialOf(s.name)}</span>
        </div>
      )}
      <div className="flex min-w-0 grow flex-col gap-2">
        <p className="text-label">
          {s.isFavourite ? t("favourite") : t("newIdea")} · {t("minutes", { count: s.prepMinutes })}
        </p>
        <h3 id={`idea-${index}`} className="text-heading">{s.name}</h3>
        <p className="text-body text-text-soft">{s.description}</p>
        <p className="text-note text-primary">{s.reason}</p>

        {allergens.length > 0 ? (
          <p role="alert" className="mt-2 flex items-start gap-2 rounded-md bg-surface-2 p-3 text-body text-danger">
            <IconAlert className="mt-1 h-4 w-4 shrink-0" />
            {t("allergenWarning", { allergens: allergens.map((a) => a.label ?? label("allergy", a.key)).join(", ") })}
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button onClick={eat} loading={accept.isPending}>{t("eat")}</Button>
            {(s.dishId ?? savedId) && (
              <TransitionLink href={localizedPath("dish", locale, { dishId: s.dishId ?? savedId ?? "" })}
                className="keyboard-focus-ring text-button inline-flex min-h-12 items-center rounded-full px-4 text-primary underline underline-offset-4 hover:text-primary-hover">
                {t("recipe")}
              </TransitionLink>
            )}
            {!s.isFavourite && (
              <Button variant="outlined" disabled={!!savedId} loading={save.isPending}
                onClick={() => save.mutate({ suggestion: s, lovedBy: me ? [me.id] : [] })}
                icon={<IconHeart className="h-4 w-4 shrink-0" />}>
                {savedId ? t("saved") : t("save")}
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
