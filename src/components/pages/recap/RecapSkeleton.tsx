import { PageSkeleton } from "@/components/ui/PageSkeleton"
import { Skeleton } from "@/components/ui/Skeleton"
import { SkeletonHeading } from "@/components/ui/SkeletonHeading"

// Same layout as RecapBody: the big count, the podium, the side notes
export const RecapSkeleton = () => (
  <PageSkeleton>
    <SkeletonHeading />
    <div className="mt-8 flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
      <div className="flex flex-col gap-8">
        <Skeleton className="h-32 w-56" />
        <div className="flex items-end gap-4">
          <Skeleton className="aspect-square w-1/3 -rotate-2 rounded-sm" />
          <Skeleton className="aspect-square w-1/4 rotate-2 rounded-sm" />
          <Skeleton className="aspect-square w-1/5 -rotate-1 rounded-sm" />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-36 w-full rounded-sm" />
        <Skeleton className="h-28 w-full rounded-sm" />
      </div>
    </div>
  </PageSkeleton>
)
