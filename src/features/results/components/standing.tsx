"use client"

import { Info } from "lucide-react"

import type {
  DashboardProperty,
  DashboardResult,
  SubmissionRead,
} from "@/api/types"
import { toRating } from "@/api/types"
import { Button } from "@/components/ui/button"
import { ScoreBadge } from "@/components/ui/score-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatScore } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useSubmissions } from "../hooks/use-submissions"
import { rankAttempts, streetOf } from "../mappers"

const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

/** Rows shown; the current attempt is always included. */
const TOP = 5

/**
 * Standing from real data only (ADR-0005): this attempt among the trainee's
 * own attempts, plus overall progress. No cross-trainee leaderboard exists.
 */
export function Standing({
  current,
  dashboard,
}: {
  current: SubmissionRead
  dashboard: DashboardResult | undefined
}) {
  const submissions = useSubmissions()
  const streets = new Map(
    dashboard?.properties.map((p) => [p.zpid, streetOf(p)]),
  )
  const scored = dashboard?.properties.filter((p) => p.attempts > 0).length
  const property = dashboard?.properties.find((p) => p.zpid === current.zpid)

  return (
    <section
      aria-labelledby="standing-heading"
      className="flex flex-col gap-4 rounded-lg border bg-card p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="standing-heading" className="text-base font-semibold">
          Your standing
        </h2>
        {dashboard && (
          <p className="text-sm text-muted-foreground">
            {scored} of {dashboard.summary.total_properties} cases scored ·
            average score {formatScore(dashboard.summary.average_accuracy)}
          </p>
        )}
      </div>

      {property && property.attempts > 0 && (
        <PropertyRecord property={property} />
      )}

      {submissions.isPending ? (
        <div
          role="status"
          aria-label="Loading your attempts"
          className="flex flex-col gap-2"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-24" />
        </div>
      ) : submissions.isError ? (
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load your other attempts.{" "}
          <Button
            variant="link"
            size="xs"
            className="h-auto p-0"
            onClick={() => void submissions.refetch()}
          >
            Retry
          </Button>
        </p>
      ) : (
        <AttemptTable
          ranked={rankAttempts(
            // The list may not include this attempt yet if it was just submitted.
            submissions.data.some((s) => s.id === current.id)
              ? submissions.data
              : [...submissions.data, current],
          )}
          currentId={current.id}
          streets={streets}
        />
      )}

      <p className="flex items-start gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
        <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        This ranks your own attempts. A leaderboard across trainees needs user
        accounts and a leaderboard endpoint, which the training API doesn&apos;t
        have yet.
      </p>
    </section>
  )
}

/** Best and latest on this property, from the dashboard (ADR-0005). */
function PropertyRecord({ property }: { property: DashboardProperty }) {
  const items = [
    {
      label: "Best",
      rating: property.best_rating,
      accuracy: property.best_accuracy,
    },
    {
      label: "Latest",
      rating: property.latest_rating,
      accuracy: property.latest_accuracy,
    },
  ]
  return (
    <dl
      aria-label="This property"
      className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md border px-3 py-2 text-sm"
    >
      <div className="flex items-center gap-2">
        <dt className="text-muted-foreground">This property</dt>
        <dd className="tabular-nums">
          {property.attempts} {property.attempts === 1 ? "attempt" : "attempts"}
        </dd>
      </div>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd>
            <ScoreBadge
              rating={toRating(item.rating)}
              accuracy={item.accuracy}
            />
          </dd>
        </div>
      ))}
    </dl>
  )
}

function AttemptTable({
  ranked,
  currentId,
  streets,
}: {
  ranked: ReturnType<typeof rankAttempts>
  currentId: number
  streets: Map<string, string>
}) {
  const mine = ranked.find((r) => r.submission.id === currentId)
  const rows = ranked.filter(
    (r) => r.rank <= TOP || r.submission.id === currentId,
  )

  return (
    <>
      {mine && (
        <p className="text-sm">
          This attempt ranks{" "}
          <span className="font-semibold">
            #{mine.rank} of {ranked.length}
          </span>{" "}
          of your attempts.
        </p>
      )}
      <table className="w-full text-sm">
        <caption className="sr-only">Your attempts, best first</caption>
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="py-1 text-left font-medium">
              #
            </th>
            <th scope="col" className="py-1 text-left font-medium">
              Property
            </th>
            <th scope="col" className="py-1 text-left font-medium">
              Score
            </th>
            <th
              scope="col"
              className="hidden py-1 text-right font-medium sm:table-cell"
            >
              Off by
            </th>
            <th
              scope="col"
              className="hidden py-1 text-right font-medium sm:table-cell"
            >
              Submitted
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ submission: s, rank, deviationPct }) => {
            const isCurrent = s.id === currentId
            return (
              <tr
                key={s.id}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "border-t",
                  isCurrent && "bg-primary/6 font-medium",
                )}
              >
                <td className="py-1.5 pr-2 pl-1 tabular-nums">{rank}</td>
                <td className="py-1.5">
                  {streets.get(s.zpid) ?? s.zpid}
                  {isCurrent && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      This attempt
                    </span>
                  )}
                </td>
                <td className="py-1.5">
                  <ScoreBadge
                    rating={toRating(s.rating)}
                    accuracy={s.accuracy}
                  />
                </td>
                <td className="hidden py-1.5 text-right tabular-nums sm:table-cell">
                  {deviationPct.toFixed(1)}%
                </td>
                <td className="hidden py-1.5 pr-1 text-right text-muted-foreground sm:table-cell">
                  {date.format(new Date(s.submitted_at))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
