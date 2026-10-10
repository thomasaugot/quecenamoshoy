import { PageSkeleton } from "@/components/ui/PageSkeleton"
import { Skeleton } from "@/components/ui/Skeleton"
import { SkeletonHeading } from "@/components/ui/SkeletonHeading"

const GROUPS = 3
const CHIPS = [24, 20, 32, 16, 28, 20, 24, 36, 20, 28] as const

// Same layout as KitchenBody: chip clouds by category, the scan panel beside them on lg
export const KitchenSkeleton = () => (
  <PageSkeleton>
    <SkeletonHeading />
    <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-start lg:gap-14">
      <Skeleton className="h-56 w-full rounded-xl lg:order-2" />
      <div className="flex flex-col gap-9">
        {Array.from({ length: GROUPS }, (_, g) => (
          <div key={g} className="flex flex-col gap-3">
            <Skeleton className="h-4 w-32" />
            <div className="flex flex-wrap gap-2">
              {CHIPS.map((w, i) => <Skeleton key={i} className={`h-9 rounded-full ${w === 16 ? "w-16" : w === 20 ? "w-20" : w === 24 ? "w-24" : w === 28 ? "w-28" : w === 32 ? "w-32" : "w-36"}`} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  </PageSkeleton>
)
