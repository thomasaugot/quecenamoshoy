import { PageMeta } from "@/components/layout/PageMeta"
import { KitchenBody } from "@/components/pages/kitchen/KitchenBody"
import { PageLoading } from "@/components/ui/PageLoading"
import { useKitchen } from "@/hooks/useKitchen"
import { useKitchenStore } from "@/stores/kitchen-store"

export const KitchenPage = () => {
  const location = useKitchenStore((s) => s.location)
  const kitchen = useKitchen(location)
  if (kitchen.isError) throw kitchen.error
  return (
    <>
      <PageMeta page="kitchen" />
      {kitchen.isPending ? <PageLoading /> : <KitchenBody />}
    </>
  )
}
