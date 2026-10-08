import { api } from "./client"
import { request } from "./errors"

export function getMarket(id: number) {
  return request(
    api.GET("/api/markets/{market_id}", {
      params: { path: { market_id: id } },
    }),
  )
}
