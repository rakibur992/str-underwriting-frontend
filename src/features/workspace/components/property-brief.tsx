"use client"

import { ExternalLink, MapPin } from "lucide-react"
import Image from "next/image"

import { parseUnderwritingDetail } from "@/api/detail-schemas"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatNumber } from "@/lib/format"

import { useMarket } from "../hooks/use-market"
import { useWorkspace } from "./workspace-provider"

/** The property and its market, read before entering numbers (workflow step 2). */
export function PropertyBrief() {
  const { underwriting: uw } = useWorkspace()
  const property = parseUnderwritingDetail(uw).zillowProperty
  const market = useMarket(uw.market_id)

  const facts = [
    {
      label: "List price",
      value: property?.price ?? formatCurrency(uw.purchase_price),
    },
    {
      label: "Beds · baths",
      value: [
        uw.bedrooms ?? property?.beds,
        formatNumber(uw.bathrooms ?? property?.baths, { digits: 1 }),
      ]
        .map((v) => v ?? "—")
        .join(" · "),
    },
    {
      label: "Size",
      value: property?.area ? `${formatNumber(property.area)} sq ft` : "—",
    },
    {
      label: "Sleeps",
      value:
        uw.sleep_count_low && uw.sleep_count_high
          ? `${uw.sleep_count_low}–${uw.sleep_count_high}`
          : "—",
    },
  ]

  return (
    <section
      aria-labelledby="brief-heading"
      className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:p-5"
    >
      <h2 id="brief-heading" className="sr-only">
        Property and market
      </h2>
      {property?.img_src ? (
        <Image
          src={property.img_src}
          alt={`Photo of ${uw.street ?? "the property"}`}
          width={352}
          height={232}
          unoptimized
          className="aspect-[3/2] w-full rounded-md bg-muted object-cover sm:w-44"
        />
      ) : (
        <div className="hidden aspect-[3/2] rounded-md bg-muted sm:block" />
      )}

      <div className="flex min-w-0 flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd className="font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-1 border-t pt-3">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <MapPin aria-hidden className="size-3.5 text-muted-foreground" />
            Market:{" "}
            {market.data?.name ??
              (market.isPending && uw.market_id != null ? (
                <Skeleton className="h-4 w-40" />
              ) : (
                "Unassigned"
              ))}
          </div>
          {market.data?.description ? (
            <p className="max-w-prose text-sm text-muted-foreground">
              {market.data.description}
            </p>
          ) : market.isPending && uw.market_id != null ? (
            <div
              role="status"
              aria-label="Loading market"
              className="flex flex-col gap-1.5"
            >
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          ) : market.isError ? (
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load the market description.{" "}
              <Button
                variant="link"
                size="xs"
                className="h-auto p-0"
                onClick={() => void market.refetch()}
              >
                Retry
              </Button>
            </p>
          ) : null}
        </div>

        {property?.detail_url && (
          <a
            href={property.detail_url}
            target="_blank"
            rel="noreferrer"
            className="flex w-fit items-center gap-1 rounded-sm text-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            View the listing
            <ExternalLink aria-hidden className="size-3.5" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
    </section>
  )
}
