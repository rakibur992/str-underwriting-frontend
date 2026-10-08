import createClient from "openapi-fetch"

import type { paths } from "./generated/schema"

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

/** Typed client for the FastAPI backend (ADR-0003). Runs in the browser (ADR-0002). */
export const api = createClient<paths>({ baseUrl: API_BASE_URL })
