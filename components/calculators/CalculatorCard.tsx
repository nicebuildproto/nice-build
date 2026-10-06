"use client"

import { CalculatorActions, CalculatorPresets } from "@/components/calculators/CalculatorResult"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatResult } from "@/lib/calculators/usePercentage"
import { cn } from "@/lib/utils"
import { useId } from "react"

const reveal =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 ease-out motion-reduce:animate-none"

export interface CalculatorField {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  suffix?: string
}

export function CalculatorCard({
  title,
  description,
  fields,
  primary,
  secondary = [],
  context,
  formula,
  copyText,
  onReset,
  share,
  presets,
  delay = 80,
}: {
  title: string
  description: string
  fields: CalculatorField[]
  primary: { label: string; value: number | string | null; suffix?: string; money?: boolean }
  secondary?: { label: string; value: number | string | null; suffix?: string }[]
  context?: string
  formula?: string
  copyText?: string
  onReset?: () => void
  share?: boolean
  presets?: { label: string; values: { label: string; value: string }[]; current?: string; onSelect: (value: string) => void }
  delay?: number
}) {
  const id = useId()
  const formattedPrimary = formatDisplay(primary.value, primary.suffix)

  return (
    <Card
      className={`gap-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] [--card-spacing:--spacing(6)] ${reveal}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="gap-1.5">
        <CardTitle className="text-[15px] font-medium tracking-[-0.01em] text-[var(--nb-primary)]">{title}</CardTitle>
        <CardDescription className="text-[13px] text-[var(--nb-secondary)]">{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field, index) => (
            <div key={field.label} className="flex flex-col gap-2">
              <Label htmlFor={`${id}-${index}`} className="text-[13px] text-[var(--nb-primary)]">
                {field.label}
              </Label>
              <div className="relative">
                <Input
                  id={`${id}-${index}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  className={cn("h-11 text-base tabular-nums sm:h-10", field.suffix && "pr-10")}
                />
                {field.suffix ? (
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[var(--nb-secondary)]">
                    {field.suffix}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {presets ? <CalculatorPresets {...presets} /> : null}
      </CardContent>

      <CardFooter className="flex-col items-start gap-5 bg-[var(--nb-accent)]/70 py-6">
        <div className="flex w-full flex-col gap-1">
          <span className="text-xs font-medium text-[var(--nb-secondary)]">{primary.label}</span>
          <output
            aria-live="polite"
            className="flex min-h-12 items-baseline text-3xl leading-none font-semibold tracking-[-0.04em] break-all text-[var(--nb-primary)] tabular-nums sm:text-5xl"
          >
            {formattedPrimary === null ? (
              <span className="text-foreground/20">—</span>
            ) : (
              <span key={formattedPrimary} className="animate-in fade-in duration-200 ease-out motion-reduce:animate-none">
                {formattedPrimary}
              </span>
            )}
          </output>
          {context ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">{context}</p> : null}
          {formula ? <p className="mt-1 font-mono text-[13px] text-[var(--nb-secondary)]">{formula}</p> : null}
        </div>
        {secondary.length ? (
          <div className="flex w-full flex-wrap gap-x-8 gap-y-3">
            {secondary.map((item) => {
              const formatted = formatDisplay(item.value, item.suffix)
              return (
                <div key={item.label} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[var(--nb-secondary)]">{item.label}</span>
                  <span className="text-lg font-semibold tracking-[-0.03em] text-[var(--nb-primary)] tabular-nums">
                    {formatted ?? "—"}
                  </span>
                </div>
              )
            })}
          </div>
        ) : null}
        {copyText || onReset || share ? (
          <CalculatorActions copyText={copyText ?? undefined} onReset={onReset} share={share} />
        ) : null}
      </CardFooter>
    </Card>
  )
}

function formatDisplay(value: number | string | null, suffix?: string) {
  if (value === null || value === "") return null
  if (typeof value === "string") return suffix ? `${value}${suffix}` : value
  return `${formatResult(value)}${suffix ?? ""}`
}
