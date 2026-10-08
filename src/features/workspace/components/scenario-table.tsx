import type { ScenarioResult } from "@/lib/calculations"
import { cn } from "@/lib/utils"

const HEADERS = ["Low", "Mid", "High"] as const

export interface ScenarioRow {
  label: string
  value: (s: ScenarioResult) => string
  emphasis?: boolean
}

/** Rows of a calculation across Low / Mid / High. Mid (the graded one) is tinted. */
export function ScenarioTable({
  caption,
  scenarios,
  rows,
  compact = false,
}: {
  caption: string
  scenarios: ScenarioResult[]
  rows: ScenarioRow[]
  compact?: boolean
}) {
  const cell = compact ? "px-1.5 py-1" : "px-2 py-1.5"
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className={cn("w-full", compact ? "text-xs" : "text-sm")}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className={cn(cell, "text-left font-medium")}>
              <span className="sr-only">Line</span>
            </th>
            {HEADERS.map((h) => (
              <th
                key={h}
                scope="col"
                className={cn(
                  cell,
                  "text-right font-medium",
                  h === "Mid" && "rounded-t-md bg-primary/6 text-foreground",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className={cn(row.emphasis && "border-t font-semibold")}
            >
              <th
                scope="row"
                className={cn(
                  cell,
                  "text-left",
                  row.emphasis
                    ? "font-semibold"
                    : "font-normal text-muted-foreground",
                )}
              >
                {row.label}
              </th>
              {scenarios.map((s, i) => (
                <td
                  key={HEADERS[i]}
                  className={cn(
                    cell,
                    "text-right whitespace-nowrap tabular-nums",
                    i === 1 && "bg-primary/6",
                  )}
                >
                  {row.value(s)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
