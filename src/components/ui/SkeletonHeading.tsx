import { Skeleton } from "@/components/ui/Skeleton"

// The page title and its handwritten line, as shapes
export const SkeletonHeading = () => (
  <div className="flex flex-col gap-3">
    <Skeleton className="h-12 w-64 lg:h-14 lg:w-96" />
    <Skeleton className="h-6 w-48" />
  </div>
)
