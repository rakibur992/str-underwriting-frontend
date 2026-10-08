import { describe, expect, it } from "vitest"

import type { DashboardProperty, DashboardResult } from "@/api/types"

import {
  getRowActions,
  toPropertyRow,
  toPropertyRows,
  toSummary,
} from "./mappers"

function property(
  overrides: Partial<DashboardProperty> = {},
): DashboardProperty {
  return {
    zpid: "52345678",
    address: "88 Lakeshore Ln, Broken Bow, OK 74728",
    city: "Broken Bow",
    state: "OK",
    zipcode: "74728",
    price: "$540,000",
    unformatted_price: "540000",
    beds: 2,
    baths: 2.0,
    area: 1600,
    img_src: null,
    detail_url: null,
    home_type: "SINGLE_FAMILY",
    market_id: 2,
    market_name: "Broken Bow",
    status: "not_started",
    attempts: 0,
    latest_accuracy: null,
    latest_rating: null,
    best_accuracy: null,
    best_rating: null,
    active_underwriting_id: null,
    latest_submission_id: null,
    ...overrides,
  }
}

describe("toPropertyRow", () => {
  it("formats the listing for display", () => {
    const row = toPropertyRow(property({ baths: 5.5 }))
    expect(row).toMatchObject({
      street: "88 Lakeshore Ln",
      locality: "Broken Bow, OK 74728",
      marketName: "Broken Bow",
      price: "$540,000",
      rooms: "2 bd · 5.5 ba",
      area: "1,600 sq ft",
      status: "not_started",
    })
  })

  it("passes the photo through and treats an empty one as missing", () => {
    const url = "https://picsum.photos/seed/1/400/300"
    expect(toPropertyRow(property({ img_src: url })).imageUrl).toBe(url)
    expect(toPropertyRow(property({ img_src: "" })).imageUrl).toBeNull()
    expect(toPropertyRow(property()).imageUrl).toBeNull()
  })

  it("narrows loose status and rating strings", () => {
    const row = toPropertyRow(
      property({
        status: "submitted",
        latest_rating: "medium",
        latest_accuracy: "70.00",
        best_rating: "weird",
      }),
    )
    expect(row.status).toBe("submitted")
    expect(row.latest).toEqual({ rating: "medium", accuracy: "70.00" })
    expect(row.best.rating).toBeNull()
    expect(toPropertyRow(property({ status: "unknown" })).status).toBe(
      "not_started",
    )
  })
})

describe("price fallback", () => {
  it("uses the API's formatted price when the raw one is missing", () => {
    expect(
      toPropertyRow(property({ unformatted_price: null, price: "$540,000" }))
        .price,
    ).toBe("$540,000")
  })
})

describe("toPropertyRows", () => {
  it("orders in progress, then not started, then submitted, keeping API order within a status", () => {
    const rows = toPropertyRows([
      property({ zpid: "a", status: "submitted" }),
      property({ zpid: "b", status: "not_started" }),
      property({ zpid: "c", status: "in_progress" }),
      property({ zpid: "d", status: "not_started" }),
    ])
    expect(rows.map((r) => r.zpid)).toEqual(["c", "b", "d", "a"])
  })
})

describe("toSummary", () => {
  it("counts every property with an attempt as scored", () => {
    const result: DashboardResult = {
      summary: {
        total_properties: 3,
        submitted: 1,
        in_progress: 1,
        not_started: 1,
        average_accuracy: "85.00",
      },
      properties: [
        property({ status: "submitted", attempts: 1 }),
        // A retry draft on a scored property still counts as scored.
        property({ status: "in_progress", attempts: 2 }),
        property(),
      ],
    }
    expect(toSummary(result)).toEqual({
      total: 3,
      scored: 2,
      inProgress: 1,
      notStarted: 1,
      averageAccuracy: "85.00",
    })
  })
})

describe("getRowActions", () => {
  it("starts a not-started property", () => {
    expect(getRowActions(toPropertyRow(property()))).toEqual({
      primary: { kind: "start", label: "Start" },
    })
  })

  it("continues the active draft instead of creating a new one", () => {
    const row = toPropertyRow(
      property({ status: "in_progress", active_underwriting_id: 12 }),
    )
    expect(getRowActions(row)).toEqual({
      primary: { kind: "continue", label: "Continue", underwritingId: 12 },
      secondary: undefined,
    })
  })

  it("continues any open draft, whatever the status says", () => {
    const row = toPropertyRow(
      property({ status: "unexpected", active_underwriting_id: 21 }),
    )
    expect(getRowActions(row).primary).toEqual({
      kind: "continue",
      label: "Continue",
      underwritingId: 21,
    })
  })

  it("links to the last result while a retry is in progress", () => {
    const row = toPropertyRow(
      property({
        status: "in_progress",
        active_underwriting_id: 14,
        latest_submission_id: 3,
      }),
    )
    expect(getRowActions(row).secondary).toEqual({
      kind: "view-result",
      label: "Last result",
      submissionId: 3,
    })
  })

  it("offers the result first and a retry second once submitted", () => {
    const row = toPropertyRow(
      property({ status: "submitted", attempts: 1, latest_submission_id: 3 }),
    )
    expect(getRowActions(row)).toEqual({
      primary: { kind: "view-result", label: "View result", submissionId: 3 },
      secondary: { kind: "start", label: "Try again" },
    })
  })
})
