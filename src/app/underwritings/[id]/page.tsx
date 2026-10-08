import { Suspense } from "react"

import { WorkspaceScreen } from "@/features/workspace/components/workspace-screen"

// The layout waits for the underwriting (client query) before rendering this
// segment, so there's nothing to validate for instant navigation.
export const instant = false

export default function WorkspacePage() {
  // The section and focused field come from search params (runtime data).
  return (
    <Suspense fallback={null}>
      <WorkspaceScreen />
    </Suspense>
  )
}
