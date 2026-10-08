import { DEAL_TAGS, type DealTagValues } from "../deal-tags/tags"
import { TAX_DEFAULTS } from "../fields"
import type { WorkspaceValues } from "../schema"

const noTags = Object.fromEntries(
  DEAL_TAGS.map((t) => [t.key, false]),
) as DealTagValues

/** A complete, valid underwriting as typed into the form (test data). */
export function completeValues(): WorkspaceValues {
  return {
    purchase: {
      purchasePrice: "650,000",
      downPaymentPct: "20",
      interestRatePct: "6.99",
      mortgageYears: "30",
      closingCostsPct: "3",
    },
    optimizationItems: [{ category: "Furniture", amount: "40,000" }],
    operatingExpenses: [{ name: "Utilities", monthlyAmount: "650" }],
    taxes: { ...TAX_DEFAULTS },
    revenue: {
      low: "100000",
      mid: "120000",
      high: "140000",
      coHostingFeePct: "",
      appreciationPct: "3",
    },
    tags: noTags,
  }
}
