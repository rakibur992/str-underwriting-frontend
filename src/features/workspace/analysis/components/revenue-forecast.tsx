"use client"

import { TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { NumberField } from "../../components/number-field"
import { PartCard } from "../../components/part-card"
import { useWorkspace } from "../../components/workspace-provider"
import { NUMBER_FIELDS } from "../../fields"
import { revenueOrderWarning } from "../../schema"

const SCENARIO_FIELDS = [
  { path: "revenue.low", hint: "A cautious year" },
  { path: "revenue.mid", hint: "The expected year" },
  { path: "revenue.high", hint: "A strong year" },
] as const

export function RevenueForecast() {
  const { values } = useWorkspace()
  const orderWarning = revenueOrderWarning(values.revenue)

  return (
    <PartCard
      part="revenue"
      description="Your yearly revenue forecast for three kinds of year. Only Mid is graded: you're scored on how close it is to the analyst's."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {SCENARIO_FIELDS.map(({ path, hint }) => (
          <NumberField
            key={path}
            name={path}
            kind="money"
            label={
              <>
                {NUMBER_FIELDS[path].label} revenue
                {path === "revenue.mid" && (
                  <Badge variant="secondary" className="font-medium">
                    Graded
                  </Badge>
                )}
              </>
            }
            hint={`${hint}, per year`}
          />
        ))}
      </div>
      {orderWarning && (
        <p className="-mt-1 flex items-start gap-1.5 text-sm text-score-medium">
          <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {orderWarning} You can still submit.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {(["revenue.coHostingFeePct", "revenue.appreciationPct"] as const).map(
          (path) => (
            <NumberField
              key={path}
              name={path}
              kind="percent"
              optional
              label={NUMBER_FIELDS[path].label}
              hint={NUMBER_FIELDS[path].hint}
            />
          ),
        )}
      </div>
    </PartCard>
  )
}
