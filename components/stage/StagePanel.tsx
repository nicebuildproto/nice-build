"use client"

import { stageFloat } from "@/components/stage/chrome"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ReactNode } from "react"

const motion = "transition-[width,top,right,bottom,left] duration-200 ease-out motion-reduce:transition-none"

export function StagePanel({
  id,
  title,
  icon,
  open,
  onToggle,
  side,
  width,
  top,
  bottom,
  children,
}: {
  id: string
  title: string
  icon: ReactNode
  open: boolean
  onToggle: () => void
  side: "left" | "right"
  width: number
  top: number
  bottom: number
  children: ReactNode
}) {
  return (
    <div
      id={id}
      className={cn(
        "pointer-events-auto absolute z-20 hidden overflow-hidden rounded-2xl lg:flex lg:flex-col",
        stageFloat,
        motion
      )}
      style={{
        width: open ? width : 40,
        top,
        bottom,
        [side]: 16,
      }}
    >
      {open ? (
        <>
          <div className="flex items-center justify-between gap-2 px-4 pt-4">
            <p className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">{title}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-expanded={open}
              aria-controls={id}
              aria-label={`Collapse ${title}`}
              onClick={onToggle}
            >
              {side === "left" ? <ChevronLeft /> : <ChevronRight />}
            </Button>
          </div>
          <div id={`${id}-body`} className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-4">
            <div className="flex flex-col gap-3">{children}</div>
          </div>
        </>
      ) : (
        <button
          type="button"
          className="flex h-full w-full flex-col items-center gap-3 py-3 text-[var(--nb-secondary)] outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-expanded={false}
          aria-controls={id}
          onClick={onToggle}
        >
          <span aria-hidden className="[&_svg]:size-4">
            {icon}
          </span>
          <span className="text-[11px] font-medium tracking-[0.14em] uppercase [writing-mode:vertical-rl]">
            {title}
          </span>
        </button>
      )}
    </div>
  )
}
