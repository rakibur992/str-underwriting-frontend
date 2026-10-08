"use client"

import { useQuery } from "@tanstack/react-query"

import { getMarket } from "@/api/markets"
import { queryKeys } from "@/api/query-keys"

export function useMarket(id: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.market(id ?? 0),
    queryFn: () => getMarket(id!),
    enabled: id != null,
    staleTime: Infinity,
  })
}
