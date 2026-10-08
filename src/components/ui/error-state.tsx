import { CircleAlert, RotateCw } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "./button"

/** Full-section error with a plain message, an optional fix hint and a retry. */
export function ErrorState({
  title,
  message,
  hint,
  onRetry,
  retrying = false,
}: {
  title: string
  message?: string
  hint?: ReactNode
  onRetry?: () => void
  retrying?: boolean
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-5"
    >
      <div className="flex items-center gap-2 font-medium text-destructive">
        <CircleAlert aria-hidden className="size-4" />
        {title}
      </div>
      {message && <p className="text-sm text-foreground">{message}</p>}
      {hint && <div className="text-sm text-muted-foreground">{hint}</div>}
      {onRetry && (
        <Button variant="outline" onClick={onRetry} disabled={retrying}>
          <RotateCw aria-hidden className={retrying ? "animate-spin" : ""} />
          {retrying ? "Retrying…" : "Retry"}
        </Button>
      )}
    </div>
  )
}
