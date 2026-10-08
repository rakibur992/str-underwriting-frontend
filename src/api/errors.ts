/**
 * One error type for every API failure. FastAPI sends `detail` as a string
 * (403/404/500 and the missing-sections 422) or as an array of validation
 * errors (request-validation 422). See docs/api-contract.md.
 */

export interface FieldError {
  loc: (string | number)[]
  msg: string
}

export class ApiError extends Error {
  /** HTTP status, or 0 when the request never reached the API. */
  readonly status: number
  readonly fieldErrors: FieldError[]

  constructor(status: number, message: string, fieldErrors: FieldError[] = []) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.fieldErrors = fieldErrors
  }

  get isNetworkError() {
    return this.status === 0
  }

  /** Worth retrying automatically: the API was down or failed on its side. */
  get isRetryable() {
    return this.status === 0 || this.status >= 500
  }
}

function isFieldError(value: unknown): value is FieldError {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as FieldError).loc) &&
    typeof (value as FieldError).msg === "string"
  )
}

/** Turn an openapi-fetch error body into an ApiError. */
export function toApiError(status: number, body: unknown): ApiError {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === "string") return new ApiError(status, detail)
  if (Array.isArray(detail)) {
    const fieldErrors = detail.filter(isFieldError)
    const message = fieldErrors.map((e) => e.msg).join("; ")
    return new ApiError(
      status,
      message || "Some values are invalid.",
      fieldErrors,
    )
  }
  return new ApiError(status, `The API returned an error (${status}).`)
}

/** A fetch that threw (API down, CORS, offline). */
export function toNetworkError(cause: unknown): ApiError {
  const error = new ApiError(0, "Couldn't reach the training API.")
  error.cause = cause
  return error
}

/**
 * Unwrap an openapi-fetch call: return `data` or throw an ApiError.
 * Use inside query/mutation functions.
 */
export async function request<T>(
  call: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  let result: Awaited<typeof call>
  try {
    result = await call
  } catch (cause) {
    throw toNetworkError(cause)
  }
  if (result.error !== undefined || result.data === undefined) {
    throw toApiError(result.response.status, result.error)
  }
  return result.data
}

// Every query/mutation function throws ApiError (via `request`), so type it that way.
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError
  }
}
