"use client"

import { SCENARIOS } from "@/lib/calculations"
import {
  formatCurrency,
  formatDeduction,
  formatWholePercent,
} from "@/lib/format"

import { ResultsSourceBadge } from "../../components/results-source-badge"
import {
  ScenarioTable,
  type ScenarioRow,
} from "../../components/scenario-table"
import { useWorkspace } from "../../components/workspace-provider"

const ROWS: ScenarioRow[] = [
  { label: "Revenue", value: (s) => formatCurrency(s.revenue) },
  {
    label: "Operating expenses",
    value: (s) => formatDeduction(s.operatingExpenses),
  },
  {
    label: "Co-hosting fee",
    value: (s) => formatDeduction(s.coHostingFee),
  },
  {
    label: "Net operating income",
    value: (s) => formatCurrency(s.netOperatingIncome),
    emphasis: true,
  },
  {
    label: "Mortgage",
    value: (s) =>
      formatCurrency(
        s.annualDebtService === null ? null : -s.annualDebtService,
      ),
  },
  {
    label: "Annual free cash flow",
    value: (s) => formatCurrency(s.freeCashFlow),
    emphasis: true,
  },
  {
    label: "Cash-on-cash",
    value: (s) => formatWholePercent(s.cashOnCashPct),
    emphasis: true,
  },
  {
    label: "CoC with tax savings",
    value: (s) => formatWholePercent(s.cashOnCashWithTaxSavingsPct),
  },
  {
    label: "Total return",
    value: (s) => formatWholePercent(s.totalReturnPct),
  },
]

/** The full per-scenario returns, wider than the results rail allows. */
export function CalculatedReturns() {
  const { results, resultsSource } = useWorkspace()
  return (
    <section
      aria-labelledby="calculated-returns-heading"
      className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3
            id="calculated-returns-heading"
            className="text-base font-semibold"
          >
            Calculated returns
          </h3>
          <p className="text-sm text-muted-foreground">
            Per year, for each scenario. CoC with tax savings adds year-1 tax
            savings to the cash flow. Total return adds principal pay-down (
            {formatCurrency(results.principalPaydown)}) and appreciation (
            {formatCurrency(results.appreciation)}), the same in all three.
          </p>
        </div>
        <ResultsSourceBadge source={resultsSource} />
      </header>
      <dl className="grid grid-cols-3 gap-3 rounded-md bg-muted/50 p-3 text-sm">
        {(
          [
            ["Total out of pocket", formatCurrency(results.totalOop)],
            [
              "Tax savings (year 1)",
              formatCurrency(results.depreciation?.taxSavings),
            ],
            ["PRR (Mid ÷ price)", formatWholePercent(results.prrPct)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <ScenarioTable
        caption="Calculated returns by scenario"
        scenarios={SCENARIOS.map((s) => results.scenarios[s])}
        rows={ROWS}
      />
    </section>
  )
}
