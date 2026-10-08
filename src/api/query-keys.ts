/** Every TanStack Query key in one place, so invalidation stays precise. */
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  underwriting: (id: number) => ["underwriting", id] as const,
  market: (id: number) => ["market", id] as const,
  submission: (id: number) => ["submission", id] as const,
  submissions: ["submissions"] as const,
}
