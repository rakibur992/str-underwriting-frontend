"use client"

import { useParams } from "next/navigation"
import { useState, type ReactNode } from "react"

import type { UnderwritingRead } from "@/api/types"
import { toDealStatus } from "@/api/types"
import { ApiErrorState } from "@/components/ui/api-error-state"

import { useOwnUnderwritingIds } from "../hooks/use-own-underwriting-ids"
import { useUnderwriting } from "../hooks/use-underwriting"
import { AlreadySubmitted } from "./already-submitted"
import { UnavailableState } from "./unavailable-state"
import { WorkspaceProvider } from "./workspace-provider"
import { WorkspaceSkeleton } from "./workspace-skeleton"

function parseId(raw: string | undefined): number | null {
  return raw && /^\d+$/.test(raw) && Number(raw) > 0 ? Number(raw) : null
}

/**
 * Loads the underwriting for `/underwritings/[id]/*` and decides what can be
 * shown. Only the trainee's own drafts and attempts are fetched, so analyst
 * references (ids 1–6 after a reset) are never requested (docs/api-contract.md).
 */
export function UnderwritingGate({ children }: { children: ReactNode }) {
  const params = useParams<{ id: string }>()
  const id = parseId(params.id)
  const own = useOwnUnderwritingIds()
  // Latched: after a submit the draft leaves the dashboard's active ids for a moment.
  const [confirmedId, setConfirmedId] = useState<number | null>(null)
  if (id !== null && own.ids.has(id) && confirmedId !== id) setConfirmedId(id)
  const isOwn = id !== null && (confirmedId === id || own.ids.has(id))
  const query = useUnderwriting(isOwn ? id : null)

  if (id === null) return <UnavailableState reason="not-found" />
  if (!isOwn) {
    if (own.isLoading) return <WorkspaceSkeleton />
    if (own.error)
      return (
        <ApiErrorState
          title="Couldn't load this underwriting"
          error={own.error}
          onRetry={own.refetch}
        />
      )
    return <UnavailableState reason="not-found" />
  }
  if (query.isPending) return <WorkspaceSkeleton />
  if (!query.data) {
    const status = query.error?.status
    if (status === 404 || status === 422)
      return <UnavailableState reason="not-found" />
    return (
      <ApiErrorState
        title="Couldn't load this underwriting"
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    )
  }
  return (
    <OpenedUnderwriting initial={query.data}>{children}</OpenedUnderwriting>
  )
}

/** Decides once, on open, so submitting from review doesn't swap the screen mid-navigation. */
function OpenedUnderwriting({
  initial,
  children,
}: {
  initial: UnderwritingRead
  children: ReactNode
}) {
  const [opened] = useState(() => ({
    // Second line of defence; the id check above should already exclude references.
    isReference: initial.is_reference,
    submitted: toDealStatus(initial.deal_status) === "analyst_completed",
  }))

  if (opened.isReference) return <UnavailableState reason="reference" />
  if (opened.submitted) return <AlreadySubmitted underwriting={initial} />
  return <WorkspaceProvider initial={initial}>{children}</WorkspaceProvider>
}
