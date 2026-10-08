"use client"

import { formatCurrency } from "@/lib/format"

import { PartCard } from "../../components/part-card"
import { useWorkspace } from "../../components/workspace-provider"
import { LineItems } from "./line-items"

export function OperatingExpenses() {
  const { results } = useWorkspace()
  return (
    <PartCard
      part="operatingExpenses"
      description="Recurring monthly running costs, taken out of revenue every year. Low and High nudge them by −4% and +4%."
      footer={
        <dl className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Total monthly</dt>
            <dd className="font-medium">
              {formatCurrency(results.monthlyOpex)}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Per year (Mid)</dt>
            <dd className="font-medium">
              {formatCurrency(results.monthlyOpex * 12)}
            </dd>
          </div>
        </dl>
      }
    >
      <LineItems
        name="operatingExpenses"
        copy={{
          noun: "Expense",
          textLabel: "Name",
          amountLabel: "Monthly amount",
          addLabel: "Add expense",
          empty:
            "No operating expenses yet. Add utilities, internet, insurance, property tax, supplies or software. Enter cleaning as a monthly line too.",
          suggestions: [
            "Utilities",
            "Internet",
            "Insurance",
            "Property tax",
            "Supplies",
            "Software",
            "Cleaning",
            "Maintenance",
          ],
        }}
      />
    </PartCard>
  )
}
