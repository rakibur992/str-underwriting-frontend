"use client"

import { CircleAlert, Loader2, Send } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ApiError } from "@/api/errors"
import { useWorkspace } from "@/features/workspace/components/workspace-provider"
import { formatCurrency } from "@/lib/format"
import { userNumber } from "@/lib/units"

/** The graded number, the one primary action, and why it's disabled when it is. */
export function SubmitPanel({
  blockingCount,
  submitting,
  error,
  onSubmit,
}: {
  blockingCount: number
  submitting: boolean
  /** A submit failure that isn't shown on the checklist. */
  error: ApiError | null
  onSubmit: () => void
}) {
  const { values, autosave } = useWorkspace()
  const mid = userNumber(values.revenue.mid)
  const blocked = blockingCount > 0
  const reasonId = "submit-reason"

  return (
    <section
      aria-labelledby="submit-heading"
      className="flex flex-col gap-4 rounded-lg border bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 id="submit-heading" className="text-base font-semibold">
          Submit for scoring
        </h2>
        <p className="text-sm text-muted-foreground">
          You&apos;re graded on how close your Mid revenue is to the
          analyst&apos;s. A submission is final for this attempt.
        </p>
      </div>

      <div className="flex items-baseline justify-between gap-2 rounded-md bg-primary/6 px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          Mid revenue
          <Badge variant="secondary">Graded</Badge>
        </span>
        <span className="text-xl font-semibold tracking-tight">
          {formatCurrency(mid)}
        </span>
      </div>

      {error && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden />
          <AlertTitle>Couldn&apos;t submit</AlertTitle>
          <AlertDescription>
            {error.message}{" "}
            {error.status === 403
              ? "This underwriting can't be submitted."
              : autosave.state === "error"
                ? "Your inputs are still here, but the last save failed too. Try again."
                : "Your inputs are still here. Try again."}
          </AlertDescription>
        </Alert>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="lg"
            disabled={blocked || submitting}
            aria-describedby={reasonId}
          >
            {submitting ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <Send aria-hidden data-icon="inline-start" />
            )}
            {submitting ? "Submitting…" : "Submit underwriting"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this underwriting?</AlertDialogTitle>
            <AlertDialogDescription>
              Your Mid revenue of {formatCurrency(mid)} will be scored against
              the analyst&apos;s. This attempt can&apos;t be changed afterwards;
              you can start a new attempt from the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep reviewing</AlertDialogCancel>
            <AlertDialogAction onClick={onSubmit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p
        id={reasonId}
        className={
          blocked ? "text-sm text-destructive" : "text-xs text-muted-foreground"
        }
      >
        {blocked
          ? `Fix the ${blockingCount === 1 ? "item" : `${blockingCount} items`} in the checklist to submit.`
          : "Purchase details, revenue forecast and taxes are complete."}
      </p>
    </section>
  )
}
