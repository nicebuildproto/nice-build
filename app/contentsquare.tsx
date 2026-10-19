"use client"

import { injectContentsquareScript } from "@contentsquare/tag-sdk"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

// Session replay and heatmaps are not loaded on the Workshape product paths: people type free text and
// answer personal questions there, which should never be recorded. Links into the product from the rest
// of the site are full page loads, so the tag cannot have been injected earlier in the same visit.
const PRIVATE_PREFIXES = ["/how-i-work"]

export function Contentsquare() {
  const pathname = usePathname()
  const isPrivate = PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

  useEffect(() => {
    if (isPrivate) return
    injectContentsquareScript({ clientId: "4ed851473413f" })
  }, [isPrivate])
  return null
}
