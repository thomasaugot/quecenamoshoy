import { useState, type FormEvent } from "react"
import { useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { IconPlus } from "@/components/ui/Icons"
import { Input } from "@/components/ui/Input"
import { useCreatePerson } from "@/hooks/usePeople"
import { personNameError } from "@/utils/people"

// An empty place setting at the end of the table. With no profile yet, the first one is me.
export const SettingsAddPerson = ({ hasMe }: { hasMe: boolean }) => {
  const t = useTranslations("settings.add")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const create = useCreatePerson()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const problem = personNameError(name)
    if (problem) return setError(t(problem))
    create.mutate({ name: name.trim(), isMe: !hasMe }, { onSuccess: () => setName("") })
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby="settings-add"
      className="flex flex-col gap-4 rounded-xl border-2 border-dashed border-border p-5 lg:p-7"
    >
      <h3 id="settings-add" className="text-subheading">{hasMe ? t("title") : t("titleMe")}</h3>
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="grow">
          <Input
            label={t("nameLabel")}
            name="person-name"
            autoComplete="off"
            required
            placeholder={t("placeholder")}
            value={name}
            onChange={(event) => { setName(event.target.value); setError(null) }}
            error={error ?? undefined}
          />
        </div>
        <Button type="submit" loading={create.isPending} icon={<IconPlus className="h-5 w-5 shrink-0" />}>
          {t("submit")}
        </Button>
      </div>
    </form>
  )
}
