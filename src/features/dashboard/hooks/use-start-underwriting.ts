"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useCallback, useRef } from "react"

import { ApiError } from "@/api/errors"
import { queryKeys } from "@/api/query-keys"
import { createUnderwriting } from "@/api/underwritings"

/**
 * Creates a new draft and opens it in the workspace. Only call this when the
 * property has no `active_underwriting_id`; otherwise continue that draft.
 */
export function useStartUnderwriting() {
  const queryClient = useQueryClient()
  const router = useRouter()

  // Blocks a second POST from a fast double-click before the re-render disables the button.
  const inFlight = useRef(false)

  const mutation = useMutation<{ id: number }, ApiError, string>({
    mutationFn: createUnderwriting,
    onSuccess: ({ id }) => router.push(`/underwritings/${id}`),
    // Refresh either way: after a failure the draft may still have been created,
    // and the row should then offer Continue rather than another Start.
    onSettled: () => {
      inFlight.current = false
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })

  const { mutate } = mutation
  const start = useCallback(
    (zpid: string) => {
      if (inFlight.current) return
      inFlight.current = true
      mutate(zpid)
    },
    [mutate],
  )

  return { ...mutation, start }
}
