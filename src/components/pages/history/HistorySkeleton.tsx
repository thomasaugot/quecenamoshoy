import { PageSkeleton } from "@/components/ui/PageSkeleton"
import { Skeleton } from "@/components/ui/Skeleton"
import { SkeletonHeading } from "@/components/ui/SkeletonHeading"

const ROWS = 5

// Same layout as HistoryBody: dinner rows, and the week's note beside them on lg
export const HistorySkeleton = () => (
  <PageSkeleton>
    <SkeletonHeading />
    <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:items-start lg:gap-14">
      <Skeleton className="h-40 w-full rounded-sm lg:order-2" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: ROWS }, (_, i) => (
          <div key={i} className="flex items-start gap-4 rounded-lg bg-surface p-3 shadow-sm lg:gap-5 lg:p-4">
            <Skeleton className="aspect-square w-20 shrink-0 rounded-xs lg:w-24" />
            <div className="flex grow flex-col gap-2 pt-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </PageSkeleton>
)
