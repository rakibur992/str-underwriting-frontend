/**
 * API ↔ workspace form. All unit conversion goes through lib/units (ADR-0007):
 * fractions ↔ whole percents, decimal strings ↔ numbers and input text.
 */
import { parseUnderwritingDetail } from "@/api/detail-schemas"
import type { SaveUnderwritingPayload, UnderwritingRead } from "@/api/types"
import {
  calculateUnderwriting,
  sumAmounts,
  type ScenarioResult,
  type UnderwritingInputs,
  type UnderwritingResults,
} from "@/lib/calculations"
import { formatMoneyInput } from "@/lib/format"
import {
  decimalToInput,
  fractionToInput,
  fractionToPercent,
  parseDecimal,
  parseUserNumber,
  percentToFraction,
  userNumber,
} from "@/lib/units"

import { DEAL_TAGS, type DealTagValues } from "./deal-tags/tags"
import { PARTS, TAX_DEFAULTS, type PartId } from "./fields"
import type { PartState } from "./issues"
import { isBlankRow, type WorkspaceValues } from "./schema"

/** Saved money → grouped input text ("660000.00" → "660,000"). */
const moneyInput = (value: string | number | null | undefined) =>
  formatMoneyInput(decimalToInput(value))

/** Form values from a saved underwriting. `withDefaults` fills untouched tax assumptions. */
export function toFormValues(
  uw: UnderwritingRead,
  { withDefaults = true }: { withDefaults?: boolean } = {},
): WorkspaceValues {
  const { purchaseDetails: pd, forecastedRevenue: fr } =
    parseUnderwritingDetail(uw)
  const taxesSaved = uw.taxes?.land_assumptions_pct != null
  const taxes =
    taxesSaved || !withDefaults
      ? {
          landPct: fractionToInput(uw.taxes?.land_assumptions_pct),
          slaPct: fractionToInput(uw.taxes?.sla_multiplier_pct),
          bonusPct: fractionToInput(uw.taxes?.bonus_amount_pct),
          taxRatePct: fractionToInput(uw.taxes?.tax_rate_pct),
        }
      : { ...TAX_DEFAULTS }

  return {
    purchase: {
      purchasePrice: moneyInput(pd?.purchase_price ?? uw.purchase_price),
      downPaymentPct: fractionToInput(pd?.down_payment_pct),
      interestRatePct: fractionToInput(pd?.interest_rate),
      mortgageYears:
        pd?.mortgage_years != null ? String(pd.mortgage_years) : "",
      closingCostsPct: fractionToInput(pd?.closing_costs_pct),
    },
    optimizationItems: uw.optimization_items.map((item) => ({
      category: item.category ?? "",
      amount: moneyInput(item.total_price),
    })),
    operatingExpenses: uw.operating_expenses.map((e) => ({
      name: e.expense_name ?? "",
      monthlyAmount: moneyInput(e.monthly_amount),
    })),
    taxes,
    revenue: {
      low: moneyInput(fr?.scenarios?.low?.forecasted_revenue),
      mid: moneyInput(fr?.scenarios?.mid?.forecasted_revenue),
      high: moneyInput(fr?.scenarios?.high?.forecasted_revenue),
      coHostingFeePct: fractionToInput(fr?.co_hosting_fee_pct),
      appreciationPct: fractionToInput(fr?.annual_re_appreciation_pct),
    },
    tags: Object.fromEntries(
      DEAL_TAGS.map(({ key }) => [key, uw[key] === true]),
    ) as DealTagValues,
  }
}

const money = (text: string) => parseUserNumber(text) ?? "0"
const fraction = (text: string) =>
  percentToFraction(parseUserNumber(text) ?? "0") ?? "0"

/** The API payload for one part. Only call for parts in the "complete" state. */
function partPayload(
  part: PartId,
  v: WorkspaceValues,
): SaveUnderwritingPayload {
  switch (part) {
    case "purchase":
      return {
        purchase_details: {
          purchase_price: money(v.purchase.purchasePrice),
          down_payment_pct: fraction(v.purchase.downPaymentPct),
          interest_rate: fraction(v.purchase.interestRatePct),
          mortgage_years: Number(parseUserNumber(v.purchase.mortgageYears)),
          closing_costs_pct: fraction(v.purchase.closingCostsPct),
        },
      }
    case "optimizationItems":
      return {
        optimization_items: v.optimizationItems
          .filter((row) => !isBlankRow(row))
          .map((row) => ({
            category: row.category.trim(),
            total_price: money(row.amount),
          })),
      }
    case "operatingExpenses":
      return {
        operating_expenses: v.operatingExpenses
          .filter((row) => !isBlankRow(row))
          .map((row) => ({
            expense_name: row.name.trim(),
            monthly_amount: money(row.monthlyAmount),
          })),
      }
    case "taxes":
      return {
        taxes: {
          land_assumptions_pct: fraction(v.taxes.landPct),
          sla_multiplier_pct: fraction(v.taxes.slaPct),
          bonus_amount_pct: fraction(v.taxes.bonusPct),
          tax_rate_pct: fraction(v.taxes.taxRatePct),
        },
      }
    case "revenue":
      return {
        forecasted_revenue: {
          co_hosting_fee_pct: fraction(v.revenue.coHostingFeePct),
          annual_re_appreciation_pct: fraction(v.revenue.appreciationPct),
          scenarios: {
            low: { forecasted_revenue: money(v.revenue.low) },
            mid: { forecasted_revenue: money(v.revenue.mid) },
            high: { forecasted_revenue: money(v.revenue.high) },
          },
        },
      }
    case "tags":
      // Always send booleans: a null tag is ignored by the API and can't clear it.
      return { tags: { ...v.tags } }
  }
}

export interface PartSnapshot {
  /** Saveable now (complete and valid). */
  sendable: boolean
  /** Compares "what would be saved"; changes whenever the part's input changes. */
  key: string
  payload: SaveUnderwritingPayload
}

/** One snapshot per part, used to decide what's unsaved and what can be saved. */
export function snapshotParts(
  values: WorkspaceValues,
  states: Record<PartId, PartState>,
): Record<PartId, PartSnapshot> {
  return Object.fromEntries(
    PARTS.map((part) => {
      const sendable = states[part] === "complete"
      const payload = sendable ? partPayload(part, values) : {}
      const key = sendable
        ? JSON.stringify(payload)
        : `draft:${JSON.stringify(values[part])}`
      return [part, { sendable, key, payload }]
    }),
  ) as Record<PartId, PartSnapshot>
}

/** Merge the payloads of the given parts into one request body. */
export function mergePayloads(
  snapshots: Record<PartId, PartSnapshot>,
  parts: PartId[],
): SaveUnderwritingPayload {
  return Object.assign({}, ...parts.map((p) => snapshots[p].payload))
}

/** Full body for submit: every part (call only when nothing is missing or invalid). */
export function toSubmitPayload(values: WorkspaceValues) {
  return Object.assign(
    {},
    ...PARTS.map((part) => partPayload(part, values)),
  ) as SaveUnderwritingPayload
}

/** Live-preview inputs from what's typed. Blank optional percents count as 0. */
export function toCalculationInputs(v: WorkspaceValues): UnderwritingInputs {
  const amounts = <T extends object>(rows: T[], amount: (row: T) => string) =>
    rows.filter((r) => !isBlankRow(r)).map((r) => userNumber(amount(r)))
  return {
    purchasePrice: userNumber(v.purchase.purchasePrice),
    downPaymentPct: userNumber(v.purchase.downPaymentPct),
    interestRatePct: userNumber(v.purchase.interestRatePct),
    mortgageYears: userNumber(v.purchase.mortgageYears),
    closingCostsPct: userNumber(v.purchase.closingCostsPct),
    optimizationTotal: sumAmounts(
      amounts(v.optimizationItems, (r) => r.amount),
    ),
    monthlyOpex: sumAmounts(
      amounts(v.operatingExpenses, (r) => r.monthlyAmount),
    ),
    coHostingFeePct: userNumber(v.revenue.coHostingFeePct) ?? 0,
    appreciationPct: userNumber(v.revenue.appreciationPct) ?? 0,
    revenue: {
      low: userNumber(v.revenue.low),
      mid: userNumber(v.revenue.mid),
      high: userNumber(v.revenue.high),
    },
    taxes: {
      landPct: userNumber(v.taxes.landPct),
      slaPct: userNumber(v.taxes.slaPct),
      bonusPct: userNumber(v.taxes.bonusPct),
      taxRatePct: userNumber(v.taxes.taxRatePct),
    },
  }
}

export function previewResults(values: WorkspaceValues) {
  return calculateUnderwriting(toCalculationInputs(values))
}

/**
 * The API's saved results in the same shape as the preview, or null until the
 * API has computed them (it needs purchase details, revenue and taxes saved).
 */
export function apiResults(uw: UnderwritingRead): UnderwritingResults | null {
  const {
    purchaseDetails: pd,
    forecastedRevenue: fr,
    cocWithTaxSavings,
  } = parseUnderwritingDetail(uw)
  const scenarios = fr?.scenarios
  if (
    uw.total_oop == null ||
    !pd ||
    !scenarios?.low ||
    !scenarios.mid ||
    !scenarios.high ||
    uw.taxes?.tax_savings == null
  )
    return null

  const n = parseDecimal
  const scenario = (s: "low" | "mid" | "high"): ScenarioResult => {
    const api = scenarios[s]!
    return {
      revenue: n(api.forecasted_revenue),
      operatingExpenses: n(api.operating_expenses_annual) ?? 0,
      coHostingFee: n(api.co_hosting_fee),
      netOperatingIncome: n(api.net_operating_income),
      annualDebtService: n(api.debt_service_annual),
      freeCashFlow: n(api.annual_free_cash_flow),
      cashOnCashPct: fractionToPercent(api.cash_on_cash_pct),
      cashOnCashWithTaxSavingsPct: fractionToPercent(
        cocWithTaxSavings?.[`${s}_pct`],
      ),
      totalReturnPct: fractionToPercent(api.annual_total_re_return_pct),
    }
  }
  const mid = scenario("mid")
  const annualDebt = mid.annualDebtService
  const t = uw.taxes

  return {
    downPayment: n(pd.down_payment_amount),
    closingCosts: n(pd.closing_costs_amount),
    optimizationTotal: n(uw.optimization_total) ?? 0,
    totalOop: n(uw.total_oop),
    loanAmount: n(pd.loan_amount),
    monthlyDebtService: annualDebt === null ? null : annualDebt / 12,
    annualDebtService: annualDebt,
    principalPaydown: n(scenarios.mid.principal_pay_down),
    appreciation: n(scenarios.mid.annual_re_appreciation),
    monthlyOpex: n(uw.operating_expense_total) ?? 0,
    depreciation: {
      improvementBasis: n(t.improvement_basis) ?? 0,
      shortLifeAssets: n(t.estimated_short_life_assets) ?? 0,
      yearOneLoss: n(t.y1_loss_from_depreciation) ?? 0,
      taxSavings: n(t.tax_savings) ?? 0,
    },
    prrPct: fractionToPercent(uw.prr),
    scenarios: { low: scenario("low"), mid, high: scenario("high") },
  }
}
