"use client"

import { formatCurrency } from "@/lib/format"

import { NumberField } from "../../components/number-field"
import { PartCard } from "../../components/part-card"
import { useWorkspace } from "../../components/workspace-provider"
import { NUMBER_FIELDS } from "../../fields"

const FIELDS = [
  "purchase.purchasePrice",
  "purchase.downPaymentPct",
  "purchase.interestRatePct",
  "purchase.mortgageYears",
  "purchase.closingCostsPct",
] as const

export function PurchaseFinancing() {
  const { results } = useWorkspace()
  const cashToClose =
    results.downPayment !== null && results.closingCosts !== null
      ? results.downPayment + results.closingCosts
      : null

  return (
    <PartCard
      part="purchase"
      description="What it takes to buy the property: the loan, the monthly mortgage and the cash needed at closing."
      footer={
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <Derived
            label="Loan amount"
            value={formatCurrency(results.loanAmount)}
          />
          <Derived
            label="Monthly mortgage"
            value={formatCurrency(results.monthlyDebtService)}
          />
          <Derived label="Cash to close" value={formatCurrency(cashToClose)} />
        </dl>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((path) => {
          const spec = NUMBER_FIELDS[path]
          return (
            <NumberField
              key={path}
              name={path}
              label={spec.label}
              kind={spec.kind}
              hint={"hint" in spec ? spec.hint : undefined}
            />
          )
        })}
      </div>
    </PartCard>
  )
}

function Derived({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
