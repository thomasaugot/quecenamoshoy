import { useState } from "react"
import { useTranslations } from "use-intl"
import { SettingsGoals } from "@/components/pages/settings/SettingsGoals"
import { SettingsPersonPhoto } from "@/components/pages/settings/SettingsPersonPhoto"
import { SettingsRenameForm } from "@/components/pages/settings/SettingsRenameForm"
import { SettingsRestrictions } from "@/components/pages/settings/SettingsRestrictions"
import { Button } from "@/components/ui/Button"
import { PersonAvatar } from "@/components/ui/PersonAvatar"
import { IconChevronDown, IconEdit, IconTrash } from "@/components/ui/Icons"
import { RESTRICTION_KINDS } from "@/constants/restrictions"
import { useDeletePerson } from "@/hooks/usePeople"
import type { Person } from "@/types/person"

// One person at the table, as a sheet of note paper that folds: closed, who and a one-line count;
// open, what they can't eat, what they'd rather not, and where they want to go.
export const SettingsPerson = ({ person, open, onToggle }: { person: Person; open: boolean; onToggle: () => void }) => {
  const t = useTranslations("settings.people")
  const [renaming, setRenaming] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const remove = useDeletePerson()
  const headingId = `person-${person.id}`
  const panelId = `person-panel-${person.id}`

  return (
    <article aria-labelledby={headingId} className="flex flex-col rounded-xl bg-paper p-5 shadow-md lg:p-7">
      <header className="flex items-center gap-2">
        {renaming ? (
          <div className="flex min-w-0 grow items-center gap-4">
            <PersonAvatar person={person} />
            <SettingsRenameForm person={person} onDone={() => setRenaming(false)} />
          </div>
        ) : (
          <>
          {/* the avatar itself changes the photo (the pen on it) */}
          <SettingsPersonPhoto person={person} />
          <button type="button" aria-expanded={open} aria-controls={panelId} onClick={onToggle}
            className="keyboard-focus-ring -my-2 flex min-w-0 grow items-center gap-4 rounded-lg py-2 pl-2 text-left">
            <span className="flex min-w-0 grow flex-col">
              <span className="flex flex-wrap items-baseline gap-x-3">
                <h3 id={headingId} className="text-heading truncate">{person.name}</h3>
                {person.isMe && <span className="text-note text-accent-strong">{t("me")}</span>}
              </span>
              <span className="text-body-sm">{t("summary", { restrictions: person.restrictions.length, goals: person.goals.length })}</span>
            </span>
            <IconChevronDown className={`h-5 w-5 shrink-0 text-text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
          </button>
          </>
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

      {/* folds with a grid-rows transition; closed, it is inert so keyboard and screen readers skip it */}
      <div id={panelId} inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "[grid-template-rows:1fr]" : "[grid-template-rows:0fr]"}`}>
        <div className="flex min-h-0 flex-col gap-7 overflow-hidden">
          <div aria-hidden="true" />
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
        </div>
      </div>
    </article>
  )
}
