"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export function IconButton({
  label,
  onClick,
  active,
  disabled,
  side = "bottom",
  className,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
  side?: "top" | "bottom" | "left" | "right"
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
            size="icon-sm"
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "text-[var(--nb-secondary)] hover:text-[var(--nb-primary)]",
              active && "bg-[var(--nb-accent)] text-[var(--nb-primary)]",
              className
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}

export function ToolbarGroup({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-xl border border-black/[0.06] bg-white/95 p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  )
}
