"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"

import { ApiError, toNetworkError } from "@/api/errors"
import { queryKeys } from "@/api/query-keys"
import type { SaveUnderwritingPayload } from "@/api/types"
import { saveUnderwriting } from "@/api/underwritings"

import { PARTS, type PartId } from "../fields"
import { mergePayloads, type PartSnapshot } from "../mappers"

/** Wait this long after the last keystroke before saving. */
export const AUTOSAVE_DELAY_MS = 800

export type SaveState = "saved" | "pending" | "saving" | "error"

export interface AutosaveStatus {
  state: SaveState
  /** Changed parts that can't be saved yet (incomplete or invalid). */
  blocked: PartId[]
  /** Changes not yet stored by the API (pending, saving, failed or blocked). */
  hasUnsavedChanges: boolean
  error: ApiError | null
  lastSavedAt: Date | null
  retry: () => void
  /** While submitting and after: the submit carries every value, and the attempt is final. */
  stop: () => void
  /** A submit failed: go back to saving as usual. */
  resume: () => void
}

/**
 * Saves every changed part that is complete and valid, shortly after typing
 * stops. Typed input is never reset: a failed save keeps it and offers Retry.
 * `savedKeys` starts from the server's values, so opening a draft saves nothing
 * unless the form added something (like the tax defaults).
 */
export function useAutosave({
  id,
  snapshots,
  initialKeys,
  onServerErrors,
}: {
  id: number
  snapshots: Record<PartId, PartSnapshot>
  initialKeys: Record<PartId, string>
  onServerErrors: (error: ApiError) => void
}): AutosaveStatus {
  const queryClient = useQueryClient()
  const [savedKeys, setSavedKeys] = useState(initialKeys)
  const [failedKey, setFailedKey] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const mutation = useMutation({
    mutationFn: (body: SaveUnderwritingPayload) => saveUnderwriting(id, body),
  })

  const dirty = PARTS.filter((p) => snapshots[p].key !== savedKeys[p])
  const toSend = dirty.filter((p) => snapshots[p].sendable)
  const blocked = dirty.filter((p) => !snapshots[p].sendable)
  const sendKey = toSend.map((p) => `${p}=${snapshots[p].key}`).join("&")

  // Latest values for callbacks that outlive this render (timers, unmount).
  const latest = useRef({ snapshots, toSend, sendKey })
  const stopped = useRef(false)
  useEffect(() => {
    latest.current = { snapshots, toSend, sendKey }
  })

  const { mutateAsync, isPending } = mutation
  const save = useCallback(async () => {
    const { snapshots: current, toSend: parts, sendKey: key } = latest.current
    if (parts.length === 0 || stopped.current) return
    try {
      const saved = await mutateAsync(mergePayloads(current, parts))
      queryClient.setQueryData(queryKeys.underwriting(id), saved)
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
      setSavedKeys((prev) => ({
        ...prev,
        ...Object.fromEntries(parts.map((p) => [p, current[p].key])),
      }))
      setFailedKey(null)
      setLastSavedAt(new Date())
    } catch (error) {
      setFailedKey(key)
      onServerErrors(error instanceof ApiError ? error : toNetworkError(error))
    }
  }, [id, mutateAsync, onServerErrors, queryClient])

  useEffect(() => {
    // After a failure, wait for the next edit or an explicit Retry.
    if (!sendKey || isPending || failedKey === sendKey) return
    const timer = setTimeout(() => void save(), AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [sendKey, isPending, failedKey, save])

  // Leaving the workspace inside the app: save what's pending right away.
  useEffect(
    () => () => {
      const { snapshots: current, toSend: parts } = latest.current
      if (parts.length === 0 || stopped.current) return
      void saveUnderwriting(id, mergePayloads(current, parts))
        .then((saved) => {
          queryClient.setQueryData(queryKeys.underwriting(id), saved)
          void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
        })
        .catch(() => {
          // Nothing to show it on any more; the next visit loads what was stored.
        })
    },
    [id, queryClient],
  )

  const hasUnsavedChanges = dirty.length > 0 || isPending

  // Closing or reloading the tab: let the browser ask first.
  useEffect(() => {
    if (!hasUnsavedChanges) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [hasUnsavedChanges])

  const state: SaveState = isPending
    ? "saving"
    : failedKey !== null && failedKey === sendKey
      ? "error"
      : toSend.length > 0
        ? "pending"
        : "saved"

  return {
    state,
    blocked,
    hasUnsavedChanges,
    error: state === "error" ? mutation.error : null,
    lastSavedAt,
    retry: () => void save(),
    stop: () => {
      stopped.current = true
    },
    resume: () => {
      stopped.current = false
    },
  }
}
