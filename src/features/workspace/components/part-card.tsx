"use client"

import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { PART_META, type PartId } from "../fields"
import { useWorkspace } from "./workspace-provider"

/** One part of a section (e.g. Purchase & financing) with its own completion chip. */
export function PartCard({
  part,
  description,
  children,
  footer,
}: {
  part: PartId
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  const headingId = `part-${part}-heading`
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 id={headingId} className="text-base font-semibold">
            {PART_META[part].label}
          </h3>
          {description && (
            <p className="max-w-prose text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <PartStatus part={part} />
      </header>
      {children}
      {footer && (
        <div className="-mx-4 -mb-4 border-t bg-muted/40 px-4 py-3 sm:-mx-5 sm:-mb-5 sm:px-5">
          {footer}
        </div>
      )}
    </section>
  )
}

function PartStatus({ part }: { part: PartId }) {
  const { errors } = useWorkspace()
  const mine = errors.filter((e) => e.part === part)
  const invalid = mine.filter((e) => e.kind === "invalid").length
  const missing = mine.length - invalid
  const { required } = PART_META[part]

  const [Icon, label, tone] =
    invalid > 0
      ? [
          CircleAlert,
          `${invalid} to fix`,
          "border-destructive/30 bg-destructive/5 text-destructive",
        ]
      : missing > 0
        ? [
            CircleDashed,
            `${missing} missing`,
            "border-status-in-progress/25 bg-status-in-progress/10 text-status-in-progress",
          ]
        : required
          ? [
              CircleCheck,
              "Complete",
              "border-score-best/25 bg-score-best/10 text-score-best",
            ]
          : [CircleCheck, "Optional", "border-border text-muted-foreground"]

  return (
    <Badge variant="outline" className={cn(tone)}>
      <Icon aria-hidden data-icon="inline-start" />
      {label}
    </Badge>
  )
}
