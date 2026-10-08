import { Skeleton } from "@/components/ui/skeleton"

/** Same shape as the results screen: title, score card, ladder beside next steps. */
export function ResultsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading your result"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-56" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}
