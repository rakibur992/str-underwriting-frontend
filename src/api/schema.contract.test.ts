import { describe, expect, expectTypeOf, it } from "vitest"

import openapi from "./generated/openapi.json"
import type { components } from "./generated/schema"

// Every endpoint the frontend relies on (docs/api-contract.md).
const ROUTES: Record<string, string[]> = {
  "/api/dashboard": ["get"],
  "/api/markets/{market_id}": ["get"],
  "/api/properties/{zpid}": ["get"],
  "/api/underwritings": ["post"],
  "/api/underwritings/{underwriting_id}": ["get", "put"],
  "/api/underwritings/{underwriting_id}/submit": ["post"],
  "/api/submissions": ["get"],
  "/api/submissions/{submission_id}": ["get"],
}

describe("generated API contract", () => {
  const paths: Record<string, Record<string, unknown>> = openapi.paths

  it.each(Object.entries(ROUTES))("exposes %s", (route, methods) => {
    for (const method of methods) {
      expect(
        paths[route]?.[method],
        `${method.toUpperCase()} ${route}`,
      ).toBeDefined()
    }
  })

  it("types error responses as { detail: string }", () => {
    // Checked by `npm run typecheck`; documents the error shape.
    expectTypeOf<components["schemas"]["ErrorResponse"]>().toEqualTypeOf<{
      detail: string
    }>()
  })
})
