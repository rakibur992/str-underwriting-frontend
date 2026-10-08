import { Suspense } from "react"

import { ResultsScreen } from "@/features/results/components/results-screen"
import { ResultsSkeleton } from "@/features/results/components/results-skeleton"

export default function ResultsPage() {
  // Route params are runtime data; with cacheComponents they must suspend.
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <ResultsScreen />
    </Suspense>
  )
}
