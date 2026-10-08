import { Building2 } from "lucide-react"
import Link from "next/link"

/** Top bar on every screen. Later screens add a context bar below it (docs/design-system.md). */
export function AppHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Building2 aria-hidden className="size-4 text-primary" />
          STR Underwriting Training
        </Link>
        <nav aria-label="Main">
          <Link
            href="/"
            className="rounded-md px-2 py-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  )
}
