"use client"

import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { layer } from "./chrome"

export type SheetSnap = "peek" | "half" | "full"

/** Header height: grabber strip plus the 44px title row. Also the collapsed ("peek") height. */
export const SHEET_PEEK = 60

/**
 * Bottom sheet with snap points at about 50% and 90% of the available height.
 * Non-modal until it reaches full height; only then does a backdrop appear and the canvas stop taking input.
 * The sheet is laid out once at full height and slid with a transform, so it never animates layout.
 */
export function BottomSheet({
  open,
  snap,
  onSnapChange,
  onClose,
  peekable,
  title,
  subtitle,
  bottom,
  available,
  cap = 0.9,
  onVisibleChange,
  children,
}: {
  open: boolean
  snap: SheetSnap
  onSnapChange: (snap: SheetSnap) => void
  /** Collapse past the lowest snap point. */
  onClose: () => void
  /** Collapsing leaves a peek bar instead of closing. */
  peekable: boolean
  title: string
  subtitle?: string
  /** Distance from the stage bottom: the action bar's height. */
  bottom: number
  /** Height the sheet may use: stage minus top chrome minus action bar. */
  available: number
  /** Largest fraction of `available` the sheet may reach. */
  cap?: number
  /** Settled visible height, for fitting the drawing above the sheet. 0 when closed. */
  onVisibleChange: (height: number) => void
  children: ReactNode
}) {
  const fullH = Math.max(SHEET_PEEK + 160, Math.round(available * cap))
  // On short (landscape) screens half would be too small to use, so it matches the cap.
  const halfH = available < 360 ? fullH : Math.min(Math.round(available * Math.min(0.5, cap)), fullH)
  const heightFor = (value: SheetSnap) => (value === "peek" ? SHEET_PEEK : value === "half" ? halfH : fullH)
  const settled = heightFor(snap)

  const [dragH, setDragH] = useState<number | null>(null)
  const drag = useRef<{ startY: number; startH: number; moved: boolean } | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(open)

  useEffect(() => {
    onVisibleChange(open ? settled : 0)
  }, [open, settled, onVisibleChange])

  // Hand focus back to whatever opened the sheet.
  useEffect(() => {
    if (open && !wasOpen.current) {
      const active = document.activeElement
      returnFocus.current = active instanceof HTMLElement && active !== document.body ? active : null
    }
    if (!open && wasOpen.current) {
      const target = returnFocus.current
      returnFocus.current = null
      if (target && target.isConnected) requestAnimationFrame(() => target.focus({ preventScroll: true }))
    }
    wasOpen.current = open
  }, [open])

  const visible = dragH ?? settled
  const collapse = () => (peekable ? onSnapChange("peek") : onClose())
  const full = open && snap === "full" && dragH === null

  const finishDrag = (height: number) => {
    const options: { h: number; snap: SheetSnap | "close" }[] = [
      peekable ? { h: SHEET_PEEK, snap: "peek" } : { h: 0, snap: "close" },
      { h: halfH, snap: "half" },
      { h: fullH, snap: "full" },
    ]
    const nearest = options.reduce((best, option) => (Math.abs(option.h - height) < Math.abs(best.h - height) ? option : best))
    if (nearest.snap === "close") onClose()
    else onSnapChange(nearest.snap)
  }

  return (
    <>
      {full ? (
        <div
          aria-hidden
          className={cn("absolute inset-0 bg-foreground/30", layer.overlay)}
          onPointerDown={() => onSnapChange("half")}
        />
      ) : null}
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 overflow-hidden", layer.sheet)} style={{ bottom }}>
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal={full}
        aria-label={title}
        aria-hidden={!open}
        inert={!open}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation()
            collapse()
          }
        }}
        className={cn(
          "pointer-events-auto absolute inset-x-0 bottom-0 mx-auto flex w-full flex-col rounded-t-2xl border border-b-0 border-border bg-card text-card-foreground shadow-[0_-8px_24px_-12px_rgba(24,24,27,0.25)] sm:max-w-[560px]",
          dragH === null && "transition-transform duration-200 ease-out motion-reduce:transition-none"
        )}
        style={{
          height: fullH,
          transform: `translateY(${open ? fullH - visible : fullH + 16}px)`,
          willChange: "transform",
        }}
      >
        <div
          className="flex shrink-0 touch-none flex-col select-none"
          style={{ height: SHEET_PEEK }}
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("button[data-sheet-action]")) return
            event.currentTarget.setPointerCapture(event.pointerId)
            drag.current = { startY: event.clientY, startH: settled, moved: false }
          }}
          onPointerMove={(event) => {
            const active = drag.current
            if (!active) return
            const dy = active.startY - event.clientY
            if (!active.moved && Math.abs(dy) < 6) return
            active.moved = true
            setDragH(Math.min(fullH, Math.max(peekable ? SHEET_PEEK : 0, active.startH + dy)))
          }}
          onPointerUp={(event) => {
            const active = drag.current
            drag.current = null
            if (!active) return
            if (active.moved) {
              const height = Math.min(fullH, Math.max(0, active.startH + (active.startY - event.clientY)))
              setDragH(null)
              finishDrag(height)
            } else if (peekable && snap === "peek") {
              onSnapChange("half")
            } else {
              collapse()
            }
          }}
          onPointerCancel={() => {
            drag.current = null
            setDragH(null)
          }}
        >
          <div className="flex h-4 items-center justify-center" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-foreground/25" />
          </div>
          <div className="flex h-11 items-center gap-2 px-4">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base leading-5 font-semibold">{title}</h2>
              {subtitle && snap === "peek" ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
            </div>
            {peekable && snap === "peek" ? (
              <button
                type="button"
                data-sheet-action
                aria-label={`Open ${title}`}
                onClick={() => onSnapChange("half")}
                className="flex size-11 items-center justify-center rounded-xl text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ChevronUp className="size-5" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                data-sheet-action
                onClick={collapse}
                className="flex h-11 items-center gap-1 rounded-xl px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
              >
                Done <ChevronDown className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 [scrollbar-width:thin]"
          style={{ paddingBottom: Math.max(0, fullH - visible) + 16 }}
          onFocusCapture={(event) => {
            const target = event.target as HTMLElement
            if (target.matches("input, textarea, select")) {
              window.setTimeout(() => target.scrollIntoView({ block: "center", behavior: "smooth" }), 300)
            }
          }}
        >
          {children}
        </div>
      </div>
      </div>
    </>
  )
}
