"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import { flashingFloat } from "./chrome"

export function IconButton({
  label,
  onClick,
  active,
  disabled,
  side = "bottom",
  shortcut,
  size = "md",
  className,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  side?: "top" | "bottom" | "left" | "right"
  /** Shown in the tooltip, for example "⌘Z". */
  shortcut?: string
  /** md is 36px (pointer), lg is 44px (touch). */
  size?: "md" | "lg"
  className?: string
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            aria-label={shortcut ? `${label} (${shortcut})` : label}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted",
              size === "md" ? "size-9 rounded-lg" : "size-11 rounded-xl [&_svg:not([class*='size-'])]:size-5",
              active && "bg-muted text-foreground",
              className
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>
        {label}
        {shortcut ? <kbd className="ml-2 rounded bg-background/15 px-1 text-xs tabular-nums">{shortcut}</kbd> : null}
      </TooltipContent>
    </Tooltip>
  )
}

export function ToolbarGroup({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(flashingFloat, "flex items-center gap-0.5 rounded-xl p-1", className)}>{children}</div>
}
