import { useState, type FormEvent } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconPlus } from "@/components/ui/Icons"
import { Input } from "@/components/ui/Input"
import { RESTRICTION_CATALOGUE } from "@/constants/restrictions"
import { useCatalogueLabel } from "@/hooks/useCatalogueLabel"
import { useSetRestriction } from "@/hooks/usePeople"
import type { RestrictionKind } from "@/types/database"
import type { Person } from "@/types/person"
import { customKey, matchCatalogue, personNameError } from "@/utils/people"

// Anything the list doesn't have: type it. A word that IS on the list switches that chip on.
export const SettingsAddRestriction = ({ person, kind }: { person: Person; kind: RestrictionKind }) => {
  const t = useTranslations("settings.restrictions")
  const label = useCatalogueLabel()
  const setRestriction = useSetRestriction()
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const problem = personNameError(text)
    if (problem) return setError(t(problem))
    const entries = RESTRICTION_CATALOGUE[kind].map((key) => ({ key, label: label(kind, key) }))
    const known = matchCatalogue(text, entries)
    setRestriction.mutate(
      known
        ? { personId: person.id, kind, key: known, on: true }
        : { personId: person.id, kind, key: customKey(text), label: text.trim(), on: true },
      { onSuccess: () => setText("") },
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex items-end gap-2">
      <div className="grow">
        <Input
          label={t(`${kind}.add`)}
          name={`${kind}-${person.id}`}
          autoComplete="off"
          placeholder={t(`${kind}.placeholder`)}
          value={text}
          onChange={(event) => { setText(event.target.value); setError(null) }}
          error={error ?? undefined}
        />
      </div>
      <Button
        type="submit"
        variant="outlined"
        size="icon"
        aria-label={t("submit")}
        loading={setRestriction.isPending}
        icon={<IconPlus className="h-5 w-5 shrink-0" />}
        className="mb-0.5"
      />
    </form>
  )
}
