/**
 * Maps API validation errors onto the workspace: field `loc`s from FastAPI's
 * array 422, and section names from the submit-time "Missing required
 * sections: …" 422 (docs/api-contract.md).
 */
import type { ApiError, FieldError } from "@/api/errors"

import { PART_META, type PartId } from "./fields"
import type { Issue } from "./issues"

const API_FIELD_TO_PATH: Record<string, string> = {
  "purchase_details.purchase_price": "purchase.purchasePrice",
  "purchase_details.down_payment_pct": "purchase.downPaymentPct",
  "purchase_details.interest_rate": "purchase.interestRatePct",
  "purchase_details.mortgage_years": "purchase.mortgageYears",
  "purchase_details.closing_costs_pct": "purchase.closingCostsPct",
  "taxes.land_assumptions_pct": "taxes.landPct",
  "taxes.sla_multiplier_pct": "taxes.slaPct",
  "taxes.bonus_amount_pct": "taxes.bonusPct",
  "taxes.tax_rate_pct": "taxes.taxRatePct",
  "forecasted_revenue.co_hosting_fee_pct": "revenue.coHostingFeePct",
  "forecasted_revenue.annual_re_appreciation_pct": "revenue.appreciationPct",
  "forecasted_revenue.scenarios.low.forecasted_revenue": "revenue.low",
  "forecasted_revenue.scenarios.mid.forecasted_revenue": "revenue.mid",
  "forecasted_revenue.scenarios.high.forecasted_revenue": "revenue.high",
}

const API_SECTION_TO_PART: Record<string, PartId> = {
  purchase_details: "purchase",
  forecasted_revenue: "revenue",
  taxes: "taxes",
  optimization_items: "optimizationItems",
  operating_expenses: "operatingExpenses",
  tags: "tags",
}

/** `["body","purchase_details","interest_rate"]` → "purchase.interestRatePct" (null if unknown). */
export function fieldPathFromLoc(loc: FieldError["loc"]): string | null {
  const key = loc
    .filter((k) => k !== "body")
    .map(String)
    .join(".")
  return API_FIELD_TO_PATH[key] ?? null
}

/** The part a `loc` belongs to, for errors that don't map to one field. */
export function partFromLoc(loc: FieldError["loc"]): PartId | null {
  const section = loc.find((k) => k !== "body")
  return typeof section === "string"
    ? (API_SECTION_TO_PART[section] ?? null)
    : null
}

/** "Missing required sections: purchase_details, taxes" → ["purchase", "taxes"]. */
export function missingSections(message: string): PartId[] {
  const match = /missing required sections:\s*(.+)$/i.exec(message.trim())
  if (!match) return []
  return match[1]!
    .split(",")
    .map((s) => API_SECTION_TO_PART[s.trim()])
    .filter((p): p is PartId => p !== undefined)
}

/** First field of a required part, for checklist links built from the API's section names. */
const FIRST_FIELD: Partial<Record<PartId, string>> = {
  purchase: "purchase.downPaymentPct",
  revenue: "revenue.mid",
  taxes: "taxes.landPct",
}

/** A submit 422 (either shape) as checklist items; [] for any other error. */
export function issuesFromSubmitError(error: ApiError | null): Issue[] {
  if (!error || error.status !== 422) return []
  const fromSections = missingSections(error.message).map<Issue>((part) => ({
    path: FIRST_FIELD[part] ?? part,
    part,
    section: PART_META[part].section,
    label: PART_META[part].label,
    message:
      "The API says this section is missing. Check every field; if it looks complete, reload the page.",
    kind: "missing",
  }))
  const fromFields = error.fieldErrors.flatMap<Issue>((fe) => {
    const path = fieldPathFromLoc(fe.loc)
    const part = partFromLoc(fe.loc)
    if (!path || !part) return []
    return [
      {
        path,
        part,
        section: PART_META[part].section,
        label: PART_META[part].label,
        message: fe.msg,
        kind: "invalid",
      },
    ]
  })
  return [...fromSections, ...fromFields]
}
