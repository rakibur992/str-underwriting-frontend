"use client"

import Image from "next/image"
import { House } from "lucide-react"

import { cn } from "@/lib/utils"
import { ScoreBadge } from "@/components/ui/score-badge"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { PropertyRow } from "../mappers"
import { PropertyActions } from "./property-actions"

/**
 * A table, not cards: analysts compare price, size, status and scores across
 * properties, and columns keep those numbers aligned. Below `lg`, Market,
 * Size, Attempts and Best score fold into neighbouring cells.
 */
export function PropertyTable({
  rows,
  onStart,
  startingZpid,
}: {
  rows: PropertyRow[]
  onStart: (zpid: string) => void
  startingZpid: string | null
}) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableCaption className="sr-only">
          Training cases with status, attempts and scores
        </TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Property</TableHead>
            <TableHead className="hidden lg:table-cell">Market</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="hidden lg:table-cell">Size</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden text-right lg:table-cell">
              Attempts
            </TableHead>
            <TableHead>
              <span className="lg:hidden">Scores</span>
              <span className="hidden lg:inline">Latest score</span>
            </TableHead>
            <TableHead className="hidden lg:table-cell">Best score</TableHead>
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Action</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.zpid} data-zpid={row.zpid}>
              <TableCell className="py-3 pl-4">
                <div className="flex items-center gap-3">
                  <PropertyThumbnail src={row.imageUrl} />
                  <div className="min-w-0">
                    <div className="font-medium">{row.street}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.locality}
                    </div>
                    <div className="text-xs text-muted-foreground lg:hidden">
                      {row.marketName}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden whitespace-normal lg:table-cell">
                {row.marketName}
              </TableCell>
              <TableCell className="text-right font-medium">
                {row.price}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div>{row.rooms}</div>
                <div className="text-xs text-muted-foreground">{row.area}</div>
              </TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
                <div className="mt-1 text-xs text-muted-foreground lg:hidden">
                  {attemptsLabel(row.attempts)}
                </div>
              </TableCell>
              <TableCell className="hidden text-right lg:table-cell">
                {row.attempts}
              </TableCell>
              <TableCell>
                <ScoreLine label="Latest" score={row.latest} />
                <ScoreLine label="Best" score={row.best} compactOnly />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <ScoreBadge {...row.best} />
              </TableCell>
              <TableCell className="py-3 pr-4 text-right">
                <PropertyActions
                  row={row}
                  onStart={onStart}
                  startingZpid={startingZpid}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Decorative: the street name sits right beside it, so alt text would only
 * repeat it for screen readers.
 */
function PropertyThumbnail({ src }: { src: string | null }) {
  // Hidden on phones, where every pixel of the row goes to the numbers.
  const box = "hidden aspect-[3/2] w-14 shrink-0 rounded-md bg-muted sm:block"
  if (!src) {
    return (
      <div className={cn(box, "items-center justify-center sm:flex")}>
        <House aria-hidden className="size-4 text-muted-foreground" />
      </div>
    )
  }
  return (
    <Image
      src={src}
      alt=""
      width={112}
      height={75}
      unoptimized
      className={cn(box, "object-cover")}
    />
  )
}

/** Below `lg` the scores column shows both scores, each with a small label. */
function ScoreLine({
  label,
  score,
  compactOnly = false,
}: {
  label: string
  score: PropertyRow["latest"]
  compactOnly?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        compactOnly ? "mt-1 lg:hidden" : "",
      )}
    >
      <span className="w-10 text-xs text-muted-foreground lg:hidden">
        {label}
      </span>
      <ScoreBadge {...score} />
    </div>
  )
}

function attemptsLabel(attempts: number) {
  return attempts === 1 ? "1 attempt" : `${attempts} attempts`
}
