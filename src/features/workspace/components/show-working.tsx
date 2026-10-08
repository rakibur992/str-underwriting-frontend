import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"

/** "How is this calculated?" disclosure: the formula with the trainee's own numbers. */
export function ShowWorking({
  label = "How is this calculated?",
  children,
}: {
  label?: string
  children: ReactNode
}) {
  return (
    <details className="group text-xs">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden
          className="size-3 transition-transform group-open:rotate-90"
        />
        {label}
      </summary>
      <div className="mt-1.5 rounded-md bg-muted/60 p-2 leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  )
}
