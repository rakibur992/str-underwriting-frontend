"use client"

import { formatCurrency } from "@/lib/format"

import { PartCard } from "../../components/part-card"
import { useWorkspace } from "../../components/workspace-provider"
import { LineItems } from "./line-items"

export function OptimizationList() {
  const { results } = useWorkspace()
  return (
    <PartCard
      part="optimizationItems"
      description="One-time setup costs before the first guest arrives. They add to Total Out of Pocket and to what can be depreciated."
      footer={
        <p className="flex justify-between text-sm">
          <span className="text-muted-foreground">Optimization total</span>
          <span className="font-medium">
            {formatCurrency(results.optimizationTotal)}
          </span>
        </p>
      }
    >
      <LineItems
        name="optimizationItems"
        copy={{
          noun: "Item",
          textLabel: "Category",
          amountLabel: "Amount",
          addLabel: "Add item",
          empty:
            "No setup costs yet. Add things like furniture, a hot tub or a game room.",
          suggestions: [
            "Furniture & design",
            "Hot tub",
            "Game room",
            "Outdoor living",
            "Smart locks & tech",
            "Renovation",
          ],
        }}
      />
    </PartCard>
  )
}
