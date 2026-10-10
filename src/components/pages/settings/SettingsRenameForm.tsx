import { useState, type FormEvent } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useRenamePerson } from "@/hooks/usePeople"
import type { Person } from "@/types/person"
import { personNameError } from "@/utils/people"

export const SettingsRenameForm = ({ person, onDone }: { person: Person; onDone: () => void }) => {
  const t = useTranslations()
  const [name, setName] = useState(person.name)
  const [error, setError] = useState<string | null>(null)
  const rename = useRenamePerson()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const problem = personNameError(name)
    if (problem) return setError(t(`settings.add.${problem}`))
    if (name.trim() === person.name) return onDone()
    rename.mutate({ id: person.id, name: name.trim() }, { onSuccess: onDone })
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-w-0 grow flex-col gap-3">
      <Input
        label={t("settings.people.nameLabel")}
        name="name"
        autoComplete="off"
        required
        autoFocus
        value={name}
        onChange={(event) => { setName(event.target.value); setError(null) }}
        error={error ?? undefined}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={rename.isPending}>{t("actions.save")}</Button>
        <Button variant="ghost" size="sm" onClick={onDone}>{t("actions.cancel")}</Button>
      </div>
    </form>
  )
}
