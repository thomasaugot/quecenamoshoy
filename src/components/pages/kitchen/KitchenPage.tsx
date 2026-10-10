import { PageMeta } from "@/components/layout/PageMeta"
import { KitchenSkeleton } from "@/components/pages/kitchen/KitchenSkeleton"
import { KitchenBody } from "@/components/pages/kitchen/KitchenBody"
import { useKitchen } from "@/hooks/useKitchen"
import { useKitchenStore } from "@/stores/kitchen-store"

export const KitchenPage = () => {
  const location = useKitchenStore((s) => s.location)
  const kitchen = useKitchen(location)
  if (kitchen.isError) throw kitchen.error
  return (
    <>
      <PageMeta page="kitchen" />
      {kitchen.isPending ? <KitchenSkeleton /> : <KitchenBody />}
    </>
  )
}
