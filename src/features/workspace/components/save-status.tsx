"use client"

import { CircleAlert, CircleCheck, CircleDot, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { PART_META } from "../fields"
import { useWorkspace } from "./workspace-provider"

const time = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
})

/**
 * Saved / saving / failed, plus parts that changed but can't be saved yet.
 * One line on purpose: a status that grows or shrinks would shift the page
 * under the pointer as fields blur.
 */
export function SaveStatus() {
  const { autosave } = useWorkspace()
  const { state, error, lastSavedAt, retry, blocked } = autosave
  const blockedNames = blocked.map((p) => PART_META[p].label).join(", ")

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-8 items-center gap-2 text-sm"
    >
      {state === "saving" && (
        <>
          <Loader2
            aria-hidden
            className="size-4 animate-spin text-muted-foreground"
          />
          <span className="text-muted-foreground">Saving…</span>
        </>
      )}
      {state === "pending" && (
        <>
          <CircleDot aria-hidden className="size-4 text-status-in-progress" />
          <span className="text-muted-foreground">Unsaved changes</span>
        </>
      )}
      {state === "saved" &&
        (blocked.length > 0 ? (
          <>
            <CircleDot aria-hidden className="size-4 text-score-medium" />
            <span
              className="text-muted-foreground"
              title="A section saves once all its fields are filled in and valid."
            >
              Not saved yet: {blockedNames}
              <span className="sr-only">
                . A section saves once all its fields are filled in and valid.
              </span>
            </span>
          </>
        ) : (
          <>
            <CircleCheck aria-hidden className="size-4 text-score-best" />
            <span className="text-muted-foreground">
              {lastSavedAt
                ? `Saved at ${time.format(lastSavedAt)}`
                : "All changes saved"}
            </span>
          </>
        ))}
      {state === "error" && (
        <>
          <CircleAlert aria-hidden className="size-4 text-destructive" />
          <span className="text-destructive">
            Couldn&apos;t save
            {error?.isNetworkError ? " (API unreachable)" : ""}. Your input is
            kept.
          </span>
          <Button variant="outline" size="xs" onClick={retry}>
            Retry
          </Button>
        </>
      )}
    </div>
  )
}
