"use client"

import { injectContentsquareScript } from "@contentsquare/tag-sdk"
import { useEffect } from "react"

export function Contentsquare() {
  useEffect(() => {
    injectContentsquareScript({ clientId: "4ed851473413f" })
  }, [])
  return null
}
