import {
  CircleCheck,
  CircleDashed,
  Circle,
  type LucideIcon,
} from "lucide-react"

import type { TrainingStatus } from "@/api/types"
import { cn } from "@/lib/utils"

import { Badge } from "./badge"

export const STATUS_META: Record<
  TrainingStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  not_started: {
    label: "Not started",
    icon: Circle,
    className:
      "border-status-not-started/25 bg-status-not-started/8 text-status-not-started",
  },
  in_progress: {
    label: "In progress",
    icon: CircleDashed,
    className:
      "border-status-in-progress/25 bg-status-in-progress/10 text-status-in-progress",
  },
  submitted: {
    label: "Submitted",
    icon: CircleCheck,
    className:
      "border-status-submitted/25 bg-status-submitted/10 text-status-submitted",
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: TrainingStatus
  className?: string
}) {
  const { label, icon: Icon, className: tone } = STATUS_META[status]
  return (
    <Badge variant="outline" className={cn(tone, className)}>
      <Icon aria-hidden data-icon="inline-start" />
      {label}
    </Badge>
  )
}
