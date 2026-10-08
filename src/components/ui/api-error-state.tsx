import type { ApiError } from "@/api/errors"

import { ErrorState } from "./error-state"

/** ErrorState for a failed API call; explains how to start the API when it's unreachable. */
export function ApiErrorState({
  title,
  error,
  onRetry,
  retrying,
}: {
  title: string
  error: ApiError | null | undefined
  onRetry?: () => void
  retrying?: boolean
}) {
  return (
    <ErrorState
      title={title}
      message={error?.message}
      hint={
        error?.isNetworkError ? (
          <>
            Is the API running? Start it with{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              cd backend && docker compose up -d --build
            </code>
          </>
        ) : undefined
      }
      onRetry={onRetry}
      retrying={retrying}
    />
  )
}
