import { describe, expect, it } from "vitest"

import { ApiError, request, toApiError } from "./errors"

describe("toApiError", () => {
  it("keeps a string detail as the message", () => {
    const error = toApiError(422, {
      detail: "Missing required sections: purchase_details, taxes",
    })
    expect(error.status).toBe(422)
    expect(error.message).toBe(
      "Missing required sections: purchase_details, taxes",
    )
    expect(error.fieldErrors).toEqual([])
  })

  it("collects array details as field errors", () => {
    const error = toApiError(422, {
      detail: [
        {
          loc: ["body", "purchase_details", "mortgage_years"],
          msg: "Input should be a valid integer",
          type: "int_parsing",
        },
      ],
    })
    expect(error.fieldErrors).toHaveLength(1)
    expect(error.fieldErrors[0]?.loc).toEqual([
      "body",
      "purchase_details",
      "mortgage_years",
    ])
    expect(error.message).toBe("Input should be a valid integer")
  })

  it("falls back to a generic message", () => {
    expect(toApiError(500, null).message).toBe(
      "The API returned an error (500).",
    )
    expect(toApiError(500, null).isRetryable).toBe(true)
    expect(toApiError(404, { detail: "Not found" }).isRetryable).toBe(false)
  })
})

describe("request", () => {
  const response = (status: number) => new Response(null, { status })

  it("returns data on success", async () => {
    await expect(
      request(Promise.resolve({ data: { ok: true }, response: response(200) })),
    ).resolves.toEqual({ ok: true })
  })

  it("throws an ApiError for error bodies", async () => {
    await expect(
      request(
        Promise.resolve({
          error: { detail: "Property not found" },
          response: response(404),
        }),
      ),
    ).rejects.toMatchObject({ status: 404, message: "Property not found" })
  })

  it("throws a network ApiError when fetch rejects", async () => {
    const error = await request(Promise.reject(new TypeError("fetch failed")))
      .then(() => null)
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).isNetworkError).toBe(true)
  })
})
