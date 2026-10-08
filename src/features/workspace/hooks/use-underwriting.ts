"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/api/query-keys"
import { getUnderwriting } from "@/api/underwritings"

/** The saved underwriting. Saves write their response into this cache entry. */
export function useUnderwriting(id: number | null) {
  return useQuery({
    queryKey: queryKeys.underwriting(id ?? 0),
    queryFn: () => getUnderwriting(id!),
    enabled: id !== null,
    // The form owns what's typed; refetching on focus would only race autosave.
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })
}
