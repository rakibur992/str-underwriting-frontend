"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"

import { AnalysisSection } from "../analysis/components/analysis-section"
import { DealTagsSection } from "../deal-tags/components/deal-tags-section"
import {
  fieldId,
  SECTION_LABEL,
  SECTIONS,
  sectionOf,
  type SectionId,
} from "../fields"
import { FinancialsSection } from "../financials/components/financials-section"
import { PropertyBrief } from "./property-brief"
import { ResultsMiniBar } from "./results-mini-bar"
import { ResultsPanel } from "./results-panel"
import { SaveStatus } from "./save-status"
import { SectionTabs } from "./section-tabs"
import { useWorkspace } from "./workspace-provider"

function toSection(value: string | null): SectionId {
  return (SECTIONS as readonly string[]).includes(value ?? "")
    ? (value as SectionId)
    : "financials"
}

/**
 * The underwriting workspace: property brief on top, three sections as tabs
 * (`?section=`), and the results rail that stays visible while typing.
 * `?field=<path>` (from the review checklist) opens the field's section,
 * reveals every error and focuses that field.
 */
export function WorkspaceScreen() {
  const { id, underwriting, form } = useWorkspace()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const focusField = searchParams.get("field")
  const section = focusField
    ? sectionOf(focusField)
    : toSection(searchParams.get("section"))

  const goTo = (next: SectionId) => {
    const params = new URLSearchParams(searchParams)
    params.set("section", next)
    params.delete("field")
    router.replace(`${pathname}?${params}`, { scroll: false })
  }

  useEffect(() => {
    if (!focusField) return
    void form.trigger()
    const timer = setTimeout(() => {
      const el = document.getElementById(fieldId(focusField))
      el?.scrollIntoView({ block: "center" })
      el?.focus({ preventScroll: true })
    }, 0)
    return () => clearTimeout(timer)
  }, [focusField, form])

  const reviewHref = `/underwritings/${id}/review`
  const next = SECTIONS[SECTIONS.indexOf(section) + 1]
  const place = [underwriting.city, underwriting.state]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="flex flex-col gap-6 pb-16 lg:pb-0">
      <PageHeader
        title={underwriting.street ?? "Underwriting"}
        description={`${place ? `${place} · ` : ""}Read the property and market first, then work through the three sections. Your work saves as you go.`}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft aria-hidden data-icon="inline-start" />
              Back to dashboard
            </Link>
          </Button>
        }
      />

      <PropertyBrief />

      <Tabs
        value={section}
        onValueChange={(v) => goTo(toSection(v))}
        className="gap-6"
      >
        <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-1 border-b bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <SectionTabs />
            <div className="flex items-center gap-3">
              <SaveStatus />
              <Button asChild size="sm">
                <Link href={reviewHref}>
                  Review &amp; submit
                  <ArrowRight aria-hidden data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <form
            noValidate
            aria-label="Underwriting inputs"
            onSubmit={(e) => e.preventDefault()}
            className="flex min-w-0 flex-col gap-6"
          >
            <TabsContent value="financials">
              <FinancialsSection />
            </TabsContent>
            <TabsContent value="analysis">
              <AnalysisSection />
            </TabsContent>
            <TabsContent value="deal-tags">
              <DealTagsSection />
            </TabsContent>

            <div className="flex justify-end">
              {next ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goTo(next)}
                >
                  Next: {SECTION_LABEL[next]}
                  <ArrowRight aria-hidden data-icon="inline-end" />
                </Button>
              ) : (
                <Button asChild>
                  <Link href={reviewHref}>
                    Review &amp; submit
                    <ArrowRight aria-hidden data-icon="inline-end" />
                  </Link>
                </Button>
              )}
            </div>
          </form>

          <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <ResultsPanel />
          </div>
        </div>
      </Tabs>

      <ResultsMiniBar />
    </div>
  )
}
