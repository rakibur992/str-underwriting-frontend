"use client"

import { skipToken, useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/api/query-keys"
import { getSubmission } from "@/api/submissions"

/** One scored attempt. Submit writes it into the cache, so the result opens instantly. */
export function useSubmission(id: number | null) {
  return useQuery({
    queryKey: queryKeys.submission(id ?? 0),
    queryFn: id === null ? skipToken : () => getSubmission(id),
    staleTime: Infinity,
  })
}
