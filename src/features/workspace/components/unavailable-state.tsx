import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

const COPY = {
  "not-found": {
    title: "Underwriting not found",
    description:
      "This link doesn't match any of your underwritings. Open your cases from the dashboard.",
  },
  reference: {
    title: "Not available",
    description:
      "This underwriting isn't available for training. Pick a case from the dashboard.",
  },
} as const

/** A wrong id or an analyst reference: say so and offer the way back. */
export function UnavailableState({ reason }: { reason: keyof typeof COPY }) {
  const { title, description } = COPY[reason]
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        title={title}
        description={description}
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
