import { Skeleton } from "@/components/ui/skeleton"

/** Same shape as the workspace: title, property brief, section bar, form beside results. */
export function WorkspaceSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading underwriting"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-32" />
      <Skeleton className="h-11" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}
