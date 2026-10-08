"use client"

import { Pencil } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import { useWatch } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { useWorkspace } from "@/features/workspace/components/workspace-provider"
import { DEAL_TAGS } from "@/features/workspace/deal-tags/tags"
import {
  NUMBER_FIELDS,
  type NumberFieldPath,
  type SectionId,
} from "@/features/workspace/fields"
import { isBlankRow } from "@/features/workspace/schema"
import { EMPTY_VALUE, formatCurrency, formatWholePercent } from "@/lib/format"
import { isBlank, userNumber } from "@/lib/units"
import { cn } from "@/lib/utils"

import { sectionHref } from "../links"

/** A typed value for reading back: formatted when valid, as typed (flagged) when not. */
function Value({ path }: { path: NumberFieldPath }) {
  const { form, errors } = useWorkspace()
  const text = useWatch({ control: form.control, name: path })
  const invalid = errors.some((e) => e.path === path && e.kind === "invalid")
  const kind = NUMBER_FIELDS[path].kind
  if (isBlank(text))
    return (
      <span className="text-muted-foreground">
        {NUMBER_FIELDS[path].required ? "Missing" : "0% (blank)"}
      </span>
    )
  if (invalid) return <span className="text-destructive">{text} (invalid)</span>
  const n = userNumber(text)
  return (
    <>
      {kind === "money"
        ? formatCurrency(n)
        : kind === "percent"
          ? formatWholePercent(n)
          : `${n} years`}
    </>
  )
}

function Fields({ paths }: { paths: NumberFieldPath[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      {paths.map((path) => (
        <div key={path} className="flex flex-col gap-0.5">
          <dt className="text-xs text-muted-foreground">
            {NUMBER_FIELDS[path].label}
          </dt>
          <dd className="font-medium">
            <Value path={path} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

function Block({
  title,
  section,
  children,
  divided = true,
}: {
  title: string
  section: SectionId
  children: ReactNode
  /** Top rule between blocks; off for blocks laid out side by side. */
  divided?: boolean
}) {
  const { id } = useWorkspace()
  return (
    <section
      className={cn(
        "flex flex-col gap-3",
        divided && "border-t pt-4 first:border-t-0 first:pt-0",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Link
          href={sectionHref(id, section)}
          className="flex items-center gap-1 rounded-sm text-xs text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Pencil aria-hidden className="size-3" />
          Edit<span className="sr-only"> {title}</span>
        </Link>
      </div>
      {children}
    </section>
  )
}

function Lines({
  rows,
  empty,
  total,
}: {
  rows: [string, string][]
  empty: string
  total: [string, string]
}) {
  if (rows.length === 0)
    return <p className="text-sm text-score-medium">{empty}</p>
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([name, amount], i) => (
          <tr key={i} className="border-b border-dashed last:border-0">
            <td className="py-1 text-muted-foreground">
              {name || EMPTY_VALUE}
            </td>
            <td className="py-1 text-right font-medium">{amount}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t">
          <th scope="row" className="pt-1.5 text-left font-medium">
            {total[0]}
          </th>
          <td className="pt-1.5 text-right font-semibold">{total[1]}</td>
        </tr>
      </tfoot>
    </table>
  )
}

const money = (text: string) => {
  const n = userNumber(text)
  return n === null ? `${text || EMPTY_VALUE}` : formatCurrency(n)
}

/** Read-only summary of all three sections: what will be submitted. */
export function ReviewSummary() {
  const { values, results } = useWorkspace()
  const items = values.optimizationItems.filter((r) => !isBlankRow(r))
  const expenses = values.operatingExpenses.filter((r) => !isBlankRow(r))
  const tagsOn = DEAL_TAGS.filter((t) => values.tags[t.key])

  return (
    <section
      aria-labelledby="summary-heading"
      className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:p-5"
    >
      <h2 id="summary-heading" className="text-base font-semibold">
        Your inputs
      </h2>

      <Block title="Purchase & financing" section="financials">
        <Fields
          paths={[
            "purchase.purchasePrice",
            "purchase.downPaymentPct",
            "purchase.interestRatePct",
            "purchase.mortgageYears",
            "purchase.closingCostsPct",
          ]}
        />
      </Block>

      <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
        <Block title="Optimization list" section="financials" divided={false}>
          <Lines
            rows={items.map((r) => [r.category, money(r.amount)])}
            empty="No setup costs entered. Total Out of Pocket includes none."
            total={["Total", formatCurrency(results.optimizationTotal)]}
          />
        </Block>
        <Block
          title="Operating expenses (monthly)"
          section="financials"
          divided={false}
        >
          <Lines
            rows={expenses.map((r) => [r.name, money(r.monthlyAmount)])}
            empty="No operating expenses entered. NOI will equal revenue."
            total={["Total monthly", formatCurrency(results.monthlyOpex)]}
          />
        </Block>
      </div>

      <Block title="Taxes" section="financials">
        <Fields
          paths={[
            "taxes.landPct",
            "taxes.slaPct",
            "taxes.bonusPct",
            "taxes.taxRatePct",
          ]}
        />
      </Block>

      <Block title="Revenue forecast (per year)" section="analysis">
        <Fields
          paths={[
            "revenue.low",
            "revenue.mid",
            "revenue.high",
            "revenue.coHostingFeePct",
            "revenue.appreciationPct",
          ]}
        />
      </Block>

      <Block title="Deal tags" section="deal-tags">
        {tagsOn.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tags on (optional).
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5" aria-label="Deal tags on">
            {tagsOn.map((t) => (
              <li key={t.key}>
                <Badge variant="secondary">{t.label}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Block>
    </section>
  )
}
