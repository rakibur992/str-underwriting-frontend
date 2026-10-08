import { api } from "./client"
import { request } from "./errors"

export function getDashboard() {
  return request(api.GET("/api/dashboard"))
}
