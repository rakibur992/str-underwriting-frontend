import { OperatingExpenses } from "./operating-expenses"
import { OptimizationList } from "./optimization-list"
import { PurchaseFinancing } from "./purchase-financing"
import { TaxAssumptions } from "./tax-assumptions"

/** "What the deal costs": purchase and financing, setup spend, running costs, taxes. */
export function FinancialsSection() {
  return (
    <div className="flex flex-col gap-6">
      <PurchaseFinancing />
      <OptimizationList />
      <OperatingExpenses />
      <TaxAssumptions />
    </div>
  )
}
