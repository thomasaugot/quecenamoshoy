import { PageSkeleton } from "@/components/ui/PageSkeleton"
import { Skeleton } from "@/components/ui/Skeleton"

const STEPS = 4

// Same layout as DishBody: the pinned photo and name, the recipe beside it on lg
export const DishSkeleton = () => (
  <PageSkeleton className="flex flex-col gap-10 md:max-w-2xl lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-16">
    <div className="flex flex-col gap-6">
      <Skeleton className="aspect-square w-full max-w-sm -rotate-2 rounded-sm" />
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-2/3" />
    </div>
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-14 w-44 rounded-full" />
      <Skeleton className="h-48 w-full rounded-sm" />
      {Array.from({ length: STEPS }, (_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-8 w-8 shrink-0" />
          <Skeleton className="h-16 grow" />
        </div>
      ))}
    </div>
  </PageSkeleton>
)
