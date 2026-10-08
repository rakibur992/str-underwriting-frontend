import type { components } from "./generated/schema"

type Schemas = components["schemas"]

/** The API types these as plain strings; we narrow them here (docs/api-contract.md). */
export const TRAINING_STATUSES = [
  "not_started",
  "in_progress",
  "submitted",
] as const
export type TrainingStatus = (typeof TRAINING_STATUSES)[number]

export const RATINGS = ["best", "medium", "low"] as const
export type Rating = (typeof RATINGS)[number]

export function toTrainingStatus(value: string): TrainingStatus {
  return (TRAINING_STATUSES as readonly string[]).includes(value)
    ? (value as TrainingStatus)
    : "not_started"
}

export function toRating(value: string | null | undefined): Rating | null {
  return value && (RATINGS as readonly string[]).includes(value)
    ? (value as Rating)
    : null
}

export type DashboardResult = Schemas["DashboardResult"]
export type DashboardProperty = Schemas["DashboardProperty"]
export type DashboardSummary = Schemas["DashboardSummary"]
export type UnderwritingRead = Schemas["UnderwritingRead"]
export type SaveUnderwritingPayload = Schemas["SaveUnderwritingPayload"]
export type SubmitUnderwritingResult = Schemas["SubmitUnderwritingResult"]
export type SubmissionRead = Schemas["SubmissionRead"]
export type ScoreResult = Schemas["ScoreResult"]
export type MarketRead = Schemas["MarketRead"]

export const DEAL_STATUSES = [
  "analyst_started",
  "analyst_completed",
  "training_deal",
] as const
export type DealStatus = (typeof DEAL_STATUSES)[number]

export function toDealStatus(value: string | null | undefined): DealStatus {
  return value && (DEAL_STATUSES as readonly string[]).includes(value)
    ? (value as DealStatus)
    : "analyst_started"
}
