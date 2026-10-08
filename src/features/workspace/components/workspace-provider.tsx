"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useForm, useWatch, type UseFormReturn } from "react-hook-form"

import type { ApiError } from "@/api/errors"
import type { UnderwritingRead } from "@/api/types"
import type { UnderwritingResults } from "@/lib/calculations"

import { fieldPathFromLoc, partFromLoc } from "../api-errors"
import type { PartId } from "../fields"
import { useAutosave, type AutosaveStatus } from "../hooks/use-autosave"
import { useLeaveGuard } from "../hooks/use-leave-guard"
import { useUnderwriting } from "../hooks/use-underwriting"
import {
  collectErrors,
  collectWarnings,
  partStates,
  sectionProgress,
  type Issue,
  type SectionProgress,
} from "../issues"
import {
  apiResults,
  previewResults,
  snapshotParts,
  toFormValues,
} from "../mappers"
import { workspaceSchema, type WorkspaceValues } from "../schema"

export interface WorkspaceContextValue {
  id: number
  underwriting: UnderwritingRead
  form: UseFormReturn<WorkspaceValues>
  values: WorkspaceValues
  errors: Issue[]
  warnings: Issue[]
  progress: SectionProgress[]
  autosave: AutosaveStatus
  /** Puts an API 422's field errors on the matching fields. */
  applyServerErrors: (error: ApiError) => void
  /** API errors on a list that don't map to one field. */
  partErrors: Partial<Record<PartId, string>>
  results: UnderwritingResults
  /** "api" once everything is saved and computed; otherwise a live preview. */
  resultsSource: "api" | "preview"
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspace() {
  const value = useContext(WorkspaceContext)
  if (!value)
    throw new Error("useWorkspace must be used inside WorkspaceProvider")
  return value
}

/**
 * Owns the one underwriting form shared by the workspace and the review page,
 * so review checks exactly what was typed. Lives in the route layout and
 * survives navigation between the two.
 */
export function WorkspaceProvider({
  initial,
  children,
}: {
  initial: UnderwritingRead
  children: ReactNode
}) {
  const id = initial.id
  const underwriting = useUnderwriting(id).data ?? initial

  const form = useForm<WorkspaceValues>({
    defaultValues: toFormValues(initial),
    resolver: zodResolver(workspaceSchema),
    mode: "onTouched",
  })

  // What the server already has, part by part: the baseline for "unsaved".
  const [initialKeys] = useState(() => {
    const saved = toFormValues(initial, { withDefaults: false })
    const keys = snapshotParts(saved, partStates(collectErrors(saved)))
    return Object.fromEntries(
      Object.entries(keys).map(([part, s]) => [part, s.key]),
    ) as Record<PartId, string>
  })

  // Every value, re-read on each change; serialised so derived data only recomputes on real edits.
  const valuesKey = JSON.stringify(useWatch({ control: form.control }))
  const derived = useMemo(() => {
    const v = JSON.parse(valuesKey) as WorkspaceValues
    const errors = collectErrors(v)
    return {
      values: v,
      errors,
      warnings: collectWarnings(v),
      progress: sectionProgress(errors),
      snapshots: snapshotParts(v, partStates(errors)),
      preview: previewResults(v),
    }
  }, [valuesKey])

  const [partErrors, setPartErrors] = useState<Partial<Record<PartId, string>>>(
    {},
  )
  const { setError } = form
  const onServerErrors = useCallback(
    (error: ApiError) => {
      const byPart: Partial<Record<PartId, string>> = {}
      for (const fieldError of error.fieldErrors) {
        const path = fieldPathFromLoc(fieldError.loc)
        if (path) {
          setError(path as keyof WorkspaceValues, {
            type: "server",
            message: fieldError.msg,
          })
          continue
        }
        const part = partFromLoc(fieldError.loc)
        if (part) byPart[part] = fieldError.msg
      }
      setPartErrors(byPart)
    },
    [setError],
  )

  const autosave = useAutosave({
    id,
    snapshots: derived.snapshots,
    initialKeys,
    onServerErrors,
  })

  // Pending saves flush on leaving; failed or unsaveable changes would be lost, so ask.
  useLeaveGuard(
    autosave.state === "error" || autosave.blocked.length > 0,
    `/underwritings/${id}`,
    "Some of your changes aren't saved yet. Leave anyway and lose them?",
  )

  const saved = apiResults(underwriting)
  const showApi = saved !== null && !autosave.hasUnsavedChanges

  const value: WorkspaceContextValue = {
    id,
    underwriting,
    form,
    values: derived.values,
    errors: derived.errors,
    warnings: derived.warnings,
    progress: derived.progress,
    autosave,
    applyServerErrors: onServerErrors,
    partErrors: autosave.state === "error" ? partErrors : {},
    results: showApi ? saved : derived.preview,
    resultsSource: showApi ? "api" : "preview",
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}
