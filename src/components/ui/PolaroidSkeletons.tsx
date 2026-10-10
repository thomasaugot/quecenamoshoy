import { Skeleton } from "@/components/ui/Skeleton"

const TILTS = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3"] as const

// A row of polaroids being developed — same row and sizes as the real ones (Polaroid)
export const PolaroidSkeletons = ({ count }: { count: number }) => (
  <ul aria-hidden="true" className="-mx-6 flex gap-5 overflow-hidden px-6 pt-1 pb-3 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-8 lg:px-0">
    {Array.from({ length: count }, (_, i) => (
      <li key={i} className="flex w-28 shrink-0 flex-col gap-2 lg:w-full">
        <Skeleton className={`aspect-square w-full rounded-xs ${TILTS[i % TILTS.length]}`} />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </li>
    ))}
  </ul>
)
