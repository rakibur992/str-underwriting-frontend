/** Cost-segregation chain (docs/spec/calculations.md §4). Whole-number percents. */

export interface TaxAssumptions {
  landPct: number
  slaPct: number
  bonusPct: number
  taxRatePct: number
}

export interface DepreciationChain {
  improvementBasis: number
  shortLifeAssets: number
  yearOneLoss: number
  taxSavings: number
}

export function depreciationChain(
  purchasePrice: number,
  optimizationTotal: number,
  taxes: TaxAssumptions,
): DepreciationChain {
  const improvementBasis =
    purchasePrice * (1 - taxes.landPct / 100) + optimizationTotal
  const shortLifeAssets = improvementBasis * (taxes.slaPct / 100)
  const yearOneLoss = shortLifeAssets * (taxes.bonusPct / 100)
  const taxSavings = yearOneLoss * (taxes.taxRatePct / 100)
  return { improvementBasis, shortLifeAssets, yearOneLoss, taxSavings }
}
