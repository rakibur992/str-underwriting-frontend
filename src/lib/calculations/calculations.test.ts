import { describe, expect, it } from "vitest"

import { fractionToPercent, parseDecimal } from "@/lib/units"

import cases from "./fixtures/api-calculations.json"
import { monthlyPayment, yearOnePrincipalPaydown } from "./financing"
import {
  calculateUnderwriting,
  SCENARIOS,
  sumAmounts,
  type UnderwritingInputs,
} from "."

// The API rounds money to 2 dp and fractions to 4 dp (docs/spec/calculations.md).
const MONEY = 0.01
const FRACTION_AS_PCT = 0.01 // ±0.0001 as a fraction = ±0.01 as a whole percent

type Case = (typeof cases)[number]

const num = (v: string | number | null | undefined) => parseDecimal(v) ?? 0
const pct = (v: string | number | null | undefined) => fractionToPercent(v) ?? 0

function toInputs({ input }: Case): UnderwritingInputs {
  const p = input.purchase_details
  const r = input.forecasted_revenue
  const t = input.taxes
  return {
    purchasePrice: num(p.purchase_price),
    downPaymentPct: pct(p.down_payment_pct),
    interestRatePct: pct(p.interest_rate),
    mortgageYears: p.mortgage_years,
    closingCostsPct: pct(p.closing_costs_pct),
    optimizationTotal: sumAmounts(
      input.optimization_items.map((i) => num(i.total_price)),
    ),
    monthlyOpex: sumAmounts(
      input.operating_expenses.map((e) => num(e.monthly_amount)),
    ),
    coHostingFeePct: pct(r.co_hosting_fee_pct),
    appreciationPct: pct(r.annual_re_appreciation_pct),
    revenue: {
      low: num(r.scenarios.low.forecasted_revenue),
      mid: num(r.scenarios.mid.forecasted_revenue),
      high: num(r.scenarios.high.forecasted_revenue),
    },
    taxes: {
      landPct: pct(t.land_assumptions_pct),
      slaPct: pct(t.sla_multiplier_pct),
      bonusPct: pct(t.bonus_amount_pct),
      taxRatePct: pct(t.tax_rate_pct),
    },
  }
}

describe.each(cases.map((c) => [c.name, c] as const))(
  "matches the API: %s",
  (_name, c) => {
    const result = calculateUnderwriting(toInputs(c))
    const out = c.output

    it("financing and Total Out of Pocket", () => {
      const pd = out.purchase_details
      expect(result.loanAmount).toBeCloseTo(num(pd.loan_amount), 2)
      expect(result.downPayment).toBeCloseTo(num(pd.down_payment_amount), 2)
      expect(result.closingCosts).toBeCloseTo(num(pd.closing_costs_amount), 2)
      expect(result.optimizationTotal).toBeCloseTo(
        num(out.optimization_total),
        2,
      )
      expect(result.monthlyOpex).toBeCloseTo(
        num(out.operating_expense_total),
        2,
      )
      expect(Math.abs(result.totalOop! - num(out.total_oop))).toBeLessThan(
        MONEY,
      )
    })

    it("depreciation chain and tax savings", () => {
      const d = result.depreciation!
      const t = out.taxes
      expect(
        Math.abs(d.improvementBasis - num(t.improvement_basis)),
      ).toBeLessThan(MONEY)
      expect(
        Math.abs(d.shortLifeAssets - num(t.estimated_short_life_assets)),
      ).toBeLessThan(MONEY)
      expect(
        Math.abs(d.yearOneLoss - num(t.y1_loss_from_depreciation)),
      ).toBeLessThan(MONEY)
      expect(Math.abs(d.taxSavings - num(t.tax_savings))).toBeLessThan(MONEY)
    })

    it("PRR", () => {
      expect(Math.abs(result.prrPct! - pct(out.prr))).toBeLessThan(
        FRACTION_AS_PCT,
      )
    })

    it.each(SCENARIOS)("%s scenario", (s) => {
      const api = out.scenarios[s]
      const mine = result.scenarios[s]
      const money: [number | null, string][] = [
        [mine.operatingExpenses, api.operating_expenses_annual],
        [mine.coHostingFee, api.co_hosting_fee],
        [mine.netOperatingIncome, api.net_operating_income],
        [mine.annualDebtService, api.debt_service_annual],
        [mine.freeCashFlow, api.annual_free_cash_flow],
        [result.principalPaydown, api.principal_pay_down],
        [result.appreciation, api.annual_re_appreciation],
      ]
      for (const [value, expected] of money) {
        expect(Math.abs(value! - num(expected))).toBeLessThan(MONEY)
      }
      const percents: [number | null, string][] = [
        [mine.cashOnCashPct, api.cash_on_cash_pct],
        [mine.totalReturnPct, api.annual_total_re_return_pct],
        [
          mine.cashOnCashWithTaxSavingsPct,
          out.y1_coc_incl_tax_savings[`${s}_pct`],
        ],
      ]
      for (const [value, expected] of percents) {
        // Compare against the API's 4-dp rounding of the same fraction.
        expect(Math.abs(value! - pct(expected))).toBeLessThanOrEqual(
          FRACTION_AS_PCT / 2 + 1e-9,
        )
      }
    })

    it("top-level cash-on-cash matches the scenarios", () => {
      expect(result.scenarios.low.cashOnCashPct).toBeCloseTo(
        pct(out.l_cash_on_cash),
        1,
      )
      expect(result.scenarios.mid.cashOnCashPct).toBeCloseTo(
        pct(out.m_cash_on_cash),
        1,
      )
      expect(result.scenarios.high.cashOnCashPct).toBeCloseTo(
        pct(out.h_cash_on_cash),
        1,
      )
    })
  },
)

describe("documented spot check (docs/spec/calculations.md, Gatlinburg)", () => {
  // Inputs from docs/api-contract.md and the spot check's own totals; no reference data is read.
  const r = calculateUnderwriting({
    purchasePrice: 660_000,
    downPaymentPct: 20,
    interestRatePct: 6.99,
    mortgageYears: 30,
    closingCostsPct: 3,
    optimizationTotal: 66_000,
    monthlyOpex: 1_850,
    coHostingFeePct: 0,
    appreciationPct: 3,
    revenue: { low: 105_000, mid: 125_000, high: 142_000 },
    taxes: { landPct: 20, slaPct: 25, bonusPct: 60, taxRatePct: 37 },
  })

  it("matches every documented number", () => {
    expect(r.loanAmount).toBe(528_000)
    expect(r.annualDebtService).toBeCloseTo(42_111.02, 2)
    expect(r.scenarios.mid.netOperatingIncome).toBeCloseTo(102_800, 2)
    expect(r.scenarios.mid.freeCashFlow).toBeCloseTo(60_688.98, 2)
    expect(r.totalOop).toBeCloseTo(217_800, 2)
    expect(r.scenarios.mid.cashOnCashPct).toBeCloseTo(27.86, 2)
    expect(r.depreciation!.taxSavings).toBeCloseTo(32_967, 2)
  })
})

describe("partial inputs", () => {
  const empty: UnderwritingInputs = {
    purchasePrice: null,
    downPaymentPct: null,
    interestRatePct: null,
    mortgageYears: null,
    closingCostsPct: null,
    optimizationTotal: 0,
    monthlyOpex: 0,
    coHostingFeePct: 0,
    appreciationPct: 0,
    revenue: { low: null, mid: null, high: null },
    taxes: { landPct: null, slaPct: null, bonusPct: null, taxRatePct: null },
  }

  it("returns nulls until inputs exist", () => {
    const r = calculateUnderwriting(empty)
    expect(r.totalOop).toBeNull()
    expect(r.annualDebtService).toBeNull()
    expect(r.depreciation).toBeNull()
    expect(r.prrPct).toBeNull()
    expect(r.scenarios.mid.freeCashFlow).toBeNull()
    expect(r.scenarios.mid.operatingExpenses).toBe(0)
  })

  it("previews NOI from revenue alone, before financing is entered", () => {
    const r = calculateUnderwriting({
      ...empty,
      monthlyOpex: 1000,
      coHostingFeePct: 10,
      revenue: { low: 50_000, mid: 60_000, high: 70_000 },
    })
    expect(r.scenarios.low.netOperatingIncome).toBeCloseTo(
      50_000 - 11_520 - 5_000,
    )
    expect(r.scenarios.mid.netOperatingIncome).toBeCloseTo(
      60_000 - 12_000 - 6_000,
    )
    expect(r.scenarios.high.netOperatingIncome).toBeCloseTo(
      70_000 - 12_480 - 7_000,
    )
    expect(r.scenarios.mid.freeCashFlow).toBeNull()
  })

  it("returns 0% cash-on-cash when nothing is put in", () => {
    const r = calculateUnderwriting({
      ...empty,
      purchasePrice: 100_000,
      downPaymentPct: 0,
      closingCostsPct: 0,
      interestRatePct: 5,
      mortgageYears: 30,
      revenue: { low: 1, mid: 1, high: 1 },
    })
    expect(r.totalOop).toBe(0)
    expect(r.scenarios.mid.cashOnCashPct).toBe(0)
  })
})

describe("debt service", () => {
  it("matches the standard amortization payment", () => {
    // $400k at 6% for 30 years ≈ $2,398.20 a month.
    expect(monthlyPayment(400_000, 6, 30)).toBeCloseTo(2398.2, 2)
  })

  it("splits evenly with a zero rate", () => {
    expect(monthlyPayment(120_000, 0, 10)).toBe(1000)
    expect(yearOnePrincipalPaydown(120_000, 0, 10)).toBe(12_000)
  })

  it("repays the whole loan within a one-year term", () => {
    expect(yearOnePrincipalPaydown(10_000, 5, 1)).toBeCloseTo(10_000, 6)
  })
})
