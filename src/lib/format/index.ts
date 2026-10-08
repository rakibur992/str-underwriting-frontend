import { fractionToPercent, parseDecimal, type DecimalInput } from "@/lib/units"

/** Shown wherever a value is missing or not computed yet. */
export const EMPTY_VALUE = "—"

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const currencyCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** "675000" → "$675,000". Pass `cents` for small amounts ("$12.50"). */
export function formatCurrency(
  value: DecimalInput,
  { cents = false }: { cents?: boolean } = {},
): string {
  const n = parseDecimal(value)
  if (n === null) return EMPTY_VALUE
  return (cents ? currencyCents : currency).format(n)
}

/** API fraction → "27.86%" (up to `digits` decimals, trailing zeros dropped). */
export function formatPercent(
  fraction: DecimalInput,
  { digits = 2 }: { digits?: number } = {},
): string {
  const pct = fractionToPercent(fraction)
  if (pct === null) return EMPTY_VALUE
  return `${formatNumber(pct, { digits })}%`
}

/** Accuracy score (0–100 points, e.g. "70.00") → "70"; averages keep 1 dp ("56.7"). */
export function formatScore(value: DecimalInput): string {
  const n = parseDecimal(value)
  if (n === null) return EMPTY_VALUE
  return formatNumber(n, { digits: 1 })
}

/** 2150 → "2,150". */
export function formatNumber(
  value: DecimalInput,
  { digits = 0 }: { digits?: number } = {},
): string {
  const n = parseDecimal(value)
  if (n === null) return EMPTY_VALUE
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(n)
}

/** Whole percent (27.86, not 0.2786) → "27.86%". Use for form values and live previews. */
export function formatWholePercent(
  value: number | null | undefined,
  { digits = 2 }: { digits?: number } = {},
): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return EMPTY_VALUE
  return `${formatNumber(value, { digits })}%`
}

/** "650000" → "650,000" for a money input after it loses focus; leaves junk untouched. */
export function formatMoneyInput(text: string): string {
  const n = parseDecimal(text.replace(/[\s$,]/g, ""))
  if (n === null) return text
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n)
}

/** A deduction in a calculation: 22200 → "−$22,200"; zero stays "$0". */
export function formatDeduction(value: number | null | undefined): string {
  if (value === null || value === undefined) return EMPTY_VALUE
  return formatCurrency(value === 0 ? 0 : -value)
}
