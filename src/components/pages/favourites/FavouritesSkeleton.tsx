import { PageSkeleton } from "@/components/ui/PageSkeleton"
import { Skeleton } from "@/components/ui/Skeleton"
import { SkeletonHeading } from "@/components/ui/SkeletonHeading"

const CARDS = 8
const TILTS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-0"] as const

// Same grid and card shape as FavouritesGrid / FavouritesCard
export const FavouritesSkeleton = () => (
  <PageSkeleton className="flex flex-col gap-8 lg:gap-10">
    <SkeletonHeading />
    <Skeleton className="h-11 w-full md:w-80" />
    <ul className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
      {Array.from({ length: CARDS }, (_, i) => (
        <li key={i} className="flex flex-col gap-3">
          <Skeleton className={`aspect-square w-full rounded-sm ${TILTS[i % TILTS.length]}`} />
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-1.5">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  </PageSkeleton>
)
