import { Progress } from "@/components/ui/progress"
import { StatCard } from "@/components/ui/stat-card"
import { formatScore } from "@/lib/format"

import type { DashboardSummaryView } from "../mappers"

export function ProgressSummary({
  summary,
}: {
  summary: DashboardSummaryView
}) {
  const percent =
    summary.total > 0 ? Math.round((summary.scored / summary.total) * 100) : 0

  return (
    <section
      aria-label="Training progress"
      className="grid grid-cols-2 gap-3 md:grid-cols-4"
    >
      <StatCard
        label="Progress"
        value={
          <>
            {summary.scored}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              of {summary.total} cases scored
            </span>
          </>
        }
        className="col-span-2 md:col-span-1"
      >
        <Progress
          value={percent}
          aria-label="Cases scored"
          aria-valuetext={`${summary.scored} of ${summary.total} cases scored`}
          className="mt-2 h-1.5"
        />
      </StatCard>
      <StatCard
        label="Average score"
        value={formatScore(summary.averageAccuracy)}
        hint={
          summary.averageAccuracy === null
            ? "Submit a case to get a score"
            : "Out of 100, latest attempt per case"
        }
      />
      <StatCard label="In progress" value={summary.inProgress} hint="Drafts" />
      <StatCard
        label="Not started"
        value={summary.notStarted}
        hint="Cases available"
      />
    </section>
  )
}
