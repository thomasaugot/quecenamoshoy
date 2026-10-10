import { useState } from "react"
import { useTranslations } from "use-intl"
import { SettingsGoals } from "@/components/pages/settings/SettingsGoals"
import { SettingsRenameForm } from "@/components/pages/settings/SettingsRenameForm"
import { SettingsRestrictions } from "@/components/pages/settings/SettingsRestrictions"
import { Button } from "@/components/ui/Button"
import { IconEdit, IconTrash } from "@/components/ui/Icons"
import { RESTRICTION_KINDS } from "@/constants/restrictions"
import { useDeletePerson } from "@/hooks/usePeople"
import type { Person } from "@/types/person"
import { initialOf } from "@/utils/people"

// One person at the table, as a sheet of note paper: who, what they can't eat, what they'd
// rather not, and where they want to go.
export const SettingsPerson = ({ person }: { person: Person }) => {
  const t = useTranslations("settings.people")
  const [renaming, setRenaming] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const remove = useDeletePerson()
  const headingId = `person-${person.id}`

  return (
    <article aria-labelledby={headingId} className="flex flex-col gap-7 rounded-xl bg-paper p-5 shadow-md lg:p-7">
      <header className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className={`text-voice-lg flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${person.isMe ? "bg-highlight text-on-highlight" : "bg-sage-soft text-text"}`}
        >
          {initialOf(person.name)}
        </span>
        {renaming ? (
          <SettingsRenameForm person={person} onDone={() => setRenaming(false)} />
        ) : (
          <div className="flex min-w-0 grow flex-wrap items-baseline gap-x-3">
            <h3 id={headingId} className="text-heading truncate">{person.name}</h3>
            {person.isMe && <span className="text-note text-accent-strong">{t("me")}</span>}
          </div>
        )}
        {!renaming && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("rename", { name: person.name })}
            onClick={() => setRenaming(true)}
            icon={<IconEdit className="h-4 w-4 shrink-0" />}
            className="text-text-muted"
          />
        )}
      </header>

      {RESTRICTION_KINDS.map((kind) => (
        <SettingsRestrictions key={kind} person={person} kind={kind} />
      ))}
      <SettingsGoals person={person} />

      {!person.isMe && (
        <div className="flex flex-wrap items-center gap-2">
          {confirming ? (
            <>
              <Button variant="filled" size="sm" loading={remove.isPending}
                onClick={() => remove.mutate(person.id)} className="bg-accent-strong hover:bg-accent-strong">
                {t("confirmRemove", { name: person.name })}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>{t("keep")}</Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}
              icon={<IconTrash className="h-4 w-4 shrink-0" />} className="text-text-muted">
              {t("remove")}
            </Button>
          )}
        </div>
      )}
    </article>
  )
}
