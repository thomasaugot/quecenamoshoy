import { PageMeta } from "@/components/layout/PageMeta"
import { ShoppingSkeleton } from "@/components/pages/shopping/ShoppingSkeleton"
import { ShoppingBody } from "@/components/pages/shopping/ShoppingBody"
import { useShopping } from "@/hooks/useShopping"

export const ShoppingPage = () => {
  const shopping = useShopping()
  if (shopping.isError) throw shopping.error
  return (
    <>
      <PageMeta page="shopping" />
      {shopping.isPending ? <ShoppingSkeleton /> : <ShoppingBody />}
    </>
  )
}
