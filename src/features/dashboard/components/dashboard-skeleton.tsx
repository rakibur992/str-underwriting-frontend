import { Skeleton } from "@/components/ui/skeleton"

/** Same shape as the loaded dashboard: four stat cards, then six table rows. */
export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading training cases"
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton
            key={i}
            className={i === 0 ? "col-span-2 h-24 md:col-span-1" : "h-24"}
          />
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <Skeleton className="h-4 w-1/3" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    </div>
  )
}
