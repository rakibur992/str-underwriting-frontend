/**
 * Every workspace input in one registry: label, unit, sensible range, the
 * section it lives in, and the message that says how to fix it. The schema,
 * save payload, section progress and review checklist all read from here.
 */

export const SECTIONS = ["financials", "analysis", "deal-tags"] as const
export type SectionId = (typeof SECTIONS)[number]

export const SECTION_LABEL: Record<SectionId, string> = {
  financials: "Financials",
  analysis: "Analysis",
  "deal-tags": "Deal tags",
}

/** A part is what saves as one unit (one API section or list). */
export const PARTS = [
  "purchase",
  "optimizationItems",
  "operatingExpenses",
  "taxes",
  "revenue",
  "tags",
] as const
export type PartId = (typeof PARTS)[number]

export const PART_META: Record<
  PartId,
  { label: string; section: SectionId; required: boolean }
> = {
  purchase: {
    label: "Purchase & financing",
    section: "financials",
    required: true,
  },
  optimizationItems: {
    label: "Optimization list",
    section: "financials",
    required: false,
  },
  operatingExpenses: {
    label: "Operating expenses",
    section: "financials",
    required: false,
  },
  taxes: { label: "Taxes", section: "financials", required: true },
  revenue: { label: "Revenue forecast", section: "analysis", required: true },
  tags: { label: "Deal tags", section: "deal-tags", required: false },
}

export type FieldKind = "money" | "percent" | "years"

export interface NumberFieldSpec {
  label: string
  kind: FieldKind
  part: PartId
  required: boolean
  min: number
  max: number
  /** `min` itself is not allowed (e.g. a purchase price of $0). */
  minExclusive?: boolean
  /** Says what to enter when the field is blank. */
  missing: string
  /** Says what range is allowed. */
  range: string
  hint?: string
}

export const NUMBER_FIELDS = {
  "purchase.purchasePrice": {
    label: "Purchase price",
    kind: "money",
    part: "purchase",
    required: true,
    min: 0,
    minExclusive: true,
    max: 100_000_000,
    missing: "Enter the purchase price",
    range: "Enter a purchase price above $0",
    hint: "Prefilled from the listing. Change it if you'd offer less.",
  },
  "purchase.downPaymentPct": {
    label: "Down payment",
    kind: "percent",
    part: "purchase",
    required: true,
    min: 0,
    max: 100,
    missing: "Enter the down payment %",
    range: "Enter a down payment between 0 and 100%",
  },
  "purchase.interestRatePct": {
    label: "Interest rate",
    kind: "percent",
    part: "purchase",
    required: true,
    min: 0,
    max: 30,
    missing: "Enter the interest rate",
    range: "Enter an interest rate between 0 and 30%",
  },
  "purchase.mortgageYears": {
    label: "Loan term",
    kind: "years",
    part: "purchase",
    required: true,
    min: 1,
    max: 50,
    missing: "Enter the loan term in years",
    range: "Enter a loan term between 1 and 50 years",
  },
  "purchase.closingCostsPct": {
    label: "Closing costs",
    kind: "percent",
    part: "purchase",
    required: true,
    min: 0,
    max: 20,
    missing: "Enter the closing costs %",
    range: "Enter closing costs between 0 and 20%",
    hint: "Share of the purchase price.",
  },
  "taxes.landPct": {
    label: "Land",
    kind: "percent",
    part: "taxes",
    required: true,
    min: 0,
    max: 100,
    missing: "Enter the land %",
    range: "Enter a land share between 0 and 100%",
    hint: "Share of the price that is land (not depreciable).",
  },
  "taxes.slaPct": {
    label: "Short-life asset multiplier",
    kind: "percent",
    part: "taxes",
    required: true,
    min: 0,
    max: 100,
    missing: "Enter the short-life asset multiplier %",
    range: "Enter a multiplier between 0 and 100%",
  },
  "taxes.bonusPct": {
    label: "Bonus depreciation",
    kind: "percent",
    part: "taxes",
    required: true,
    min: 0,
    max: 100,
    missing: "Enter the bonus depreciation %",
    range: "Enter bonus depreciation between 0 and 100%",
  },
  "taxes.taxRatePct": {
    label: "Tax rate",
    kind: "percent",
    part: "taxes",
    required: true,
    min: 0,
    max: 100,
    missing: "Enter the tax rate %",
    range: "Enter a tax rate between 0 and 100%",
  },
  "revenue.low": {
    label: "Low",
    kind: "money",
    part: "revenue",
    required: true,
    min: 0,
    max: 10_000_000,
    missing: "Enter the Low (cautious year) revenue",
    range: "Enter a yearly revenue of $0 or more",
  },
  "revenue.mid": {
    label: "Mid",
    kind: "money",
    part: "revenue",
    required: true,
    min: 0,
    max: 10_000_000,
    missing: "Enter the Mid (expected year) revenue",
    range: "Enter a yearly revenue of $0 or more",
  },
  "revenue.high": {
    label: "High",
    kind: "money",
    part: "revenue",
    required: true,
    min: 0,
    max: 10_000_000,
    missing: "Enter the High (strong year) revenue",
    range: "Enter a yearly revenue of $0 or more",
  },
  "revenue.coHostingFeePct": {
    label: "Co-hosting fee",
    kind: "percent",
    part: "revenue",
    required: false,
    min: 0,
    max: 50,
    missing: "",
    range: "Enter a co-hosting fee between 0 and 50%",
    hint: "Share of revenue paid to a co-host. Blank counts as 0%.",
  },
  "revenue.appreciationPct": {
    label: "Annual appreciation",
    kind: "percent",
    part: "revenue",
    required: false,
    min: 0,
    max: 20,
    missing: "",
    range: "Enter an appreciation between 0 and 20%",
    hint: "Yearly growth in the property's value. Blank counts as 0%.",
  },
} as const satisfies Record<string, NumberFieldSpec>

export type NumberFieldPath = keyof typeof NUMBER_FIELDS

export const ROW_LIMITS = { maxAmount: 10_000_000 } as const

/** Most training deals use these tax assumptions (docs/spec/workspace-financials.md). */
export const TAX_DEFAULTS = {
  landPct: "20",
  slaPct: "25",
  bonusPct: "60",
  taxRatePct: "37",
} as const

/** DOM id for a field path, so links can focus it ("purchase.downPaymentPct" → "field-purchase-downPaymentPct"). */
export function fieldId(path: string) {
  return `field-${path.replaceAll(".", "-")}`
}

/** Which section a field path belongs to. */
export function sectionOf(path: string): SectionId {
  const part = path.split(".")[0] as PartId
  return PART_META[part]?.section ?? "financials"
}
