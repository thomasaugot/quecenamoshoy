import { PageMeta } from "@/components/layout/PageMeta"
import { SettingsSkeleton } from "@/components/pages/settings/SettingsSkeleton"
import { SettingsBody } from "@/components/pages/settings/SettingsBody"
import { usePeople } from "@/hooks/usePeople"
import { useSettings } from "@/hooks/useSettings"

// Both queries start together; the body mounts once both are in, so its entrance animation
// finds its targets on the first run.
export const SettingsPage = () => {
  const people = usePeople()
  const settings = useSettings()
  if (people.isError) throw people.error
  if (settings.isError) throw settings.error
  return (
    <>
      <PageMeta page="settings" />
      {people.isPending || settings.isPending ? <SettingsSkeleton /> : <SettingsBody />}
    </>
  )
}
