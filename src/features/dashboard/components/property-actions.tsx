"use client"

import { ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

import { getRowActions, type PropertyRow, type RowAction } from "../mappers"

export function PropertyActions({
  row,
  onStart,
  startingZpid,
}: {
  row: PropertyRow
  onStart: (zpid: string) => void
  /** zpid of the draft being created, if any. Other start buttons wait. */
  startingZpid: string | null
}) {
  const { primary, secondary } = getRowActions(row)

  return (
    <div className="flex flex-col items-end gap-1">
      <ActionButton
        action={primary}
        row={row}
        variant="default"
        onStart={onStart}
        startingZpid={startingZpid}
      />
      {secondary && (
        <ActionButton
          action={secondary}
          row={row}
          variant="link"
          onStart={onStart}
          startingZpid={startingZpid}
        />
      )}
    </div>
  )
}

function ActionButton({
  action,
  row,
  variant,
  onStart,
  startingZpid,
}: {
  action: RowAction
  row: PropertyRow
  variant: "default" | "link"
  onStart: (zpid: string) => void
  startingZpid: string | null
}) {
  const accessibleName = `${action.label}: ${row.street}`
  const size = variant === "link" ? "xs" : "sm"
  const className = variant === "link" ? "h-auto px-0" : "lg:min-w-28"

  if (action.kind === "start") {
    const starting = startingZpid === row.zpid
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        aria-label={accessibleName}
        disabled={startingZpid !== null}
        onClick={() => onStart(row.zpid)}
      >
        {starting && <Loader2 aria-hidden className="animate-spin" />}
        {starting ? "Starting…" : action.label}
      </Button>
    )
  }

  const href =
    action.kind === "continue"
      ? `/underwritings/${action.underwritingId}`
      : `/submissions/${action.submissionId}`

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link href={href} aria-label={accessibleName}>
        {action.label}
        {variant === "default" && (
          <ArrowRight aria-hidden data-icon="inline-end" />
        )}
      </Link>
    </Button>
  )
}
