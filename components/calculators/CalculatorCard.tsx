"use client"

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
  results,
  delay = 80,
}: {
  title: string
  description: string
  fields: CalculatorField[]
  results: { label: string; value: number | null; suffix?: string }[]
  delay?: number
}) {
  const id = useId()

  return (
    <Card
      className={`gap-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] [--card-spacing:--spacing(6)] ${reveal}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="gap-1.5">
        <CardTitle className="text-[15px] font-medium tracking-[-0.01em] text-[var(--nb-primary)]">
          {title}
        </CardTitle>
        <CardDescription className="text-[13px] text-[var(--nb-secondary)]">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-4">
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
                className={cn("h-10 text-base tabular-nums", field.suffix && "pr-8")}
              />
              {field.suffix ? (
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[var(--nb-secondary)]">
                  {field.suffix}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>

      <CardFooter className="flex-col items-start gap-4 bg-[var(--nb-accent)]/70 py-6">
        {results.map((result) => {
          const formatted = result.value === null ? null : formatResult(result.value)
          return (
            <div key={result.label} className="flex w-full flex-col gap-1">
              <span className="text-xs font-medium text-[var(--nb-secondary)]">{result.label}</span>
              <output
                aria-live="polite"
                className="flex h-14 items-baseline text-5xl leading-none font-semibold tracking-[-0.04em] text-[var(--nb-primary)] tabular-nums"
              >
                {formatted === null ? (
                  <span className="text-foreground/20">—</span>
                ) : (
                  <span
                    key={formatted}
                    className="animate-in fade-in zoom-in-[0.97] duration-200 ease-out motion-reduce:animate-none"
                  >
                    {formatted}
                    {result.suffix ? (
                      <span className="ml-0.5 text-3xl font-medium text-[var(--nb-secondary)]">
                        {result.suffix}
                      </span>
                    ) : null}
                  </span>
                )}
              </output>
            </div>
          )
        })}
      </CardFooter>
    </Card>
  )
}
