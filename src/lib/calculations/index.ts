/**
 * Live-preview copy of the API's underwriting formulas (docs/spec/calculations.md).
 * Plain numbers, whole-number percents. Each output is null until its inputs exist.
 * The API's saved numbers are the source of truth; this only previews them.
 */
import { depreciationChain, type DepreciationChain } from "./depreciation"
import {
  closingCosts,
  downPayment,
  loanAmount,
  monthlyPayment,
  totalOutOfPocket,
  yearOnePrincipalPaydown,
} from "./financing"
import {
  annualAppreciation,
  cashOnCashPct,
  coHostingFee,
  netOperatingIncome,
  scenarioOperatingExpenses,
  totalReturnPct,
  type Scenario,
} from "./scenarios"

export { SCENARIOS, type Scenario } from "./scenarios"
export type { DepreciationChain } from "./depreciation"

type Maybe = number | null

export interface UnderwritingInputs {
  purchasePrice: Maybe
  downPaymentPct: Maybe
  interestRatePct: Maybe
  mortgageYears: Maybe
  closingCostsPct: Maybe
  optimizationTotal: number
  monthlyOpex: number
  coHostingFeePct: number
  appreciationPct: number
  revenue: Record<Scenario, Maybe>
  taxes: {
    landPct: Maybe
    slaPct: Maybe
    bonusPct: Maybe
    taxRatePct: Maybe
  }
}

export interface ScenarioResult {
  revenue: Maybe
  operatingExpenses: number
  coHostingFee: Maybe
  netOperatingIncome: Maybe
  annualDebtService: Maybe
  freeCashFlow: Maybe
  cashOnCashPct: Maybe
  /** (FCF + tax savings) / Total OOP. */
  cashOnCashWithTaxSavingsPct: Maybe
  totalReturnPct: Maybe
}

export interface UnderwritingResults {
  downPayment: Maybe
  closingCosts: Maybe
  optimizationTotal: number
  totalOop: Maybe
  loanAmount: Maybe
  monthlyDebtService: Maybe
  annualDebtService: Maybe
  principalPaydown: Maybe
  appreciation: Maybe
  monthlyOpex: number
  depreciation: DepreciationChain | null
  /** Mid revenue / purchase price, whole percent. */
  prrPct: Maybe
  scenarios: Record<Scenario, ScenarioResult>
}

const has = (...values: Maybe[]): boolean => values.every((v) => v !== null)

export function calculateUnderwriting(
  input: UnderwritingInputs,
): UnderwritingResults {
  const { purchasePrice: price, downPaymentPct, closingCostsPct } = input
  const { interestRatePct, mortgageYears } = input

  const dp = has(price, downPaymentPct)
    ? downPayment(price!, downPaymentPct!)
    : null
  const cc = has(price, closingCostsPct)
    ? closingCosts(price!, closingCostsPct!)
    : null
  const loan = has(price, downPaymentPct)
    ? loanAmount(price!, downPaymentPct!)
    : null
  const oop = has(dp, cc)
    ? totalOutOfPocket(dp!, cc!, input.optimizationTotal)
    : null

  const financed = has(loan, interestRatePct, mortgageYears)
  const monthlyDebt = financed
    ? monthlyPayment(loan!, interestRatePct!, mortgageYears!)
    : null
  const annualDebt = monthlyDebt === null ? null : monthlyDebt * 12
  const principal = financed
    ? yearOnePrincipalPaydown(loan!, interestRatePct!, mortgageYears!)
    : null
  const appreciation =
    price === null ? null : annualAppreciation(price, input.appreciationPct)

  const { landPct, slaPct, bonusPct, taxRatePct } = input.taxes
  const depreciation =
    price !== null && has(landPct, slaPct, bonusPct, taxRatePct)
      ? depreciationChain(price, input.optimizationTotal, {
          landPct: landPct!,
          slaPct: slaPct!,
          bonusPct: bonusPct!,
          taxRatePct: taxRatePct!,
        })
      : null

  const scenario = (s: Scenario): ScenarioResult => {
    const revenue = input.revenue[s]
    const opex = scenarioOperatingExpenses(input.monthlyOpex, s)
    const fee =
      revenue === null ? null : coHostingFee(revenue, input.coHostingFeePct)
    const noi =
      revenue === null ? null : netOperatingIncome(revenue, opex, fee!)
    const fcf = has(noi, annualDebt) ? noi! - annualDebt! : null
    return {
      revenue,
      operatingExpenses: opex,
      coHostingFee: fee,
      netOperatingIncome: noi,
      annualDebtService: annualDebt,
      freeCashFlow: fcf,
      cashOnCashPct: has(fcf, oop) ? cashOnCashPct(fcf!, oop!) : null,
      cashOnCashWithTaxSavingsPct:
        has(fcf, oop) && depreciation
          ? cashOnCashPct(fcf! + depreciation.taxSavings, oop!)
          : null,
      totalReturnPct: has(fcf, principal, appreciation, oop)
        ? totalReturnPct(fcf!, principal!, appreciation!, oop!)
        : null,
    }
  }

  const mid = input.revenue.mid
  return {
    downPayment: dp,
    closingCosts: cc,
    optimizationTotal: input.optimizationTotal,
    totalOop: oop,
    loanAmount: loan,
    monthlyDebtService: monthlyDebt,
    annualDebtService: annualDebt,
    principalPaydown: principal,
    appreciation,
    monthlyOpex: input.monthlyOpex,
    depreciation,
    prrPct: has(mid, price) && price! > 0 ? (mid! / price!) * 100 : null,
    scenarios: {
      low: scenario("low"),
      mid: scenario("mid"),
      high: scenario("high"),
    },
  }
}

/** Sum of line amounts, skipping blanks. */
export function sumAmounts(amounts: Maybe[]): number {
  return amounts.reduce<number>((total, a) => total + (a ?? 0), 0)
}
