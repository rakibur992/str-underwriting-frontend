"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useRef } from "react"

import type { ApiError } from "@/api/errors"
import { queryKeys } from "@/api/query-keys"
import type {
  SaveUnderwritingPayload,
  SubmitUnderwritingResult,
} from "@/api/types"
import { submitUnderwriting } from "@/api/underwritings"

/**
 * Saves and grades in one call, then opens the result. The response already
 * holds the refreshed dashboard, so it goes straight into the cache.
 */
export function useSubmitUnderwriting(
  id: number,
  {
    onStart,
    onFailed,
  }: { onStart: () => void; onFailed: (error: ApiError) => void },
) {
  const queryClient = useQueryClient()
  const router = useRouter()
  // Blocks a second submit from a fast double-click before the button disables.
  const inFlight = useRef(false)

  const mutation = useMutation<
    SubmitUnderwritingResult,
    ApiError,
    SaveUnderwritingPayload
  >({
    mutationFn: (body) => submitUnderwriting(id, body),
    onMutate: onStart,
    onError: onFailed,
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.dashboard, result.dashboard)
      queryClient.setQueryData(
        queryKeys.submission(result.submission.id),
        result.submission,
      )
      queryClient.setQueryData(queryKeys.underwriting(id), result.underwriting)
      void queryClient.invalidateQueries({ queryKey: queryKeys.submissions })
      router.push(`/submissions/${result.submission.id}`)
    },
    onSettled: () => {
      inFlight.current = false
    },
  })

  const submit = (body: SaveUnderwritingPayload) => {
    if (inFlight.current) return
    inFlight.current = true
    mutation.mutate(body)
  }

  return { ...mutation, submit }
}
