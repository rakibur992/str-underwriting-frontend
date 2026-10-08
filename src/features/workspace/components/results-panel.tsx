"use client"

import type { ReactNode } from "react"

import { SCENARIOS, type ScenarioResult } from "@/lib/calculations"
import {
  formatCurrency,
  formatDeduction,
  formatWholePercent,
} from "@/lib/format"
import { userNumber } from "@/lib/units"

import { ResultsSourceBadge } from "./results-source-badge"
import { ScenarioTable, type ScenarioRow } from "./scenario-table"
import { ShowWorking } from "./show-working"
import { useWorkspace } from "./workspace-provider"

const EARNINGS: ScenarioRow[] = [
  { label: "Revenue", value: (s) => formatCurrency(s.revenue) },
  {
    label: "Operating exp.",
    value: (s) => formatDeduction(s.operatingExpenses),
  },
  { label: "Co-hosting fee", value: (s) => formatDeduction(s.coHostingFee) },
  {
    label: "NOI",
    value: (s) => formatCurrency(s.netOperatingIncome),
    emphasis: true,
  },
  { label: "Mortgage", value: (s) => formatDeduction(s.annualDebtService) },
  {
    label: "Free cash flow",
    value: (s) => formatCurrency(s.freeCashFlow),
    emphasis: true,
  },
]

const RETURN: ScenarioRow[] = [
  {
    label: "Cash-on-cash",
    value: (s: ScenarioResult) => formatWholePercent(s.cashOnCashPct),
    emphasis: true,
  },
]

/**
 * The results, laid out along the brief's chain: what it costs up front →
 * what it earns each year → how good the return is. Shows the API's saved
 * numbers once everything is saved; a live preview while typing.
 */
export function ResultsPanel() {
  const { results: r, resultsSource, values } = useWorkspace()
  const scenarios = SCENARIOS.map((s) => r.scenarios[s])
  const mid = r.scenarios.mid
  const price = userNumber(values.purchase.purchasePrice)
  const tax = r.depreciation

  return (
    <aside
      aria-labelledby="results-heading"
      className="flex flex-col gap-5 rounded-lg border bg-card p-4"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="results-heading" className="text-base font-semibold">
          Results
        </h2>
        <ResultsSourceBadge source={resultsSource} />
      </header>

      <Step n={1} title="Cost up front">
        <Headline
          label="Total out of pocket"
          value={formatCurrency(r.totalOop)}
        />
        {r.totalOop === null ? (
          <Needs>purchase price, down payment % and closing costs %</Needs>
        ) : (
          <dl className="flex flex-col gap-1 text-xs">
            <Line label="Down payment" value={formatCurrency(r.downPayment)} />
            <Line
              label="+ Closing costs"
              value={formatCurrency(r.closingCosts)}
            />
            <Line
              label="+ Setup (optimization)"
              value={formatCurrency(r.optimizationTotal)}
            />
          </dl>
        )}
      </Step>

      <Step n={2} title="Yearly earnings">
        <ScenarioTable
          compact
          caption="Yearly earnings by scenario"
          scenarios={scenarios}
          rows={EARNINGS}
        />
        {mid.revenue === null && <Needs>Low, Mid and High revenue</Needs>}
        {mid.revenue !== null && r.annualDebtService === null && (
          <Needs>interest rate and loan term for the mortgage</Needs>
        )}
        {r.monthlyDebtService !== null && (
          <ShowWorking label="How is the mortgage calculated?">
            A {formatCurrency(r.loanAmount)} loan at{" "}
            {values.purchase.interestRatePct || "—"}% over{" "}
            {values.purchase.mortgageYears || "—"} years is{" "}
            {formatCurrency(r.monthlyDebtService)} a month, so{" "}
            {formatCurrency(r.annualDebtService)} a year. It&apos;s the same in
            every scenario.
          </ShowWorking>
        )}
      </Step>

      <Step n={3} title="Return">
        <ScenarioTable
          compact
          caption="Cash-on-cash return by scenario"
          scenarios={scenarios}
          rows={RETURN}
        />
        {mid.cashOnCashPct !== null && (
          <ShowWorking>
            Mid: free cash flow {formatCurrency(mid.freeCashFlow)} ÷ total out
            of pocket {formatCurrency(r.totalOop)} ={" "}
            {formatWholePercent(mid.cashOnCashPct)}.
          </ShowWorking>
        )}
        <dl className="flex flex-col gap-3 border-t pt-3">
          <div className="flex flex-col gap-1">
            <Line
              strong
              label="Tax savings (year 1)"
              value={formatCurrency(tax?.taxSavings)}
            />
            {tax ? (
              <ShowWorking>
                Improvement basis {formatCurrency(tax.improvementBasis)} (price
                minus land, plus setup) × {values.taxes.slaPct}% short-life ={" "}
                {formatCurrency(tax.shortLifeAssets)} × {values.taxes.bonusPct}%
                bonus = {formatCurrency(tax.yearOneLoss)} loss ×{" "}
                {values.taxes.taxRatePct}% tax rate ={" "}
                {formatCurrency(tax.taxSavings)}.
              </ShowWorking>
            ) : (
              <Needs>purchase price and the four tax assumptions</Needs>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Line strong label="PRR" value={formatWholePercent(r.prrPct)} />
            {r.prrPct !== null ? (
              <ShowWorking>
                Mid revenue {formatCurrency(mid.revenue)} ÷ purchase price{" "}
                {formatCurrency(price)}: how hard the property works for its
                price.
              </ShowWorking>
            ) : (
              <Needs>Mid revenue and purchase price</Needs>
            )}
          </div>
        </dl>
      </Step>
    </aside>
  )
}

function Step({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <span
          aria-hidden
          className="flex size-5 items-center justify-center rounded-full bg-muted text-[0.7rem] text-foreground"
        >
          {n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  )
}

function Headline({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xl font-semibold tracking-tight">{value}</span>
    </div>
  )
}

function Line({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className={strong ? "text-sm font-medium" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd className={strong ? "text-base font-semibold" : "font-medium"}>
        {value}
      </dd>
    </div>
  )
}

function Needs({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">Needs {children}.</p>
}
