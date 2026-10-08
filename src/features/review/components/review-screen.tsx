"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { issuesFromSubmitError } from "@/features/workspace/api-errors"
import { ResultsPanel } from "@/features/workspace/components/results-panel"
import { SaveStatus } from "@/features/workspace/components/save-status"
import { useWorkspace } from "@/features/workspace/components/workspace-provider"
import { toSubmitPayload } from "@/features/workspace/mappers"

import { useSubmitUnderwriting } from "../hooks/use-submit-underwriting"
import { ReviewChecklist } from "./review-checklist"
import { ReviewSummary } from "./review-summary"
import { SubmitPanel } from "./submit-panel"

/**
 * Review and submit: what will be submitted, what's missing (each linking to
 * its field), the calculated results, and one Submit with a confirmation.
 */
export function ReviewScreen() {
  const { id, underwriting, values, errors, autosave, applyServerErrors } =
    useWorkspace()
  const submit = useSubmitUnderwriting(id, {
    onStart: autosave.stop,
    onFailed: (error) => {
      autosave.resume()
      applyServerErrors(error)
    },
  })
  // The API's 422 applies to the values that were submitted; any edit since clears it.
  const valuesKey = JSON.stringify(values)
  const [submittedKey, setSubmittedKey] = useState<string | null>(null)
  const serverIssues =
    submittedKey === valuesKey ? issuesFromSubmitError(submit.error) : []
  const blockingCount = errors.length + serverIssues.length
  const otherError =
    submit.error && serverIssues.length === 0 ? submit.error : null

  const onSubmit = () => {
    setSubmittedKey(valuesKey)
    submit.submit(toSubmitPayload(values))
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Review and submit"
        description={`${underwriting.street ?? "Underwriting"} · Check your inputs and the calculated results, then submit. You're scored on Mid revenue.`}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href={`/underwritings/${id}`}>
              <ArrowLeft aria-hidden data-icon="inline-start" />
              Back to workspace
            </Link>
          </Button>
        }
      />

      {/* Phones: checklist → submit → results → inputs. Desktop: inputs left, submit rail right. */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr]">
        <div className="min-w-0 lg:col-start-1">
          <ReviewChecklist serverIssues={serverIssues} />
        </div>
        <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <SubmitPanel
            blockingCount={blockingCount}
            submitting={submit.isPending || submit.isSuccess}
            error={otherError}
            onSubmit={onSubmit}
          />
          <SaveStatus />
          <ResultsPanel />
        </div>
        <div className="min-w-0 lg:col-start-1">
          <ReviewSummary />
        </div>
      </div>
    </div>
  )
}
