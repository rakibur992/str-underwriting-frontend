import { describe, expect, it } from "vitest"

import { ApiError } from "@/api/errors"

import {
  fieldPathFromLoc,
  issuesFromSubmitError,
  missingSections,
  partFromLoc,
} from "./api-errors"

describe("API error mapping", () => {
  it("maps a FastAPI loc to its form field", () => {
    expect(
      fieldPathFromLoc(["body", "purchase_details", "interest_rate"]),
    ).toBe("purchase.interestRatePct")
    expect(
      fieldPathFromLoc([
        "body",
        "forecasted_revenue",
        "scenarios",
        "mid",
        "forecasted_revenue",
      ]),
    ).toBe("revenue.mid")
    expect(fieldPathFromLoc(["body", "comp_set", 0, "url"])).toBeNull()
  })

  it("maps list errors to their part", () => {
    expect(
      partFromLoc(["body", "operating_expenses", 1, "monthly_amount"]),
    ).toBe("operatingExpenses")
  })

  it("reads the missing-sections message", () => {
    expect(
      missingSections(
        "Missing required sections: purchase_details, forecasted_revenue, taxes",
      ),
    ).toEqual(["purchase", "revenue", "taxes"])
    expect(missingSections("Underwriting not found")).toEqual([])
  })

  it("turns both submit 422 shapes into checklist items", () => {
    const sections = issuesFromSubmitError(
      new ApiError(422, "Missing required sections: purchase_details, taxes"),
    )
    expect(sections.map((i) => [i.part, i.path, i.section])).toEqual([
      ["purchase", "purchase.downPaymentPct", "financials"],
      ["taxes", "taxes.landPct", "financials"],
    ])
    const fields = issuesFromSubmitError(
      new ApiError(422, "bad", [
        {
          loc: ["body", "purchase_details", "interest_rate"],
          msg: "must be ≤ 1",
        },
        { loc: ["body", "comp_set", 0, "url"], msg: "ignored" },
      ]),
    )
    expect(fields).toEqual([
      expect.objectContaining({
        path: "purchase.interestRatePct",
        kind: "invalid",
        message: "must be ≤ 1",
      }),
    ])
    expect(issuesFromSubmitError(new ApiError(500, "boom"))).toEqual([])
    expect(issuesFromSubmitError(null)).toEqual([])
  })
})
