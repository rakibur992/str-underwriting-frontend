"use client"

import { RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"

import { NumberField } from "../../components/number-field"
import { PartCard } from "../../components/part-card"
import { useWorkspace } from "../../components/workspace-provider"
import { NUMBER_FIELDS, TAX_DEFAULTS } from "../../fields"

const FIELDS = [
  ["taxes.landPct", "landPct"],
  ["taxes.slaPct", "slaPct"],
  ["taxes.bonusPct", "bonusPct"],
  ["taxes.taxRatePct", "taxRatePct"],
] as const

export function TaxAssumptions() {
  const { form, values, results } = useWorkspace()
  const usingDefaults = FIELDS.every(
    ([, key]) => values.taxes[key] === TAX_DEFAULTS[key],
  )

  const resetDefaults = () => {
    for (const [path, key] of FIELDS)
      form.setValue(path, TAX_DEFAULTS[key], {
        shouldDirty: true,
        shouldValidate: true,
      })
  }

  return (
    <PartCard
      part="taxes"
      description="Estimates the first-year tax savings from depreciation. Most training deals use 20%, 25%, 60% and 37%, so those are filled in for you."
      footer={
        <p className="flex justify-between text-sm">
          <span className="text-muted-foreground">Year-1 tax savings</span>
          <span className="font-medium">
            {formatCurrency(results.depreciation?.taxSavings)}
          </span>
        </p>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(([path]) => {
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
      {!usingDefaults && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetDefaults}
          >
            <RotateCcw aria-hidden data-icon="inline-start" />
            Use training defaults (20 / 25 / 60 / 37%)
          </Button>
        </div>
      )}
    </PartCard>
  )
}
