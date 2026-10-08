"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { PageHeader } from "@/components/layout/page-header"
import { ApiErrorState } from "@/components/ui/api-error-state"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard"

import { useSubmission } from "../hooks/use-submission"
import { explainScore } from "../mappers"
import { BandLadder } from "./band-ladder"
import { NextSteps } from "./next-steps"
import { ResultsSkeleton } from "./results-skeleton"
import { ScoreSummary } from "./score-summary"
import { Standing } from "./standing"

const submittedAt = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function parseId(raw: string | undefined) {
  return raw && /^\d+$/.test(raw) && Number(raw) > 0 ? Number(raw) : null
}

/**
 * The scored attempt: score and tier, why (vs the analyst's Mid), where it
 * landed on the tiers, standing among the trainee's attempts, and next steps.
 * The analyst's numbers appear only here, after submitting.
 */
export function ResultsScreen() {
  const params = useParams<{ id: string }>()
  const id = parseId(params.id)
  const submission = useSubmission(id)
  const dashboard = useDashboard()

  if (id !== null && submission.isPending) return <ResultsSkeleton />
  if (
    id === null ||
    submission.error?.status === 404 ||
    submission.error?.status === 422
  )
    return <NotFound />
  if (!submission.data)
    return (
      <>
        <PageHeader title="Evaluation results" />
        <ApiErrorState
          title="Couldn't load this result"
          error={submission.error}
          onRetry={() => void submission.refetch()}
          retrying={submission.isFetching}
        />
      </>
    )

  const s = submission.data
  const score = explainScore(s)
  const property = dashboard.data?.properties.find((p) => p.zpid === s.zpid)
  const place = property?.address ?? `Property ${s.zpid}`

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Evaluation results"
        description={`${place} · Submitted ${submittedAt.format(new Date(s.submitted_at))}`}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <ScoreSummary score={score} />
          <BandLadder score={score} />
          <Standing current={s} dashboard={dashboard.data} />
        </div>
        <div className="lg:sticky lg:top-4">
          <NextSteps zpid={s.zpid} dashboardQuery={dashboard} />
        </div>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <>
      <PageHeader title="Result not found" />
      <EmptyState
        title="No submission at this link"
        description="This link doesn't match any of your submissions. Past results are on the dashboard."
        action={
          <Button asChild variant="outline" className="mt-2">
            <Link href="/">
              <ArrowLeft aria-hidden data-icon="inline-start" />
              Back to dashboard
            </Link>
          </Button>
        }
      />
    </>
  )
}
