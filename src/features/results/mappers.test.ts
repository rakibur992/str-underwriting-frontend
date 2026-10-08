import { describe, expect, it } from "vitest"

import type { DashboardProperty, SubmissionRead } from "@/api/types"

import {
  explainScore,
  nextUnfinishedCase,
  rankAttempts,
  tierRanges,
} from "./mappers"

function submission(
  over: Partial<SubmissionRead> & {
    candidate?: string | null
    deviation?: string
  } = {},
): SubmissionRead {
  const { candidate = "130000.00", deviation = "0.0400", ...rest } = over
  return {
    id: 1,
    underwriting_id: 10,
    reference_underwriting_id: 1,
    zpid: "41234567",
    rating: "best",
    accuracy: "100.00",
    submitted_at: "2026-10-07T10:00:00Z",
    breakdown: {
      rating: rest.rating ?? "best",
      accuracy: rest.accuracy ?? "100.00",
      metric: "mid_gross_revenue",
      label: "Mid revenue forecast",
      candidate,
      reference: "125000.00",
      deviation,
      best_threshold: "0.10",
      medium_threshold: "0.25",
    },
    ...rest,
  }
}

describe("explainScore", () => {
  it("says how far above the analyst the forecast was (backend README example)", () => {
    const e = explainScore(submission())
    expect(e.sentence).toBe("You were 4.0% above the analyst's Mid revenue.")
    expect(e.signedDeviationPct).toBe(4)
    expect(e.rating).toBe("best")
  })

  it("says below when the forecast was lower", () => {
    const e = explainScore(
      submission({
        candidate: "100000.00",
        deviation: "0.2000",
        rating: "medium",
      }),
    )
    expect(e.sentence).toBe("You were 20.0% below the analyst's Mid revenue.")
    expect(e.signedDeviationPct).toBe(-20)
  })

  it("handles an exact match and a missing forecast", () => {
    expect(
      explainScore(submission({ candidate: "125000.00", deviation: "0.0000" }))
        .sentence,
    ).toBe("You matched the analyst's Mid revenue exactly.")
    expect(
      explainScore(
        submission({ candidate: null, deviation: "1.0000", rating: "low" }),
      ).sentence,
    ).toContain("scores Low")
  })

  it("falls back to the score for a rating it doesn't know", () => {
    expect(
      explainScore(submission({ rating: "great", accuracy: "70.00" })).rating,
    ).toBe("medium")
  })

  it("gives the Mid revenue each tier needed, inclusive", () => {
    const tiers = tierRanges(explainScore(submission()))
    expect(tiers.map((t) => [t.rating, t.rule, t.range])).toEqual([
      ["best", "Within 10%", "$112,500 – $137,500"],
      ["medium", "Within 25%", "$93,750 – $156,250"],
      ["low", "More than 25% away", "Anything outside Medium"],
    ])
  })
})

describe("rankAttempts", () => {
  it("ranks by score, then smallest deviation, then earliest", () => {
    const ranked = rankAttempts([
      submission({ id: 1, accuracy: "70.00", deviation: "0.1500" }),
      submission({ id: 2, accuracy: "100.00", deviation: "0.0800" }),
      submission({
        id: 3,
        accuracy: "100.00",
        deviation: "0.0200",
        submitted_at: "2026-10-07T12:00:00Z",
      }),
      submission({
        id: 4,
        accuracy: "100.00",
        deviation: "0.0200",
        submitted_at: "2026-10-07T11:00:00Z",
      }),
      submission({ id: 5, accuracy: "40.00", deviation: "0.5000" }),
    ])
    expect(ranked.map((r) => [r.submission.id, r.rank])).toEqual([
      [4, 1],
      [3, 2],
      [2, 3],
      [1, 4],
      [5, 5],
    ])
  })
})

describe("nextUnfinishedCase", () => {
  const property = (over: Partial<DashboardProperty>) =>
    ({
      zpid: "1",
      address: "1 Main St, Town, ST",
      status: "not_started",
      active_underwriting_id: null,
      ...over,
    }) as DashboardProperty

  it("prefers an open draft, skips this property and finished ones", () => {
    const next = nextUnfinishedCase(
      [
        property({ zpid: "a", status: "submitted" }),
        property({ zpid: "b", address: "2 Oak Rd, X" }),
        property({
          zpid: "c",
          address: "3 Elm St, Y",
          status: "in_progress",
          active_underwriting_id: 9,
        }),
        property({
          zpid: "current",
          status: "in_progress",
          active_underwriting_id: 7,
        }),
      ],
      "current",
    )
    expect(next).toEqual({
      kind: "continue",
      zpid: "c",
      street: "3 Elm St",
      underwritingId: 9,
    })
  })

  it("starts a new case when there are no drafts, and is null when all are done", () => {
    expect(nextUnfinishedCase([property({ zpid: "b" })], "x")).toMatchObject({
      kind: "start",
      zpid: "b",
    })
    expect(
      nextUnfinishedCase([property({ zpid: "b", status: "submitted" })], "x"),
    ).toBeNull()
  })
})
