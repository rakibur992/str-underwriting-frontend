import type { ReactNode } from "react"

/** Shown when a data view loads fine but has nothing in it. Says what to do next. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      {description && (
        <div className="max-w-md text-sm text-muted-foreground">
          {description}
        </div>
      )}
      {action}
    </div>
  )
}
