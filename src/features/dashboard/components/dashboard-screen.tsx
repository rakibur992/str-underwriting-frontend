"use client"

import { CircleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ApiErrorState } from "@/components/ui/api-error-state"

import { useDashboard } from "../hooks/use-dashboard"
import { useStartUnderwriting } from "../hooks/use-start-underwriting"
import { toPropertyRows, toSummary } from "../mappers"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { ProgressSummary } from "./progress-summary"
import { PropertyTable } from "./property-table"

export function DashboardScreen() {
  const dashboard = useDashboard()
  const start = useStartUnderwriting()

  if (dashboard.isPending) return <DashboardSkeleton />

  // Full error screen only when there is nothing to show; a failed background
  // refetch keeps the table and shows an inline alert instead.
  const data = dashboard.data
  if (!data) {
    return (
      <ApiErrorState
        title="Couldn't load your training cases"
        error={dashboard.error}
        onRetry={() => void dashboard.refetch()}
        retrying={dashboard.isFetching}
      />
    )
  }

  const rows = toPropertyRows(data.properties)
  const startingZpid =
    start.isPending || start.isSuccess ? (start.variables ?? null) : null
  const failedRow = start.isError
    ? rows.find((r) => r.zpid === start.variables)
    : undefined
  // If the draft was created despite the error, the row now offers Continue instead.
  const canRetryStart = failedRow?.activeUnderwritingId === null

  return (
    <>
      <ProgressSummary summary={toSummary(data)} />

      <section aria-labelledby="cases-heading" className="flex flex-col gap-3">
        <h2 id="cases-heading" className="text-base font-semibold">
          Training cases
        </h2>

        {dashboard.isError && (
          <Alert variant="destructive">
            <CircleAlert aria-hidden />
            <AlertTitle>Couldn&apos;t refresh your training cases</AlertTitle>
            <AlertDescription>
              Showing the last loaded data. {dashboard.error.message}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => void dashboard.refetch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {start.isError && (
          <Alert variant="destructive">
            <CircleAlert aria-hidden />
            <AlertTitle>
              Couldn&apos;t start {failedRow?.street ?? "this case"}
            </AlertTitle>
            <AlertDescription>
              {start.error.message} Your other cases are unchanged.
              {canRetryStart && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => start.start(failedRow.zpid)}
                >
                  Try again
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {rows.length === 0 ? (
          <EmptyState
            title="No training cases yet"
            description={
              <>
                Load the seed data with{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  npm run seed:reset
                </code>
                , then reload this page.
              </>
            }
          />
        ) : (
          <PropertyTable
            rows={rows}
            onStart={start.start}
            startingZpid={startingZpid}
          />
        )}
      </section>
    </>
  )
}
