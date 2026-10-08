/**
 * Purchase & financing and debt service (docs/spec/calculations.md §1, §3).
 * Percentages are whole numbers (20 = 20%).
 */

export function downPayment(purchasePrice: number, downPaymentPct: number) {
  return purchasePrice * (downPaymentPct / 100)
}

export function loanAmount(purchasePrice: number, downPaymentPct: number) {
  return purchasePrice * (1 - downPaymentPct / 100)
}

export function closingCosts(purchasePrice: number, closingCostsPct: number) {
  return purchasePrice * (closingCostsPct / 100)
}

/** Down payment + closing costs + optimization (setup) spend. */
export function totalOutOfPocket(
  downPaymentAmount: number,
  closingCostsAmount: number,
  optimizationTotal: number,
) {
  return downPaymentAmount + closingCostsAmount + optimizationTotal
}

/** Standard amortizing payment. */
export function monthlyPayment(
  loan: number,
  annualRatePct: number,
  years: number,
) {
  const n = years * 12
  if (n <= 0) return 0
  const r = annualRatePct / 100 / 12
  if (r === 0) return loan / n
  const growth = (1 + r) ** n
  return (loan * r * growth) / (growth - 1)
}

/** Principal repaid in the first 12 payments. */
export function yearOnePrincipalPaydown(
  loan: number,
  annualRatePct: number,
  years: number,
) {
  const n = years * 12
  if (n <= 0) return 0
  const r = annualRatePct / 100 / 12
  if (r === 0) return (loan / n) * Math.min(12, n)
  const payment = monthlyPayment(loan, annualRatePct, years)
  const k = Math.min(12, n)
  const growth = (1 + r) ** k
  const balance = loan * growth - (payment * (growth - 1)) / r
  return loan - balance
}
