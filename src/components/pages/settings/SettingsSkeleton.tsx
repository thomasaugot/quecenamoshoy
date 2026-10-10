import { PageSkeleton } from "@/components/ui/PageSkeleton"
import { Skeleton } from "@/components/ui/Skeleton"
import { SkeletonHeading } from "@/components/ui/SkeletonHeading"

const PEOPLE = 2

// Same layout as SettingsBody: a paper card per person, the house panel beside them on lg
export const SettingsSkeleton = () => (
  <PageSkeleton className="md:max-w-md">
    <SkeletonHeading />
    <div className="mt-8 flex flex-col gap-10 lg:mt-10 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-14">
      <div className="flex flex-col gap-6">
        {Array.from({ length: PEOPLE }, (_, i) => (
          <div key={i} className="flex flex-col gap-5 rounded-xl bg-paper p-5 shadow-md lg:p-7">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-8 w-40" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  </PageSkeleton>
)
