import { describe, expect, it } from "vitest"

import {
  EMPTY_VALUE,
  formatCurrency,
  formatDeduction,
  formatMoneyInput,
  formatWholePercent,
  formatNumber,
  formatPercent,
  formatScore,
} from "."

describe("formatCurrency", () => {
  it("formats decimal strings without cents by default", () => {
    expect(formatCurrency("675000")).toBe("$675,000")
    expect(formatCurrency("1150000.00")).toBe("$1,150,000")
    expect(formatCurrency(42111.6)).toBe("$42,112")
  })

  it("keeps cents when asked", () => {
    expect(formatCurrency("12.5", { cents: true })).toBe("$12.50")
  })

  it("handles negatives and missing values", () => {
    expect(formatCurrency("-2500")).toBe("-$2,500")
    expect(formatCurrency(null)).toBe(EMPTY_VALUE)
    expect(formatCurrency("")).toBe(EMPTY_VALUE)
  })
})

describe("formatPercent", () => {
  it("converts API fractions to whole percents", () => {
    expect(formatPercent("0.2786")).toBe("27.86%")
    expect(formatPercent("0.20")).toBe("20%")
    expect(formatPercent("0.0699")).toBe("6.99%")
    expect(formatPercent("0.07")).toBe("7%")
  })

  it("respects the digits option", () => {
    expect(formatPercent("0.27864", { digits: 1 })).toBe("27.9%")
  })

  it("returns a dash for missing values", () => {
    expect(formatPercent(undefined)).toBe(EMPTY_VALUE)
  })
})

describe("formatScore", () => {
  it("shows tier scores as whole points", () => {
    expect(formatScore("100.00")).toBe("100")
    expect(formatScore("70.00")).toBe("70")
    expect(formatScore("40.00")).toBe("40")
  })

  it("keeps one decimal for averages", () => {
    expect(formatScore("56.67")).toBe("56.7")
  })

  it("returns a dash when there is no score", () => {
    expect(formatScore(null)).toBe(EMPTY_VALUE)
  })
})

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(2150)).toBe("2,150")
    expect(formatNumber(5.5, { digits: 1 })).toBe("5.5")
  })
})

describe("input and whole-percent formatting", () => {
  it("formats whole percents", () => {
    expect(formatWholePercent(27.8612)).toBe("27.86%")
    expect(formatWholePercent(null)).toBe("—")
  })

  it("groups money inputs and keeps junk as typed", () => {
    expect(formatMoneyInput("650000")).toBe("650,000")
    expect(formatMoneyInput("$1250.5")).toBe("1,250.5")
    expect(formatMoneyInput("12a")).toBe("12a")
    expect(formatMoneyInput("")).toBe("")
  })
})

describe("formatDeduction", () => {
  it("shows a cost as a negative amount and zero as $0", () => {
    expect(formatDeduction(22200)).toBe("-$22,200")
    expect(formatDeduction(0)).toBe("$0")
    expect(formatDeduction(null)).toBe("—")
  })
})
