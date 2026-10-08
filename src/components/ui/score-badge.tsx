import type { Rating } from "@/api/types"
import { EMPTY_VALUE, formatScore } from "@/lib/format"
import { cn } from "@/lib/utils"

import { Badge } from "./badge"

/** Score tiers from the brief: Best 100, Medium 70, Low 40. */
export const RATING_META: Record<Rating, { label: string; className: string }> =
  {
    best: {
      label: "Best",
      className: "border-score-best/25 bg-score-best/10 text-score-best",
    },
    medium: {
      label: "Medium",
      className: "border-score-medium/30 bg-score-medium/10 text-score-medium",
    },
    low: {
      label: "Low",
      className: "border-score-low/25 bg-score-low/10 text-score-low",
    },
  }

/** "Best · 100". Shows a muted dash when there is no score yet. */
export function ScoreBadge({
  rating,
  accuracy,
  className,
}: {
  rating: Rating | null
  accuracy: string | null
  className?: string
}) {
  if (!rating || accuracy === null) {
    return (
      <span className="text-muted-foreground">
        <span aria-hidden>{EMPTY_VALUE}</span>
        <span className="sr-only">No score yet</span>
      </span>
    )
  }
  const { label, className: tone } = RATING_META[rating]
  return (
    <Badge variant="outline" className={cn(tone, className)}>
      {`${label} · `}
      <span className="font-semibold">{formatScore(accuracy)}</span>
    </Badge>
  )
}
