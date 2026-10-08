/**
 * Zod schemas for the objects the OpenAPI schema types as plain `object`
 * (`UnderwritingRead.detail.*`). Shapes come from live data (docs/api-contract.md).
 * A missing key means "not computed yet", so every field is optional.
 */
import { z } from "zod"

import type { UnderwritingRead } from "./types"

const decimal = z.union([z.string(), z.number()]).nullish()

const purchaseDetails = z.object({
  purchase_price: decimal,
  down_payment_pct: decimal,
  interest_rate: decimal,
  mortgage_years: z.number().int().nullish(),
  closing_costs_pct: decimal,
  loan_amount: decimal,
  down_payment_amount: decimal,
  closing_costs_amount: decimal,
})

const scenario = z.object({
  forecasted_revenue: decimal,
  operating_expenses_annual: decimal,
  co_hosting_fee: decimal,
  net_operating_income: decimal,
  debt_service_annual: decimal,
  annual_free_cash_flow: decimal,
  principal_pay_down: decimal,
  annual_re_appreciation: decimal,
  cash_on_cash_pct: decimal,
  annual_total_re_return_pct: decimal,
})

const forecastedRevenue = z.object({
  co_hosting_fee_pct: decimal,
  annual_re_appreciation_pct: decimal,
  scenarios: z
    .object({
      low: scenario.nullish(),
      mid: scenario.nullish(),
      high: scenario.nullish(),
    })
    .nullish(),
})

const cocWithTaxSavings = z.object({
  low_pct: decimal,
  mid_pct: decimal,
  high_pct: decimal,
})

const zillowProperty = z.object({
  zpid: z.string().nullish(),
  address: z.string().nullish(),
  price: z.string().nullish(),
  beds: z.number().nullish(),
  baths: z.number().nullish(),
  area: z.number().nullish(),
  home_type: z.string().nullish(),
  img_src: z.string().nullish(),
  detail_url: z.string().nullish(),
})

export type PurchaseDetailsDetail = z.infer<typeof purchaseDetails>
export type ScenarioDetail = z.infer<typeof scenario>
export type ForecastedRevenueDetail = z.infer<typeof forecastedRevenue>
export type CocWithTaxSavingsDetail = z.infer<typeof cocWithTaxSavings>
export type ZillowPropertyDetail = z.infer<typeof zillowProperty>

export interface UnderwritingDetail {
  purchaseDetails: PurchaseDetailsDetail | null
  forecastedRevenue: ForecastedRevenueDetail | null
  cocWithTaxSavings: CocWithTaxSavingsDetail | null
  zillowProperty: ZillowPropertyDetail | null
}

function parseOrNull<T>(schema: z.ZodType<T>, value: unknown): T | null {
  if (value === null || value === undefined) return null
  const result = schema.safeParse(value)
  return result.success ? result.data : null
}

/** Parse every untyped `detail` object; anything malformed counts as not computed. */
export function parseUnderwritingDetail(
  uw: Pick<UnderwritingRead, "detail">,
): UnderwritingDetail {
  const d = uw.detail
  return {
    purchaseDetails: parseOrNull(purchaseDetails, d?.purchase_details),
    forecastedRevenue: parseOrNull(forecastedRevenue, d?.forecasted_revenue),
    cocWithTaxSavings: parseOrNull(
      cocWithTaxSavings,
      d?.y1_coc_incl_tax_savings,
    ),
    zillowProperty: parseOrNull(zillowProperty, d?.zillow_property),
  }
}
