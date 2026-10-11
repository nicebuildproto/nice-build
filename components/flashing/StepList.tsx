"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { FlashingModel } from "./model"
import { editSteps } from "./Onboarding"

/**
 * Vertical progress list: number or check, label, and what is chosen so far.
 * Steps already reached are clickable; the rest are muted. The current one is marked with aria-current.
 */
export function StepList({
  m,
  onPick,
  size = "md",
}: {
  m: FlashingModel
  onPick?: (index: number) => void
  size?: "md" | "lg"
}) {
  const last = editSteps.length - 1
  return (
    <ol aria-label="Progress" className="flex flex-col">
      {editSteps.map((item, index) => {
        const current = index === m.step
        const available = index <= m.reached
        const done = available && !current && index !== last
        const summary = available ? m.stepSummaries[index] : ""
        return (
          <li key={item.id} className="relative">
            {index < last ? (
              <span
                aria-hidden
                className={cn("absolute top-9 bottom-0 left-[19px] w-px", index < m.reached ? "bg-foreground/30" : "bg-border")}
              />
            ) : null}
            <button
              type="button"
              disabled={!available}
              aria-current={current ? "step" : undefined}
              onClick={() => {
                m.goTo(index)
                onPick?.(index)
              }}
              className={cn(
                "relative flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                size === "lg" ? "min-h-14" : "min-h-12",
                current && "bg-muted",
                available && !current && "hover:bg-muted/70 active:bg-muted",
                !available && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                  current
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-foreground/10 text-foreground"
                      : available
                        ? "border border-foreground/30 text-foreground"
                        : "border border-border bg-card text-muted-foreground"
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm",
                    current ? "font-semibold text-foreground" : available ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
                {summary ? <span className="block truncate text-xs text-muted-foreground">{summary}</span> : null}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
