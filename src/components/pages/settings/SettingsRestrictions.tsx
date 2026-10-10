import { useTranslations } from "use-intl"
import { SettingsAddRestriction } from "@/components/pages/settings/SettingsAddRestriction"
import { Chip } from "@/components/ui/Chip"
import { RESTRICTION_CATALOGUE, RESTRICTION_TONE } from "@/constants/restrictions"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useSetRestriction } from "@/hooks/usePeople"
import type { RestrictionKind } from "@/types/database"
import type { Person } from "@/types/person"
import { customRestrictions, restrictionKeys } from "@/utils/people"

const NOTE_COLOUR: Record<RestrictionKind, string> = {
  allergy: "text-accent-strong",
  diet: "text-primary",
  dislike: "text-sage",
}

// One kind of rule for one person: a cloud of chips, each a tap to switch. My own typed
// entries sit at the end, already on; tapping one removes it.
export const SettingsRestrictions = ({ person, kind }: { person: Person; kind: RestrictionKind }) => {
  const t = useTranslations("settings.restrictions")
  const label = useCatalogueLabel()
  const setRestriction = useSetRestriction()
  const active = restrictionKeys(person, kind)
  const titleId = `${person.id}-${kind}`

  return (
    <div role="group" aria-labelledby={titleId} className="flex flex-col gap-3">
      <p className="flex items-baseline gap-3">
        <span id={titleId} className="text-label">{t(`${kind}.title`)}</span>
        <span className={`text-note ${NOTE_COLOUR[kind]}`}>{t(`${kind}.note`)}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {RESTRICTION_CATALOGUE[kind].map((key) => {
          const on = active.includes(key)
          return (
            <Chip
              key={key}
              tone={RESTRICTION_TONE[kind]}
              pressed={on}
              onClick={() => setRestriction.mutate({ personId: person.id, kind, key, on: !on })}
            >
              {label(kind, key)}
            </Chip>
          )
        })}
        {customRestrictions(person, kind).map((r) => (
          <Chip
            key={r.key}
            tone={RESTRICTION_TONE[kind]}
            pressed
            onClick={() => setRestriction.mutate({ personId: person.id, kind, key: r.key, on: false })}
          >
            {r.label}
          </Chip>
        ))}
      </div>
      <SettingsAddRestriction person={person} kind={kind} />
    </div>
  )
}
