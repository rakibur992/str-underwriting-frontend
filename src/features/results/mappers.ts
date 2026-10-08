/**
 * Results view models: the deviation sentence, tier ranges, attempt ranking
 * (ADR-0005) and the next case to work on. Pure, unit-tested.
 */
import {
  toRating,
  toTrainingStatus,
  type DashboardProperty,
  type Rating,
  type SubmissionRead,
} from "@/api/types"
import { formatCurrency } from "@/lib/format"
import { fractionToPercent, parseDecimal } from "@/lib/units"

export type Direction = "above" | "below" | "exact"

export interface ScoreExplanation {
  rating: Rating
  accuracy: string
  candidate: number | null
  reference: number | null
  /** Unsigned, whole percent (4 = 4%). */
  deviationPct: number
  /** Signed, whole percent: positive when the trainee was above the analyst. */
  signedDeviationPct: number
  direction: Direction | null
  sentence: string
  bestThresholdPct: number
  mediumThresholdPct: number
}

const oneDecimal = (pct: number) => `${pct.toFixed(1)}%`

/** Fallback for a rating the client doesn't know: the score maps 1:1 to a tier. */
function ratingFromAccuracy(accuracy: string): Rating {
  const points = parseDecimal(accuracy) ?? 0
  return points >= 100 ? "best" : points >= 70 ? "medium" : "low"
}

/** "You were 4.0% above the analyst's Mid revenue." Direction comes from candidate vs reference. */
export function explainScore(submission: SubmissionRead): ScoreExplanation {
  const b = submission.breakdown
  const candidate = parseDecimal(b.candidate)
  const reference = parseDecimal(b.reference)
  const deviationPct = fractionToPercent(b.deviation) ?? 0
  const direction: Direction | null =
    candidate === null || reference === null
      ? null
      : candidate > reference
        ? "above"
        : candidate < reference
          ? "below"
          : "exact"

  const sentence =
    direction === null
      ? "No Mid revenue forecast was graded, so this attempt scores Low."
      : direction === "exact"
        ? "You matched the analyst's Mid revenue exactly."
        : `You were ${oneDecimal(deviationPct)} ${direction} the analyst's Mid revenue.`

  return {
    rating:
      toRating(b.rating ?? submission.rating) ??
      ratingFromAccuracy(submission.accuracy),
    accuracy: submission.accuracy,
    candidate,
    reference,
    deviationPct,
    signedDeviationPct: direction === "below" ? -deviationPct : deviationPct,
    direction,
    sentence,
    bestThresholdPct: fractionToPercent(b.best_threshold) ?? 10,
    mediumThresholdPct: fractionToPercent(b.medium_threshold) ?? 25,
  }
}

export interface TierRange {
  rating: Rating
  score: number
  /** "Within 10%" etc. */
  rule: string
  /** Mid revenue that earns this tier, from the reference (inclusive). Null when unknown. */
  range: string | null
}

/** The three tiers with the Mid revenue each would have needed. Shown only after submitting. */
export function tierRanges(e: ScoreExplanation): TierRange[] {
  const ref = e.reference
  const span = (pct: number) =>
    ref === null
      ? null
      : `${formatCurrency(ref * (1 - pct / 100))} – ${formatCurrency(ref * (1 + pct / 100))}`
  return [
    {
      rating: "best",
      score: 100,
      rule: `Within ${e.bestThresholdPct}%`,
      range: span(e.bestThresholdPct),
    },
    {
      rating: "medium",
      score: 70,
      rule: `Within ${e.mediumThresholdPct}%`,
      range: span(e.mediumThresholdPct),
    },
    {
      rating: "low",
      score: 40,
      rule: `More than ${e.mediumThresholdPct}% away`,
      range: ref === null ? null : "Anything outside Medium",
    },
  ]
}

export interface RankedAttempt {
  submission: SubmissionRead
  rank: number
  deviationPct: number
}

/**
 * The trainee's own attempts, best first: accuracy, then smallest deviation,
 * then earliest (ADR-0005). There is no cross-trainee leaderboard endpoint.
 */
export function rankAttempts(submissions: SubmissionRead[]): RankedAttempt[] {
  return submissions
    .map((submission) => ({
      submission,
      accuracy: parseDecimal(submission.accuracy) ?? 0,
      deviationPct:
        fractionToPercent(submission.breakdown.deviation) ?? Infinity,
    }))
    .sort(
      (a, b) =>
        b.accuracy - a.accuracy ||
        a.deviationPct - b.deviationPct ||
        a.submission.submitted_at.localeCompare(b.submission.submitted_at),
    )
    .map(({ submission, deviationPct }, i) => ({
      submission,
      rank: i + 1,
      deviationPct,
    }))
}

export type NextCase =
  | { kind: "continue"; zpid: string; street: string; underwritingId: number }
  | { kind: "start"; zpid: string; street: string }

/** "412 Ridge Rd" from the full address; the zpid when there's no address. */
export const streetOf = (p: Pick<DashboardProperty, "address" | "zpid">) =>
  p.address?.split(",")[0]?.trim() || p.zpid

/** First case that isn't done yet (drafts before new ones), other than this property. */
export function nextUnfinishedCase(
  properties: DashboardProperty[],
  currentZpid: string,
): NextCase | null {
  const open = properties.filter(
    (p) => p.zpid !== currentZpid && toTrainingStatus(p.status) !== "submitted",
  )
  for (const p of open) {
    if (p.active_underwriting_id != null)
      return {
        kind: "continue",
        zpid: p.zpid,
        street: streetOf(p),
        underwritingId: p.active_underwriting_id,
      }
  }
  const fresh = open[0]
  return fresh
    ? { kind: "start", zpid: fresh.zpid, street: streetOf(fresh) }
    : null
}
