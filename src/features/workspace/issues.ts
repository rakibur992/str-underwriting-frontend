/**
 * What's missing or wrong, per field. Drives section progress, which parts can
 * be saved, and the review checklist (each issue links back to its field).
 */
import { isBlank } from "@/lib/units"

import {
  NUMBER_FIELDS,
  PART_META,
  PARTS,
  SECTIONS,
  type NumberFieldPath,
  type PartId,
  type SectionId,
} from "./fields"
import {
  isBlankRow,
  revenueOrderWarning,
  workspaceSchema,
  type WorkspaceValues,
} from "./schema"

export type IssueKind = "missing" | "invalid" | "warning"

export interface Issue {
  /** Form path, e.g. "purchase.downPaymentPct" or "operatingExpenses.2.monthlyAmount". */
  path: string
  part: PartId
  section: SectionId
  /** Where the field is, in words ("Purchase & financing · Down payment"). */
  label: string
  message: string
  kind: IssueKind
}

const ROW_LABEL: Record<
  string,
  { noun: string; fields: Record<string, string> }
> = {
  optimizationItems: {
    noun: "Item",
    fields: { category: "category", amount: "amount" },
  },
  operatingExpenses: {
    noun: "Expense",
    fields: { name: "name", monthlyAmount: "monthly amount" },
  },
}

function getAt(values: WorkspaceValues, path: (string | number)[]): unknown {
  return path.reduce<unknown>(
    (node, key) => (node as Record<string | number, unknown>)?.[key],
    values,
  )
}

function describe(path: (string | number)[]): string {
  const part = path[0] as PartId
  const partLabel = PART_META[part].label
  const rows = ROW_LABEL[part]
  if (rows && typeof path[1] === "number") {
    const field = rows.fields[String(path[2])] ?? ""
    return `${partLabel} · ${rows.noun} ${path[1] + 1} ${field}`.trim()
  }
  const spec = NUMBER_FIELDS[path.join(".") as NumberFieldPath]
  return spec ? `${partLabel} · ${spec.label}` : partLabel
}

/** Missing and invalid inputs, in form order. */
export function collectErrors(values: WorkspaceValues): Issue[] {
  const result = workspaceSchema.safeParse(values)
  if (result.success) return []
  return result.error.issues.map((issue) => {
    const path = issue.path.map((k) => (typeof k === "symbol" ? String(k) : k))
    const part = path[0] as PartId
    const value = getAt(values, path)
    return {
      path: path.join("."),
      part,
      section: PART_META[part].section,
      label: describe(path),
      message: issue.message,
      kind: typeof value === "string" && isBlank(value) ? "missing" : "invalid",
    }
  })
}

/** Non-blocking checks a reviewer would still ask about. */
export function collectWarnings(values: WorkspaceValues): Issue[] {
  const warnings: Issue[] = []
  const order = revenueOrderWarning(values.revenue)
  if (order)
    warnings.push({
      path: "revenue.low",
      part: "revenue",
      section: "analysis",
      label: "Revenue forecast · Low / Mid / High",
      message: order,
      kind: "warning",
    })
  if (values.optimizationItems.every(isBlankRow))
    warnings.push({
      path: "optimizationItems",
      part: "optimizationItems",
      section: "financials",
      label: PART_META.optimizationItems.label,
      message:
        "No setup costs yet, so Total Out of Pocket is just the down payment and closing costs.",
      kind: "warning",
    })
  if (values.operatingExpenses.every(isBlankRow))
    warnings.push({
      path: "operatingExpenses",
      part: "operatingExpenses",
      section: "financials",
      label: PART_META.operatingExpenses.label,
      message:
        "No operating expenses yet, so NOI equals revenue. Add utilities, insurance, cleaning and so on.",
      kind: "warning",
    })
  return warnings
}

export type PartState = "complete" | "incomplete" | "invalid"

export function partStates(errors: Issue[]): Record<PartId, PartState> {
  const states = Object.fromEntries(
    PARTS.map((p) => [p, "complete"]),
  ) as Record<PartId, PartState>
  for (const issue of errors) {
    if (issue.kind === "invalid") states[issue.part] = "invalid"
    else if (states[issue.part] !== "invalid") states[issue.part] = "incomplete"
  }
  return states
}

export interface SectionProgress {
  section: SectionId
  /** Required fields that are filled in and valid. */
  done: number
  total: number
  /** Inputs that need fixing (wrong format or out of range). */
  invalid: number
  complete: boolean
}

const REQUIRED_FIELDS = (
  Object.keys(NUMBER_FIELDS) as NumberFieldPath[]
).filter((path) => NUMBER_FIELDS[path].required)

export function sectionProgress(errors: Issue[]): SectionProgress[] {
  const failing = new Set(errors.map((e) => e.path))
  return SECTIONS.map((section) => {
    const required = REQUIRED_FIELDS.filter(
      (path) => PART_META[NUMBER_FIELDS[path].part].section === section,
    )
    const done = required.filter((path) => !failing.has(path)).length
    const invalid = errors.filter(
      (e) => e.section === section && e.kind === "invalid",
    ).length
    return {
      section,
      done,
      total: required.length,
      invalid,
      complete: done === required.length && invalid === 0,
    }
  })
}

/** Submit needs purchase details, revenue and taxes complete, and nothing invalid. */
export function canSubmit(errors: Issue[]) {
  return errors.length === 0
}
