"use client"

import { useQuery } from "@tanstack/react-query"

import { getDashboard } from "@/api/dashboard"
import { queryKeys } from "@/api/query-keys"
import { listSubmissions } from "@/api/submissions"

/**
 * Underwriting ids that belong to the trainee: open drafts from the dashboard
 * and every submitted attempt. Analyst references never appear in either, so
 * checking this before `GET /api/underwritings/{id}` means the app never
 * fetches one. Always refetched on open, so a just-started draft is known.
 */
export function useOwnUnderwritingIds() {
  const dashboard = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboard,
    staleTime: 0,
  })
  const submissions = useQuery({
    queryKey: queryKeys.submissions,
    queryFn: () => listSubmissions(),
    staleTime: 0,
  })

  const ids = new Set<number>()
  for (const p of dashboard.data?.properties ?? [])
    if (p.active_underwriting_id != null) ids.add(p.active_underwriting_id)
  for (const s of submissions.data ?? []) ids.add(s.underwriting_id)

  return {
    ids,
    /** Data may still change: don't conclude "not yours" yet. */
    isLoading:
      dashboard.isPending ||
      submissions.isPending ||
      dashboard.isFetching ||
      submissions.isFetching,
    error: dashboard.error ?? submissions.error,
    refetch: () => {
      void dashboard.refetch()
      void submissions.refetch()
    },
  }
}
