import { sectionOf } from "@/features/workspace/fields"

/** Workspace URL that opens the field's section and focuses it. */
export function fieldHref(id: number, path: string) {
  const params = new URLSearchParams({ section: sectionOf(path), field: path })
  return `/underwritings/${id}?${params}`
}

export function sectionHref(id: number, section: string) {
  return `/underwritings/${id}?section=${section}`
}
