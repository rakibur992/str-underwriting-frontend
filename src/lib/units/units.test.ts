import { describe, expect, it } from "vitest"

import {
  decimalToInput,
  fractionToInput,
  fractionToPercent,
  isBlank,
  parseDecimal,
  parseUserNumber,
  percentToFraction,
  userNumber,
} from "."

describe("parseDecimal", () => {
  it.each([
    ["675000", 675000],
    ["660000.00", 660000],
    ["-12.5", -12.5],
    [".5", 0.5],
    [42, 42],
  ])("parses %s", (input, expected) => {
    expect(parseDecimal(input)).toBe(expected)
  })

  it.each([null, undefined, "", "abc", "1,000", Number.NaN])(
    "returns null for %s",
    (input) => {
      expect(parseDecimal(input)).toBeNull()
    },
  )
})

describe("fractionToPercent", () => {
  it.each([
    ["0.0699", 6.99],
    ["0.2", 20],
    ["0.20", 20],
    ["0.07", 7],
    ["0.2786", 27.86],
    ["1", 100],
    ["0", 0],
    ["-0.035", -3.5],
    [0.07, 7],
  ])("converts %s to %s exactly", (input, expected) => {
    expect(fractionToPercent(input)).toBe(expected)
  })

  it("returns null for missing values", () => {
    expect(fractionToPercent(null)).toBeNull()
    expect(fractionToPercent("n/a")).toBeNull()
  })
})

describe("percentToFraction", () => {
  it.each([
    ["6.99", "0.0699"],
    ["20", "0.2"],
    ["100", "1"],
    ["0", "0"],
    ["0.5", "0.005"],
    ["37", "0.37"],
    ["7.25", "0.0725"],
    ["150", "1.5"],
    [20, "0.2"],
    [6.99, "0.0699"],
  ])("converts %s to %s exactly", (input, expected) => {
    expect(percentToFraction(input)).toBe(expected)
  })

  it("returns null for junk", () => {
    expect(percentToFraction("abc")).toBeNull()
    expect(percentToFraction(null)).toBeNull()
  })

  it.each(["0.0699", "0.2", "0.37", "0.0725", "1", "0"])(
    "round-trips %s through fractionToPercent",
    (fraction) => {
      expect(percentToFraction(fractionToPercent(fraction))).toBe(fraction)
    },
  )
})

describe("parseUserNumber", () => {
  it.each([
    ["650000", "650000"],
    ["$650,000", "650000"],
    [" 1,250.5 ", "1250.5"],
    ["6.99%", "6.99"],
    ["007", "7"],
    [".5", "0.5"],
    ["-12", "-12"],
  ])("parses %s as %s", (input, expected) => {
    expect(parseUserNumber(input)).toBe(expected)
  })

  it.each(["", "  ", "abc", "1.2.3", "12a", "--1"])("rejects %s", (input) => {
    expect(parseUserNumber(input)).toBeNull()
  })
})

describe("input helpers", () => {
  it("formats API values for inputs", () => {
    expect(decimalToInput("660000.00")).toBe("660000")
    expect(decimalToInput("1250.50")).toBe("1250.5")
    expect(decimalToInput(null)).toBe("")
    expect(fractionToInput("0.0699")).toBe("6.99")
    expect(fractionToInput("0.2000")).toBe("20")
    expect(fractionToInput(null)).toBe("")
  })

  it("reads user input as numbers", () => {
    expect(userNumber("$1,000")).toBe(1000)
    expect(userNumber("")).toBeNull()
    expect(isBlank("  ")).toBe(true)
    expect(isBlank("0")).toBe(false)
  })
})
