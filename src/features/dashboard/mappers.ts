import {
  toRating,
  toTrainingStatus,
  type DashboardProperty,
  type DashboardResult,
  type Rating,
  type TrainingStatus,
} from "@/api/types"
import { formatCurrency, formatNumber } from "@/lib/format"

export interface Score {
  rating: Rating | null
  accuracy: string | null
}

export interface PropertyRow {
  zpid: string
  street: string
  locality: string
  imageUrl: string | null
  marketName: string
  price: string
  rooms: string
  area: string
  status: TrainingStatus
  attempts: number
  latest: Score
  best: Score
  activeUnderwritingId: number | null
  latestSubmissionId: number | null
}

export interface DashboardSummaryView {
  total: number
  scored: number
  inProgress: number
  notStarted: number
  averageAccuracy: string | null
}

export type RowAction =
  | { kind: "start"; label: "Start" | "Try again" }
  | { kind: "continue"; label: "Continue"; underwritingId: number }
  | {
      kind: "view-result"
      label: "View result" | "Last result"
      submissionId: number
    }

/** Next thing to do first: drafts to finish, then new cases, then finished ones. */
const STATUS_ORDER: Record<TrainingStatus, number> = {
  in_progress: 0,
  not_started: 1,
  submitted: 2,
}

export function toPropertyRow(p: DashboardProperty): PropertyRow {
  const street = p.address?.split(",")[0]?.trim() || p.zpid
  const locality = [p.city, [p.state, p.zipcode].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ")
  const rooms = [
    p.beds != null ? `${p.beds} bd` : null,
    p.baths != null ? `${formatNumber(p.baths, { digits: 1 })} ba` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return {
    zpid: p.zpid,
    street,
    locality,
    imageUrl: p.img_src || null,
    marketName: p.market_name ?? "Unassigned market",
    price:
      p.unformatted_price != null
        ? formatCurrency(p.unformatted_price)
        : (p.price ?? formatCurrency(null)),
    rooms,
    area: p.area != null ? `${formatNumber(p.area)} sq ft` : "",
    status: toTrainingStatus(p.status),
    attempts: p.attempts,
    latest: {
      rating: toRating(p.latest_rating),
      accuracy: p.latest_accuracy ?? null,
    },
    best: {
      rating: toRating(p.best_rating),
      accuracy: p.best_accuracy ?? null,
    },
    activeUnderwritingId: p.active_underwriting_id ?? null,
    latestSubmissionId: p.latest_submission_id ?? null,
  }
}

export function toPropertyRows(properties: DashboardProperty[]): PropertyRow[] {
  return properties
    .map(toPropertyRow)
    .map((row, index) => ({ row, index }))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.row.status] - STATUS_ORDER[b.row.status] ||
        a.index - b.index,
    )
    .map(({ row }) => row)
}

/**
 * "Scored" counts properties with at least one attempt. The API's `submitted`
 * count drops a property once a retry draft exists, so it undercounts progress.
 */
export function toSummary(result: DashboardResult): DashboardSummaryView {
  return {
    total: result.summary.total_properties,
    scored: result.properties.filter((p) => p.attempts > 0).length,
    inProgress: result.summary.in_progress,
    notStarted: result.summary.not_started,
    averageAccuracy: result.summary.average_accuracy ?? null,
  }
}

/** One primary action per row, chosen by status; plus an optional secondary. */
export function getRowActions(row: PropertyRow): {
  primary: RowAction
  secondary?: RowAction
} {
  const lastResult: RowAction | undefined =
    row.latestSubmissionId !== null
      ? {
          kind: "view-result",
          label: "Last result",
          submissionId: row.latestSubmissionId,
        }
      : undefined

  // Any open draft wins over status, so we never POST a duplicate.
  if (row.activeUnderwritingId !== null) {
    return {
      primary: {
        kind: "continue",
        label: "Continue",
        underwritingId: row.activeUnderwritingId,
      },
      secondary: lastResult,
    }
  }
  if (row.status === "submitted" && row.latestSubmissionId !== null) {
    return {
      primary: {
        kind: "view-result",
        label: "View result",
        submissionId: row.latestSubmissionId,
      },
      secondary: { kind: "start", label: "Try again" },
    }
  }
  return { primary: { kind: "start", label: "Start" } }
}
