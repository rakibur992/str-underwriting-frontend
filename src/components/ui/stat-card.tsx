import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import { Card, CardContent } from "./card"

/** A labelled headline number with optional supporting text or visual below it. */
export function StatCard({
  label,
  value,
  hint,
  children,
  className,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <Card size="sm" className={cn("gap-0", className)}>
      <CardContent className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {children}
      </CardContent>
    </Card>
  )
}
