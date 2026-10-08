import { Suspense } from "react"

import { UnderwritingGate } from "@/features/workspace/components/underwriting-gate"
import { WorkspaceSkeleton } from "@/features/workspace/components/workspace-skeleton"

/**
 * The workspace and its review page share one form (and its autosave), so
 * both live under this layout and keep their state when moving between them.
 */
export default function UnderwritingLayout({
  children,
}: LayoutProps<"/underwritings/[id]">) {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <UnderwritingGate>{children}</UnderwritingGate>
    </Suspense>
  )
}
