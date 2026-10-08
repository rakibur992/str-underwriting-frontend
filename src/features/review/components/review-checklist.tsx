"use client"

import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  TriangleAlert,
} from "lucide-react"
import Link from "next/link"

import { useWorkspace } from "@/features/workspace/components/workspace-provider"
import { SECTION_LABEL, SECTIONS } from "@/features/workspace/fields"
import type { Issue } from "@/features/workspace/issues"

import { fieldHref } from "../links"

/**
 * Everything still missing or invalid, grouped by section, each linking back
 * to the exact field. Warnings follow and never block submit.
 */
export function ReviewChecklist({ serverIssues }: { serverIssues: Issue[] }) {
  const { id, errors, warnings } = useWorkspace()
  const blocking = [...serverIssues, ...errors]

  return (
    <section
      aria-labelledby="checklist-heading"
      className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:p-5"
    >
      <h2 id="checklist-heading" className="text-base font-semibold">
        Checklist
      </h2>

      {blocking.length === 0 ? (
        <p className="flex items-center gap-2 text-sm">
          <CircleCheck aria-hidden className="size-4 text-score-best" />
          Every required input is filled in and valid.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-destructive">
            {blocking.length === 1
              ? "1 thing to fix before you can submit"
              : `${blocking.length} things to fix before you can submit`}
          </p>
          {SECTIONS.map((section) => {
            const items = blocking.filter((i) => i.section === section)
            if (items.length === 0) return null
            return (
              <div key={section} className="flex flex-col gap-1.5">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {SECTION_LABEL[section]}
                </h3>
                <ul
                  aria-label={`${SECTION_LABEL[section]}: to fix`}
                  className="flex flex-col gap-1"
                >
                  {items.map((issue) => (
                    <IssueItem
                      key={`${issue.path}-${issue.message}`}
                      id={id}
                      issue={issue}
                    />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t pt-3">
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Worth a second look (won&apos;t block submit)
          </h3>
          <ul aria-label="Warnings" className="flex flex-col gap-1">
            {warnings.map((issue) => (
              <IssueItem
                key={issue.path + issue.message}
                id={id}
                issue={issue}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

const ICON = {
  missing: {
    Icon: CircleDashed,
    tone: "text-status-in-progress",
    word: "Missing",
  },
  invalid: { Icon: CircleAlert, tone: "text-destructive", word: "Invalid" },
  warning: { Icon: TriangleAlert, tone: "text-score-medium", word: "Warning" },
} as const

function IssueItem({ id, issue }: { id: number; issue: Issue }) {
  const { Icon, tone, word } = ICON[issue.kind]
  return (
    <li>
      <Link
        href={fieldHref(id, issue.path)}
        className="group flex items-start gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Icon aria-hidden className={`mt-0.5 size-4 shrink-0 ${tone}`} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium">
            <span className="sr-only">{word}: </span>
            {issue.label}
          </span>
          <span className="text-muted-foreground">{issue.message}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs text-primary group-hover:underline">
          {issue.kind === "warning" ? "Check" : "Fix"}
          <ArrowRight aria-hidden className="size-3" />
        </span>
      </Link>
    </li>
  )
}
