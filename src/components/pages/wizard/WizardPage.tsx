import { PageMeta } from "@/components/layout/PageMeta"
import { WizardBody } from "@/components/pages/wizard/WizardBody"
import { PageLoading } from "@/components/ui/PageLoading"
import { usePeople } from "@/hooks/usePeople"
import { useSettings } from "@/hooks/useSettings"

export const WizardPage = () => {
  const people = usePeople()
  const settings = useSettings()
  if (people.isError) throw people.error
  if (settings.isError) throw settings.error
  return (
    <>
      <PageMeta page="wizard" />
      {people.isPending || settings.isPending ? <PageLoading /> : <WizardBody />}
    </>
  )
}
