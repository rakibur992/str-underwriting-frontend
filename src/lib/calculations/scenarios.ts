/** Per-scenario earnings and returns (docs/spec/calculations.md §5, §6). Whole-number percents. */

export const SCENARIOS = ["low", "mid", "high"] as const
export type Scenario = (typeof SCENARIOS)[number]

/** Low and High nudge operating expenses down and up. */
export const OPEX_FACTOR: Record<Scenario, number> = {
  low: 0.96,
  mid: 1,
  high: 1.04,
}

export function scenarioOperatingExpenses(
  monthlyOpex: number,
  scenario: Scenario,
) {
  return monthlyOpex * 12 * OPEX_FACTOR[scenario]
}

export function coHostingFee(revenue: number, coHostingFeePct: number) {
  return (coHostingFeePct / 100) * revenue
}

/** Revenue − scenario operating expenses − co-hosting fee. */
export function netOperatingIncome(
  revenue: number,
  operatingExpenses: number,
  coHostingFeeAmount: number,
) {
  return revenue - operatingExpenses - coHostingFeeAmount
}

/** Returns a whole percent; 0 when nothing was put in. */
export function cashOnCashPct(annualFreeCashFlow: number, totalOop: number) {
  return totalOop === 0 ? 0 : (annualFreeCashFlow / totalOop) * 100
}

export function annualAppreciation(
  purchasePrice: number,
  appreciationPct: number,
) {
  return purchasePrice * (appreciationPct / 100)
}

/** (FCF + year-1 principal pay-down + appreciation) / Total OOP, as a whole percent. */
export function totalReturnPct(
  annualFreeCashFlow: number,
  principalPaydown: number,
  appreciation: number,
  totalOop: number,
) {
  return totalOop === 0
    ? 0
    : ((annualFreeCashFlow + principalPaydown + appreciation) / totalOop) * 100
}
