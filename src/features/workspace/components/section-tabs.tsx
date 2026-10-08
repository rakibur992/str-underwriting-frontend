"use client"

import { CircleAlert, CircleCheck } from "lucide-react"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { SECTION_LABEL, SECTIONS } from "../fields"
import { useWorkspace } from "./workspace-provider"

/** Financials ▸ Analysis ▸ Deal tags, each with how many required fields are done. */
export function SectionTabs() {
  const { progress, values } = useWorkspace()
  const tagsOn = Object.values(values.tags).filter(Boolean).length

  return (
    <TabsList className="h-auto w-full sm:w-fit">
      {SECTIONS.map((section) => {
        const p = progress.find((x) => x.section === section)!
        const status =
          p.total === 0
            ? `Optional${tagsOn ? ` · ${tagsOn} on` : ""}`
            : p.complete
              ? "Done"
              : `${p.done}/${p.total}`
        return (
          <TabsTrigger
            key={section}
            value={section}
            className="gap-2 px-3 py-1.5"
          >
            {SECTION_LABEL[section]}
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-normal",
                p.invalid > 0
                  ? "text-destructive"
                  : p.complete && p.total > 0
                    ? "text-score-best"
                    : "text-muted-foreground",
              )}
            >
              {p.invalid > 0 ? (
                <CircleAlert aria-hidden className="size-3.5" />
              ) : p.complete && p.total > 0 ? (
                <CircleCheck aria-hidden className="size-3.5" />
              ) : null}
              {p.invalid > 0 ? `${p.invalid} to fix` : status}
              <span className="sr-only">
                {p.total > 0
                  ? `, ${p.done} of ${p.total} required fields done`
                  : ""}
              </span>
            </span>
          </TabsTrigger>
        )
      })}
    </TabsList>
  )
}
