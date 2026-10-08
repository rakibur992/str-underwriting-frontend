import { CircleCheck, Radio } from "lucide-react"

import { Badge } from "@/components/ui/badge"

/** Says whether numbers are the API's saved results or a live preview of unsaved input. */
export function ResultsSourceBadge({ source }: { source: "api" | "preview" }) {
  return source === "api" ? (
    <Badge
      variant="outline"
      className="border-score-best/25 bg-score-best/10 text-score-best"
      title="Calculated and saved by the API"
    >
      <CircleCheck aria-hidden data-icon="inline-start" />
      Saved results
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-status-in-progress/25 bg-status-in-progress/10 text-status-in-progress"
      title="Calculated in your browser from what you've typed; the API's numbers replace it once saved"
    >
      <Radio aria-hidden data-icon="inline-start" />
      Live preview
    </Badge>
  )
}
