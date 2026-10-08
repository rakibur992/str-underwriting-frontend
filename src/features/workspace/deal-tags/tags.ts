/** The 13 yes/no deal tags with their API field names (docs/spec/deal-tags.md). */
export const DEAL_TAGS = [
  { key: "turnkey", label: "Turnkey" },
  { key: "furnished", label: "Furnished" },
  { key: "luxury", label: "Luxury" },
  { key: "tax_efficient", label: "Tax efficient" },
  { key: "new_construction", label: "New construction" },
  { key: "existing_airbnb", label: "Existing Airbnb" },
  { key: "arv", label: "ARV" },
  { key: "high_cash_on_cash", label: "High cash-on-cash" },
  { key: "low_cash_on_cash", label: "Low cash-on-cash" },
  { key: "add_inground_pool", label: "Add in-ground pool" },
  { key: "waterfront", label: "Waterfront" },
  { key: "remote", label: "Remote" },
  { key: "can_support_cohost", label: "Can support co-host" },
] as const

export type DealTagKey = (typeof DEAL_TAGS)[number]["key"]
export type DealTagValues = Record<DealTagKey, boolean>
