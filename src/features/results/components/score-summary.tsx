import { ArrowDown, ArrowUp, Equal } from "lucide-react"

import { RATING_META } from "@/components/ui/score-badge"
import { formatCurrency, formatScore } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { ScoreExplanation } from "../mappers"

const DIRECTION_ICON = { above: ArrowUp, below: ArrowDown, exact: Equal }

/** The score and why: tier, points, the sentence, and the three numbers behind it. */
export function ScoreSummary({ score }: { score: ScoreExplanation }) {
  const { label, className: tone } = RATING_META[score.rating]
  const Icon = score.direction ? DIRECTION_ICON[score.direction] : null

  return (
    <section
      aria-labelledby="score-heading"
      className="flex flex-col gap-5 rounded-lg border bg-card p-5 sm:p-6"
    >
      <h2 id="score-heading" className="sr-only">
        Your score
      </h2>
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div
          className={cn(
            "flex size-28 shrink-0 flex-col items-center justify-center rounded-full border-2",
            tone,
          )}
        >
          <span className="text-4xl font-semibold tracking-tight">
            {formatScore(score.accuracy)}
          </span>
          <span className="text-xs font-medium">out of 100</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p
            className={cn(
              "w-fit rounded-full border px-2.5 py-0.5 text-sm font-semibold",
              tone,
            )}
          >
            {label}
          </p>
          <p className="flex items-start gap-2 text-lg font-medium text-balance">
            {Icon && (
              <Icon
                aria-hidden
                className="mt-1 size-5 shrink-0 text-muted-foreground"
              />
            )}
            {score.sentence}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Your Mid revenue</dt>
          <dd className="text-xl font-semibold">
            {formatCurrency(score.candidate)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">
            Analyst&apos;s Mid revenue
          </dt>
          <dd className="text-xl font-semibold">
            {formatCurrency(score.reference)}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">Deviation</dt>
          <dd className="text-xl font-semibold">
            {score.deviationPct.toFixed(1)}%
            {score.direction && score.direction !== "exact" && (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                {score.direction}
              </span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}
