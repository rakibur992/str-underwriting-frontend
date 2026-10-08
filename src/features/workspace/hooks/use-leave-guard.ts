"use client"

import { useEffect } from "react"

/**
 * Asks before following an in-app link out of `basePath` while `active`.
 * Covers what `beforeunload` can't: client-side navigation (header, back links).
 * Runs in the capture phase, before Next's Link handles the click.
 */
export function useLeaveGuard(
  active: boolean,
  basePath: string,
  message: string,
) {
  useEffect(() => {
    if (!active) return
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest("a[href]")
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank")
        return
      const url = new URL(link.href, window.location.href)
      const staying =
        url.pathname === basePath || url.pathname.startsWith(`${basePath}/`)
      if (url.origin !== window.location.origin || staying) return
      if (!window.confirm(message)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [active, basePath, message])
}
