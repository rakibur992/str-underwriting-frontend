import { CalculatedReturns } from "./calculated-returns"
import { RevenueForecast } from "./revenue-forecast"

/** "What the deal earns": revenue scenarios and the returns they produce. */
export function AnalysisSection() {
  return (
    <div className="flex flex-col gap-6">
      <RevenueForecast />
      <CalculatedReturns />
    </div>
  )
}
