import { CircleCheck } from "lucide-react"

import { RATING_META } from "@/components/ui/score-badge"
import { cn } from "@/lib/utils"

import { tierRanges, type ScoreExplanation } from "../mappers"

/** Zone fills: stronger than the badges so the bands read at a glance. */
const ZONE: Record<"best" | "medium" | "low", string> = {
  best: "border-score-best/40 bg-score-best/30",
  medium: "border-score-medium/40 bg-score-medium/25",
  low: "border-score-low/40 bg-score-low/20",
}

/** How far the axis reaches either side of the analyst, in percent. */
const SPAN = 40

/**
 * Where this attempt landed: a signed axis around the analyst's Mid with the
 * Low / Medium / Best zones, a marker at the trainee's deviation, and the
 * Mid revenue each tier needed (thresholds are inclusive).
 */
export function BandLadder({ score }: { score: ScoreExplanation }) {
  const best = score.bestThresholdPct
  const medium = score.mediumThresholdPct
  const pos = (pct: number) =>
    ((Math.max(-SPAN, Math.min(SPAN, pct)) + SPAN) / (2 * SPAN)) * 100
  const zones = [
    { from: -SPAN, to: -medium, rating: "low" as const },
    { from: -medium, to: -best, rating: "medium" as const },
    { from: -best, to: best, rating: "best" as const },
    { from: best, to: medium, rating: "medium" as const },
    { from: medium, to: SPAN, rating: "low" as const },
  ]
  const marker = pos(score.signedDeviationPct)
  const offScale = Math.abs(score.signedDeviationPct) > SPAN

  return (
    <section
      aria-labelledby="ladder-heading"
      className="flex flex-col gap-4 rounded-lg border bg-card p-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="ladder-heading" className="text-base font-semibold">
          Where you landed
        </h2>
        <p className="text-sm text-muted-foreground">
          Distance from the analyst&apos;s Mid revenue. Both limits count in
          your favour: exactly {best}% off is still Best.
        </p>
      </div>

      <div className="px-2 pt-7 pb-6">
        <div className="relative h-3">
          {zones.map((z, i) => (
            <div
              key={i}
              aria-hidden
              className={cn(
                "absolute inset-y-0 border-y",
                ZONE[z.rating],
                i === 0 && "rounded-l-full border-l",
                i === zones.length - 1 && "rounded-r-full border-r",
              )}
              style={{
                left: `${pos(z.from)}%`,
                width: `${pos(z.to) - pos(z.from)}%`,
              }}
            />
          ))}
          {/* No forecast was graded: there's no position to mark. */}
          {score.direction !== null && (
            <div
              className="absolute -top-7 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${marker}%` }}
            >
              <span className="rounded bg-foreground px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-background">
                You{offScale ? ` (${score.deviationPct.toFixed(0)}%)` : ""}
              </span>
              <span aria-hidden className="h-5 w-0.5 bg-foreground" />
            </div>
          )}
          {[-medium, -best, 0, best, medium].map((t) => (
            <span
              key={t}
              aria-hidden
              className={cn(
                "absolute top-4 -translate-x-1/2 text-xs whitespace-nowrap text-muted-foreground tabular-nums",
                // Too close to "Analyst" on phones; the table below spells the tiers out.
                Math.abs(t) === best && "hidden sm:block",
              )}
              style={{ left: `${pos(t)}%` }}
            >
              {t === 0 ? "Analyst" : `${t > 0 ? "+" : "−"}${Math.abs(t)}%`}
            </span>
          ))}
        </div>
      </div>

      <table className="w-full text-sm">
        <caption className="sr-only">
          Score tiers and the Mid revenue each needed
        </caption>
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="py-1 text-left font-medium">
              Tier
            </th>
            <th scope="col" className="py-1 text-left font-medium">
              Rule
            </th>
            <th scope="col" className="py-1 text-right font-medium">
              Mid revenue needed
            </th>
          </tr>
        </thead>
        <tbody>
          {tierRanges(score).map((t) => {
            const mine = t.rating === score.rating
            return (
              <tr
                key={t.rating}
                className={cn("border-t", mine && "bg-muted/60 font-medium")}
                aria-current={mine ? "true" : undefined}
              >
                <td className="py-1.5 pl-1">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                        RATING_META[t.rating].className,
                      )}
                    >
                      {RATING_META[t.rating].label} · {t.score}
                    </span>
                    {mine && (
                      <>
                        <CircleCheck aria-hidden className="size-4" />
                        <span className="sr-only">(your tier)</span>
                      </>
                    )}
                  </span>
                </td>
                <td className="py-1.5">{t.rule}</td>
                <td className="py-1.5 pr-1 text-right tabular-nums">
                  {t.range ?? "—"}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
