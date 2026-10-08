"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/api/query-keys"
import { listSubmissions } from "@/api/submissions"

/** Every scored attempt, for standing and attempt history (ADR-0005). */
export function useSubmissions() {
  return useQuery({
    queryKey: queryKeys.submissions,
    queryFn: () => listSubmissions(),
  })
}
