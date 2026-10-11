"use client"

import { Button } from "@/components/ui/button"
import type { RefObject } from "react"
import type { FlashingModel } from "./model"
import type { ViewportControls } from "./Viewport"

export type MobileInset = { top: number; bottom: number }

// Placeholder until Phase B: a bare action bar.
export function MobileChrome({
  m,
}: {
  m: FlashingModel
  controlsRef: RefObject<ViewportControls | null>
  panOn: boolean
  onInsetChange: (inset: MobileInset) => void
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex gap-2 border-t border-border bg-card p-3">
      <Button type="button" variant="ghost" className="h-12" onClick={m.onBack}>
        Back
      </Button>
      <Button type="button" className="h-12 flex-1" disabled={m.blocked !== null} onClick={m.onContinue}>
        {m.continueLabel}
      </Button>
    </div>
  )
}
