"use client"

import { useQuery } from "@tanstack/react-query"

import { getDashboard } from "@/api/dashboard"
import { queryKeys } from "@/api/query-keys"

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: getDashboard })
}
