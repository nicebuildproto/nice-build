"use client"

import { stageFloat } from "@/components/stage/chrome"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export type StageTool = {
  id: string
  label: string
  icon: ReactNode
  pressed?: boolean
  disabled?: boolean
  onClick: () => void
}

export function StageToolbar({
  tools,
  className,
  surfaceClassName,
}: {
  tools: StageTool[]
  className?: string
  /** Replaces the shared surface. Omit it to keep the Data Visualisation toolbar. */
  surfaceClassName?: string
}) {
  if (tools.length === 0) return null
  return (
    <div
      className={cn(
        "pointer-events-auto flex flex-col gap-0.5 rounded-full p-1",
        surfaceClassName ?? stageFloat,
        className
      )}
    >
      {tools.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={tool.label}
                aria-pressed={tool.pressed}
                disabled={tool.disabled}
                onClick={tool.onClick}
                className={cn(tool.pressed && "bg-muted text-foreground")}
              />
            }
          >
            {tool.icon}
          </TooltipTrigger>
          <TooltipContent side="left">{tool.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
