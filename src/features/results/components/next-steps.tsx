"use client"

import { ArrowLeft, ArrowRight, Loader2, RotateCcw } from "lucide-react"
import Link from "next/link"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { useDashboard } from "@/features/dashboard/hooks/use-dashboard"
import { useStartUnderwriting } from "@/features/dashboard/hooks/use-start-underwriting"

import { nextUnfinishedCase } from "../mappers"

/**
 * What to do next: try this property again (reusing an open draft if there
 * is one), go to the next unfinished case, or back to the dashboard.
 * Both need the dashboard (to never POST a duplicate draft), so they wait for it.
 */
export function NextSteps({
  zpid,
  dashboardQuery,
}: {
  zpid: string
  dashboardQuery: ReturnType<typeof useDashboard>
}) {
  const dashboard = dashboardQuery.data
  const start = useStartUnderwriting()
  const property = dashboard?.properties.find((p) => p.zpid === zpid)
  const openDraft = property?.active_underwriting_id ?? null
  const next = dashboard ? nextUnfinishedCase(dashboard.properties, zpid) : null
  const busy = start.isPending || start.isSuccess

  return (
    <section
      aria-labelledby="next-heading"
      className="flex flex-col gap-3 rounded-lg border bg-card p-5"
    >
      <h2 id="next-heading" className="text-base font-semibold">
        Next steps
      </h2>
      <div className="flex flex-col gap-2">
        {openDraft !== null ? (
          <Button asChild>
            <Link href={`/underwritings/${openDraft}`}>
              <RotateCcw aria-hidden data-icon="inline-start" />
              Continue your new attempt
            </Link>
          </Button>
        ) : (
          <Button
            disabled={busy || !dashboard}
            onClick={() => start.start(zpid)}
          >
            {busy && start.variables === zpid ? (
              <Loader2 aria-hidden className="animate-spin" />
            ) : (
              <RotateCcw aria-hidden data-icon="inline-start" />
            )}
            Try this property again
          </Button>
        )}

        {next &&
          (next.kind === "continue" ? (
            <Button asChild variant="outline">
              <Link href={`/underwritings/${next.underwritingId}`}>
                Continue {next.street}
                <ArrowRight aria-hidden data-icon="inline-end" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => start.start(next.zpid)}
            >
              {busy && start.variables === next.zpid && (
                <Loader2 aria-hidden className="animate-spin" />
              )}
              Next case: {next.street}
              <ArrowRight aria-hidden data-icon="inline-end" />
            </Button>
          ))}

        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft aria-hidden data-icon="inline-start" />
            Back to dashboard
          </Link>
        </Button>
      </div>
      {!dashboard && dashboardQuery.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            <p>
              Couldn&apos;t load your cases, so we can&apos;t tell which to
              open. {dashboardQuery.error.message}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={dashboardQuery.isFetching}
              onClick={() => void dashboardQuery.refetch()}
            >
              {dashboardQuery.isFetching && (
                <Loader2 aria-hidden className="animate-spin" />
              )}
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {dashboard && !next && (
        <p className="text-xs text-muted-foreground">
          Every other case has been scored.
        </p>
      )}
      {start.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Couldn&apos;t start a new attempt. {start.error.message}
          </AlertDescription>
        </Alert>
      )}
    </section>
  )
}
