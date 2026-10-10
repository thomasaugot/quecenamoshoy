import { PageSkeleton } from "@/components/ui/PageSkeleton"
import { Skeleton } from "@/components/ui/Skeleton"
import { SkeletonHeading } from "@/components/ui/SkeletonHeading"

const LINES = 8

// Same layout as ShoppingBody: the paper list, the add form beside it on lg
export const ShoppingSkeleton = () => (
  <PageSkeleton>
    <SkeletonHeading />
    <div className="mt-8 flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-14">
      <div className="flex flex-col gap-4 rounded-sm bg-paper p-5 shadow-lg lg:p-8">
        {Array.from({ length: LINES }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 shrink-0 rounded-sm" />
            <Skeleton className={`h-5 ${i % 3 === 0 ? "w-1/2" : i % 3 === 1 ? "w-2/3" : "w-2/5"}`} />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  </PageSkeleton>
)
