import { describe, expect, it } from "vitest"

import type { UnderwritingRead } from "@/api/types"

import { completeValues } from "./__fixtures__/values"
import { collectErrors, partStates } from "./issues"
import {
  apiResults,
  mergePayloads,
  snapshotParts,
  toFormValues,
  toSubmitPayload,
} from "./mappers"

/** Only the fields the mappers read; the rest of UnderwritingRead is irrelevant here. */
function underwriting(overrides: Partial<UnderwritingRead>): UnderwritingRead {
  return {
    id: 42,
    purchase_price: "675000.00",
    total_oop: null,
    prr: null,
    optimization_total: null,
    operating_expense_total: null,
    optimization_items: [],
    operating_expenses: [],
    detail: null,
    taxes: null,
    turnkey: null,
    luxury: true,
    ...overrides,
  } as UnderwritingRead
}

describe("toFormValues", () => {
  it("prefills a new draft with the listing price and the training tax defaults", () => {
    const v = toFormValues(underwriting({}))
    expect(v.purchase).toEqual({
      purchasePrice: "675,000",
      downPaymentPct: "",
      interestRatePct: "",
      mortgageYears: "",
      closingCostsPct: "",
    })
    expect(v.taxes).toEqual({
      landPct: "20",
      slaPct: "25",
      bonusPct: "60",
      taxRatePct: "37",
    })
    expect(v.tags.luxury).toBe(true)
    expect(v.tags.turnkey).toBe(false)
  })

  it("leaves taxes blank when asked for the saved values only", () => {
    const v = toFormValues(underwriting({}), { withDefaults: false })
    expect(v.taxes.landPct).toBe("")
  })

  it("converts saved fractions to whole percents", () => {
    const v = toFormValues(
      underwriting({
        detail: {
          purchase_details: {
            purchase_price: "660000",
            down_payment_pct: "0.20",
            interest_rate: "0.0699",
            mortgage_years: 30,
            closing_costs_pct: "0.03",
          },
          forecasted_revenue: {
            co_hosting_fee_pct: "0.0",
            annual_re_appreciation_pct: "0.03",
            scenarios: {
              low: { forecasted_revenue: "105000.00" },
              mid: { forecasted_revenue: "125000.00" },
              high: { forecasted_revenue: "142000.00" },
            },
          },
        },
        operating_expenses: [
          { id: 1, expense_name: "Utilities", monthly_amount: "650.50" },
        ],
      }),
    )
    expect(v.purchase).toEqual({
      purchasePrice: "660,000",
      downPaymentPct: "20",
      interestRatePct: "6.99",
      mortgageYears: "30",
      closingCostsPct: "3",
    })
    expect(v.revenue).toEqual({
      low: "105,000",
      mid: "125,000",
      high: "142,000",
      coHostingFeePct: "0",
      appreciationPct: "3",
    })
    expect(v.operatingExpenses).toEqual([
      { name: "Utilities", monthlyAmount: "650.5" },
    ])
  })
})

describe("save payloads", () => {
  it("sends fractions and decimal strings, never floats", () => {
    expect(toSubmitPayload(completeValues())).toEqual({
      purchase_details: {
        purchase_price: "650000",
        down_payment_pct: "0.2",
        interest_rate: "0.0699",
        mortgage_years: 30,
        closing_costs_pct: "0.03",
      },
      optimization_items: [{ category: "Furniture", total_price: "40000" }],
      operating_expenses: [
        { expense_name: "Utilities", monthly_amount: "650" },
      ],
      taxes: {
        land_assumptions_pct: "0.2",
        sla_multiplier_pct: "0.25",
        bonus_amount_pct: "0.6",
        tax_rate_pct: "0.37",
      },
      forecasted_revenue: {
        co_hosting_fee_pct: "0",
        annual_re_appreciation_pct: "0.03",
        scenarios: {
          low: { forecasted_revenue: "100000" },
          mid: { forecasted_revenue: "120000" },
          high: { forecasted_revenue: "140000" },
        },
      },
      tags: expect.objectContaining({ turnkey: false, luxury: false }),
    })
  })

  it("only makes complete parts sendable, and skips blank rows", () => {
    const v = completeValues()
    v.purchase.interestRatePct = ""
    v.operatingExpenses.push({ name: "", monthlyAmount: "" })
    const snapshots = snapshotParts(v, partStates(collectErrors(v)))
    expect(snapshots.purchase.sendable).toBe(false)
    expect(snapshots.taxes.sendable).toBe(true)
    expect(
      mergePayloads(snapshots, ["operatingExpenses", "taxes"]),
    ).toMatchObject({
      operating_expenses: [
        { expense_name: "Utilities", monthly_amount: "650" },
      ],
      taxes: { tax_rate_pct: "0.37" },
    })
  })

  it("changes a part's key when its input changes, even while unsendable", () => {
    const v = completeValues()
    v.purchase.interestRatePct = ""
    const before = snapshotParts(v, partStates(collectErrors(v))).purchase.key
    v.purchase.downPaymentPct = "25"
    const after = snapshotParts(v, partStates(collectErrors(v))).purchase.key
    expect(after).not.toBe(before)
  })
})

describe("apiResults", () => {
  it("is null until the API has computed the underwriting", () => {
    expect(apiResults(underwriting({}))).toBeNull()
  })

  it("reads saved outputs in whole percents", () => {
    const scenario = {
      forecasted_revenue: "125000.00",
      operating_expenses_annual: "22200.00",
      co_hosting_fee: "0.00",
      net_operating_income: "102800.00",
      debt_service_annual: "42111.02",
      annual_free_cash_flow: "60688.98",
      principal_pay_down: "5373.82",
      annual_re_appreciation: "19800.00",
      cash_on_cash_pct: "0.2786",
      annual_total_re_return_pct: "0.3942",
    }
    const result = apiResults(
      underwriting({
        total_oop: "217800.00",
        prr: "0.1894",
        operating_expense_total: "1850.00",
        detail: {
          purchase_details: {
            loan_amount: "528000.00",
            down_payment_amount: "132000.00",
            closing_costs_amount: "19800.00",
          },
          forecasted_revenue: {
            scenarios: { low: scenario, mid: scenario, high: scenario },
          },
          y1_coc_incl_tax_savings: { mid_pct: "0.4300" },
        },
        taxes: {
          improvement_basis: "594000.00",
          estimated_short_life_assets: "148500.00",
          y1_loss_from_depreciation: "89100.00",
          tax_savings: "32967.00",
        },
      }),
    )
    expect(result).toMatchObject({
      totalOop: 217800,
      loanAmount: 528000,
      monthlyOpex: 1850,
      prrPct: 18.94,
      depreciation: { taxSavings: 32967 },
    })
    expect(result!.scenarios.mid).toMatchObject({
      freeCashFlow: 60688.98,
      cashOnCashPct: 27.86,
      cashOnCashWithTaxSavingsPct: 43,
    })
  })
})
