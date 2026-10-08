"use client"

import { formatCurrency, formatWholePercent } from "@/lib/format"

import { useWorkspace } from "./workspace-provider"

/** Below `lg` the results rail sits after the form, so keep the key numbers in view. */
export function ResultsMiniBar() {
  const { results } = useWorkspace()
  const mid = results.scenarios.mid
  const items = [
    ["Out of pocket", formatCurrency(results.totalOop)],
    ["Mid cash flow", formatCurrency(mid.freeCashFlow)],
    ["Mid cash-on-cash", formatWholePercent(mid.cashOnCashPct)],
  ] as const
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 backdrop-blur lg:hidden">
      <dl className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-4 py-2 text-center">
        {items.map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <dt className="text-[0.7rem] text-muted-foreground">{label}</dt>
            <dd className="text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
