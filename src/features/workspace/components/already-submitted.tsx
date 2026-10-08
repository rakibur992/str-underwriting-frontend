"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"

import type { UnderwritingRead } from "@/api/types"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { useSubmissions } from "@/features/results/hooks/use-submissions"

/**
 * A submitted attempt is final for its score. Editing it here would change the
 * inputs behind a grade, so point to the result and to a fresh attempt instead.
 */
export function AlreadySubmitted({
  underwriting,
}: {
  underwriting: UnderwritingRead
}) {
  const submissions = useSubmissions()
  const latest = submissions.data
    ?.filter((s) => s.underwriting_id === underwriting.id)
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))[0]

  return (
    <>
      <PageHeader
        title={underwriting.street ?? "Submitted underwriting"}
        description="This attempt has been submitted and scored."
      />
      <EmptyState
        title="Already submitted"
        description="A submission is final for that attempt. To try this property again, start a new attempt from the dashboard."
        action={
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {latest && (
              <Button asChild>
                <Link href={`/submissions/${latest.id}`}>
                  View result
                  <ArrowRight aria-hidden data-icon="inline-end" />
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft aria-hidden data-icon="inline-start" />
                Back to dashboard
              </Link>
            </Button>
          </div>
        }
      />
    </>
  )
}
