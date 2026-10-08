import { api } from "./client"
import { request } from "./errors"

export function getSubmission(id: number) {
  return request(
    api.GET("/api/submissions/{submission_id}", {
      params: { path: { submission_id: id } },
    }),
  )
}

/** Every attempt (optionally for one property). Unsorted: sort client-side. */
export function listSubmissions(zpid?: string) {
  return request(
    api.GET("/api/submissions", {
      params: { query: zpid ? { zpid } : {} },
    }),
  )
}
