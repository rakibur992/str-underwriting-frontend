/**
 * The workspace form, in UI units: every number is the text the trainee typed
 * ("650,000", "6.99"), so a typo is shown back, never lost. Percentages are
 * whole numbers. Conversion to API units happens in mappers.ts via lib/units.
 */
import { z } from "zod"

import { isBlank, userNumber } from "@/lib/units"

import type { DealTagValues } from "./deal-tags/tags"
import {
  NUMBER_FIELDS,
  ROW_LIMITS,
  type NumberFieldPath,
  type NumberFieldSpec,
} from "./fields"

export interface OptimizationRow {
  category: string
  amount: string
}

export interface ExpenseRow {
  name: string
  monthlyAmount: string
}

export interface WorkspaceValues {
  purchase: {
    purchasePrice: string
    downPaymentPct: string
    interestRatePct: string
    mortgageYears: string
    closingCostsPct: string
  }
  optimizationItems: OptimizationRow[]
  operatingExpenses: ExpenseRow[]
  taxes: {
    landPct: string
    slaPct: string
    bonusPct: string
    taxRatePct: string
  }
  revenue: {
    low: string
    mid: string
    high: string
    coHostingFeePct: string
    appreciationPct: string
  }
  tags: DealTagValues
}

/** The message for a value, or null when it's fine. Blank is fine here; see `missingMessage`. */
export function numberProblem(text: string, spec: NumberFieldSpec) {
  if (isBlank(text)) return null
  const n = userNumber(text)
  if (n === null) {
    return spec.kind === "years"
      ? "Enter whole years, like 30"
      : `Enter a number, like ${spec.kind === "money" ? "250,000" : "6.5"}`
  }
  if (spec.kind === "years" && !Number.isInteger(n))
    return "Enter whole years, like 30"
  // The API keeps fractions to 4 dp, i.e. whole percents to 2 dp.
  if (spec.kind === "percent" && /\.\d{3,}/.test(text))
    return "Use at most 2 decimals, like 6.99"
  const belowMin = spec.minExclusive ? n <= spec.min : n < spec.min
  if (belowMin || n > spec.max) return spec.range
  return null
}

function numberField(path: NumberFieldPath) {
  const spec: NumberFieldSpec = NUMBER_FIELDS[path]
  return z.string().superRefine((text, ctx) => {
    if (isBlank(text)) {
      if (spec.required) ctx.addIssue({ code: "custom", message: spec.missing })
      return
    }
    const problem = numberProblem(text, spec)
    if (problem) ctx.addIssue({ code: "custom", message: problem })
  })
}

function amountProblem(text: string, what: string) {
  if (isBlank(text)) return `Enter the ${what}`
  const n = userNumber(text)
  if (n === null) return "Enter a number, like 1,200"
  if (n < 0) return `Enter an ${what} of $0 or more`
  if (n > ROW_LIMITS.maxAmount) return `Enter an ${what} up to $10,000,000`
  return null
}

/** A row with nothing in it is ignored; a half-filled row says what's missing. */
export function isBlankRow(row: object) {
  return Object.values(row).every((v) => typeof v !== "string" || isBlank(v))
}

const optimizationRow = z
  .object({ category: z.string(), amount: z.string() })
  .superRefine((row, ctx) => {
    if (isBlankRow(row)) return
    if (isBlank(row.category))
      ctx.addIssue({
        code: "custom",
        path: ["category"],
        message: "Name this item, like Furniture",
      })
    const problem = amountProblem(row.amount, "amount")
    if (problem)
      ctx.addIssue({ code: "custom", path: ["amount"], message: problem })
  })

const expenseRow = z
  .object({ name: z.string(), monthlyAmount: z.string() })
  .superRefine((row, ctx) => {
    if (isBlankRow(row)) return
    if (isBlank(row.name))
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: "Name this expense, like Utilities",
      })
    const problem = amountProblem(row.monthlyAmount, "amount")
    if (problem)
      ctx.addIssue({
        code: "custom",
        path: ["monthlyAmount"],
        message: problem,
      })
  })

/** Everything a complete, submittable underwriting needs. */
export const workspaceSchema = z.object({
  purchase: z.object({
    purchasePrice: numberField("purchase.purchasePrice"),
    downPaymentPct: numberField("purchase.downPaymentPct"),
    interestRatePct: numberField("purchase.interestRatePct"),
    mortgageYears: numberField("purchase.mortgageYears"),
    closingCostsPct: numberField("purchase.closingCostsPct"),
  }),
  optimizationItems: z.array(optimizationRow),
  operatingExpenses: z.array(expenseRow),
  taxes: z.object({
    landPct: numberField("taxes.landPct"),
    slaPct: numberField("taxes.slaPct"),
    bonusPct: numberField("taxes.bonusPct"),
    taxRatePct: numberField("taxes.taxRatePct"),
  }),
  revenue: z.object({
    low: numberField("revenue.low"),
    mid: numberField("revenue.mid"),
    high: numberField("revenue.high"),
    coHostingFeePct: numberField("revenue.coHostingFeePct"),
    appreciationPct: numberField("revenue.appreciationPct"),
  }),
  tags: z.custom<DealTagValues>(
    (value) => typeof value === "object" && value !== null,
  ),
})

/** Low ≤ Mid ≤ High is expected but not required: a warning, never a block. */
export function revenueOrderWarning(
  revenue: WorkspaceValues["revenue"],
): string | null {
  const low = userNumber(revenue.low)
  const mid = userNumber(revenue.mid)
  const high = userNumber(revenue.high)
  if (low !== null && mid !== null && low > mid)
    return "Low is above Mid. A cautious year usually earns less than an expected one."
  if (mid !== null && high !== null && mid > high)
    return "Mid is above High. A strong year usually earns more than an expected one."
  if (low !== null && high !== null && low > high)
    return "Low is above High. Check the order of your scenarios."
  return null
}
