import { api } from "./client"
import { request } from "./errors"
import type { SaveUnderwritingPayload } from "./types"

/** Always creates a new draft. Callers must reuse `active_underwriting_id` when there is one. */
export function createUnderwriting(zpid: string) {
  return request(api.POST("/api/underwritings", { body: { zpid } }))
}

export function getUnderwriting(id: number) {
  return request(
    api.GET("/api/underwritings/{underwriting_id}", {
      params: { path: { underwriting_id: id } },
    }),
  )
}

/** Saves any subset of sections. Lists (optimization, OPEX) replace what is stored. */
export function saveUnderwriting(id: number, body: SaveUnderwritingPayload) {
  return request(
    api.PUT("/api/underwritings/{underwriting_id}", {
      params: { path: { underwriting_id: id } },
      body,
    }),
  )
}

/** Saves the body, grades the underwriting and returns the refreshed dashboard. */
export function submitUnderwriting(id: number, body: SaveUnderwritingPayload) {
  return request(
    api.POST("/api/underwritings/{underwriting_id}/submit", {
      params: { path: { underwriting_id: id } },
      body,
    }),
  )
}
