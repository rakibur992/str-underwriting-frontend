/**
 * The only place that converts API units (ADR-0007).
 * The API sends money and percentages as decimal strings, and percentages
 * as fractions ("0.0699" = 6.99%). The UI works in whole-number percents.
 */

export type DecimalInput = string | number | null | undefined

const DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)$/

/** Decimal string (or number) → number. Returns null for null, "" or junk. */
export function parseDecimal(value: DecimalInput): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  const trimmed = value.trim()
  if (!DECIMAL.test(trimmed)) return null
  return Number(trimmed)
}

/**
 * API fraction → whole percent, by moving the decimal point two places in
 * the string so there is no float drift ("0.0699" → 6.99, "0.2" → 20).
 */
export function fractionToPercent(value: DecimalInput): number | null {
  if (parseDecimal(value) === null) return null
  const str = typeof value === "number" ? String(value) : value!.trim()
  const sign = str.startsWith("-") ? "-" : ""
  const unsigned = str.replace(/^[+-]/, "")
  const [whole = "", frac = ""] = unsigned.split(".")
  const padded = frac.padEnd(2, "0")
  return Number(
    `${sign}${whole || "0"}${padded.slice(0, 2)}.${padded.slice(2) || "0"}`,
  )
}

/** Whole percent → API fraction string, by moving the decimal point ("6.99" → "0.0699", 20 → "0.2"). */
export function percentToFraction(value: DecimalInput): string | null {
  if (parseDecimal(value) === null) return null
  const str = typeof value === "number" ? String(value) : value!.trim()
  const sign = str.startsWith("-") ? "-" : ""
  const unsigned = str.replace(/^[+-]/, "")
  const [whole = "", frac = ""] = unsigned.split(".")
  const digits = (whole || "0").padStart(2, "0")
  const intPart = digits.slice(0, -2).replace(/^0+(?=\d)/, "") || "0"
  const fracPart = `${digits.slice(-2)}${frac}`.replace(/0+$/, "")
  const result = fracPart ? `${intPart}.${fracPart}` : intPart
  return result === "0" ? "0" : `${sign}${result}`
}

/**
 * What the trainee typed → canonical decimal string, or null if it isn't a
 * number. Accepts "$650,000", "6.99%", " 1,250.5 ". Blank input is null too;
 * check `isBlank` first when blank and invalid need different messages.
 */
export function parseUserNumber(text: string): string | null {
  const cleaned = text.replace(/[\s$,%]/g, "")
  if (!DECIMAL.test(cleaned)) return null
  const [whole = "", frac] = cleaned.replace(/^\+/, "").split(".")
  const normalisedWhole = whole.replace(/^(-?)0+(?=\d)/, "$1") || "0"
  return frac ? `${normalisedWhole}.${frac}` : normalisedWhole
}

export function isBlank(text: string | null | undefined): boolean {
  return text === null || text === undefined || text.trim() === ""
}

/** User text → number for live previews; null when blank or not a number. */
export function userNumber(text: string): number | null {
  return parseDecimal(parseUserNumber(text))
}

/** API money string → plain input text without trailing zero cents ("660000.00" → "660000"). */
export function decimalToInput(value: DecimalInput): string {
  const n = parseDecimal(value)
  if (n === null) return ""
  const str = typeof value === "number" ? String(value) : value!.trim()
  return str.includes(".") ? str.replace(/\.?0+$/, "") : str
}

/** API fraction → whole-percent input text ("0.0699" → "6.99", null → ""). */
export function fractionToInput(value: DecimalInput): string {
  const pct = fractionToPercent(value)
  return pct === null ? "" : String(pct)
}
