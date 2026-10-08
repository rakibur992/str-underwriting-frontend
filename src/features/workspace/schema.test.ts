import { describe, expect, it } from "vitest"

import { completeValues } from "./__fixtures__/values"
import {
  canSubmit,
  collectErrors,
  collectWarnings,
  partStates,
  sectionProgress,
} from "./issues"
import { numberProblem } from "./schema"
import { NUMBER_FIELDS } from "./fields"

describe("numberProblem", () => {
  const down = NUMBER_FIELDS["purchase.downPaymentPct"]
  const years = NUMBER_FIELDS["purchase.mortgageYears"]
  const price = NUMBER_FIELDS["purchase.purchasePrice"]

  it.each([
    ["20", null],
    ["0", null],
    ["100", null],
    ["100.5", "Enter a down payment between 0 and 100%"],
    ["-1", "Enter a down payment between 0 and 100%"],
    ["twenty", "Enter a number, like 6.5"],
    ["", null],
  ])("down payment %s", (text, expected) => {
    expect(numberProblem(text, down)).toBe(expected)
  })

  it("allows at most 2 decimals on percents (the API keeps 4 dp fractions)", () => {
    const rate = NUMBER_FIELDS["purchase.interestRatePct"]
    expect(numberProblem("6.99", rate)).toBeNull()
    expect(numberProblem("6.999", rate)).toBe(
      "Use at most 2 decimals, like 6.99",
    )
  })

  it("wants whole years for the loan term", () => {
    expect(numberProblem("30", years)).toBeNull()
    expect(numberProblem("12.5", years)).toBe("Enter whole years, like 30")
    expect(numberProblem("0", years)).toBe(
      "Enter a loan term between 1 and 50 years",
    )
  })

  it("rejects a $0 purchase price but accepts formatted money", () => {
    expect(numberProblem("0", price)).toBe("Enter a purchase price above $0")
    expect(numberProblem("$650,000", price)).toBeNull()
  })
})

describe("collectErrors", () => {
  it("passes a complete underwriting", () => {
    const errors = collectErrors(completeValues())
    expect(errors).toEqual([])
    expect(canSubmit(errors)).toBe(true)
  })

  it("lists missing required fields with what to enter", () => {
    const v = completeValues()
    v.purchase.interestRatePct = ""
    v.revenue.mid = " "
    const errors = collectErrors(v)
    expect(errors).toEqual([
      expect.objectContaining({
        path: "purchase.interestRatePct",
        kind: "missing",
        section: "financials",
        label: "Purchase & financing · Interest rate",
        message: "Enter the interest rate",
      }),
      expect.objectContaining({
        path: "revenue.mid",
        kind: "missing",
        section: "analysis",
      }),
    ])
    expect(canSubmit(errors)).toBe(false)
  })

  it("flags invalid inputs separately from missing ones", () => {
    const v = completeValues()
    v.taxes.taxRatePct = "137"
    expect(collectErrors(v)).toEqual([
      expect.objectContaining({ path: "taxes.taxRatePct", kind: "invalid" }),
    ])
  })

  it("ignores blank rows but checks half-filled ones", () => {
    const v = completeValues()
    v.optimizationItems.push({ category: "", amount: "" })
    v.operatingExpenses.push({ name: "Internet", monthlyAmount: "" })
    v.operatingExpenses.push({ name: "", monthlyAmount: "abc" })
    const errors = collectErrors(v)
    expect(errors.map((e) => [e.path, e.kind])).toEqual([
      ["operatingExpenses.1.monthlyAmount", "missing"],
      ["operatingExpenses.2.name", "missing"],
      ["operatingExpenses.2.monthlyAmount", "invalid"],
    ])
    expect(errors[0]!.label).toBe(
      "Operating expenses · Expense 2 monthly amount",
    )
  })

  it("says how to fix an oversized row amount", () => {
    const v = completeValues()
    v.optimizationItems[0]!.amount = "20,000,000"
    expect(collectErrors(v)[0]!.message).toBe(
      "Enter an amount up to $10,000,000",
    )
  })

  it("treats blank co-hosting fee and appreciation as optional", () => {
    const v = completeValues()
    v.revenue.coHostingFeePct = ""
    v.revenue.appreciationPct = ""
    expect(collectErrors(v)).toEqual([])
  })
})

describe("collectWarnings", () => {
  it("warns when Low, Mid and High are out of order", () => {
    const v = completeValues()
    v.revenue.low = "130000"
    expect(collectWarnings(v)).toEqual([
      expect.objectContaining({
        path: "revenue.low",
        kind: "warning",
        message: expect.stringContaining("Low is above Mid"),
      }),
    ])
  })

  it("warns when there are no operating expenses", () => {
    const v = completeValues()
    v.operatingExpenses = [{ name: "", monthlyAmount: "" }]
    expect(collectWarnings(v).map((w) => w.path)).toEqual(["operatingExpenses"])
  })
})

describe("progress", () => {
  it("counts required fields per section", () => {
    const v = completeValues()
    v.purchase.downPaymentPct = ""
    v.purchase.closingCostsPct = "45"
    const errors = collectErrors(v)
    const [financials, analysis, tags] = sectionProgress(errors)
    expect(financials).toEqual({
      section: "financials",
      done: 7,
      total: 9,
      invalid: 1,
      complete: false,
    })
    expect(analysis).toMatchObject({ done: 3, total: 3, complete: true })
    expect(tags).toMatchObject({ total: 0, complete: true })
  })

  it("marks a part invalid over incomplete", () => {
    const v = completeValues()
    v.purchase.downPaymentPct = ""
    v.purchase.closingCostsPct = "45"
    const states = partStates(collectErrors(v))
    expect(states.purchase).toBe("invalid")
    expect(states.taxes).toBe("complete")
  })
})
