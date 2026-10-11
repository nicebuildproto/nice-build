"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Minus, Plus } from "lucide-react"
import { useId, useState } from "react"

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Labelled number field with a unit suffix and +/- steppers.
 * Arrow keys step by 1, Shift+arrow by 10. Commits on Enter, blur and stepper clicks.
 * Text of 16px or more on touch sizes so iOS never zooms on focus.
 */
export function NumberField({
  label,
  value,
  onCommit,
  min,
  max,
  unit,
  decimals = 0,
  size = "md",
  hideLabel = false,
  steppers = true,
  autoFocus = false,
  live = false,
  floatError = false,
  labelClassName,
  inputClassName,
  className,
}: {
  label: string
  value: number
  onCommit: (value: number) => void
  min: number
  max: number
  unit?: string
  decimals?: number
  /** md is 40px, lg is 48px. */
  size?: "md" | "lg"
  hideLabel?: boolean
  steppers?: boolean
  autoFocus?: boolean
  /** Commit as soon as the typed value is valid (header fields). Otherwise on Enter, blur and steppers. */
  live?: boolean
  /** Show the error in a small popover under the field instead of growing the layout. */
  floatError?: boolean
  labelClassName?: string
  inputClassName?: string
  className?: string
}) {
  const id = useId()
  const errorId = useId()
  const format = (n: number) => String(Math.round(n * 10 ** decimals) / 10 ** decimals)
  const [text, setText] = useState(format(value))
  const [synced, setSynced] = useState(value)
  const [error, setError] = useState<string | null>(null)
  if (value !== synced) {
    setSynced(value)
    setText(format(value))
    setError(null)
  }

  const range = `${format(min)} to ${format(max)}${unit ? ` ${unit}` : ""}`

  const commitText = (raw: string) => {
    const next = Number(raw)
    if (raw.trim() === "" || !Number.isFinite(next) || next < min || next > max) {
      setError(`Enter ${range}.`)
      return false
    }
    setError(null)
    if (Math.abs(next - value) > 1e-6) onCommit(next)
    return true
  }

  const nudge = (delta: number) => {
    const base = Number(text)
    const current = Number.isFinite(base) && text.trim() !== "" ? base : value
    const next = clamp(Math.round((current + delta) * 10 ** decimals) / 10 ** decimals, min, max)
    setText(format(next))
    setError(null)
    if (Math.abs(next - value) > 1e-6) onCommit(next)
  }

  const box = size === "lg" ? "h-12" : "h-10"
  const stepBtn = cn(
    "flex shrink-0 items-center justify-center rounded-lg border border-input bg-card text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted disabled:pointer-events-none disabled:opacity-50",
    size === "lg" ? "size-12" : "size-10"
  )

  return (
    <div className={cn("relative flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={id} className={cn("text-sm text-muted-foreground", hideLabel && "sr-only", labelClassName)}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        {steppers ? (
          <button
            type="button"
            aria-label={`Decrease ${label}`}
            className={stepBtn}
            disabled={value <= min}
            onClick={() => nudge(-1)}
          >
            <Minus className="size-4" />
          </button>
        ) : null}
        <span className="relative min-w-0 flex-1">
          <Input
            id={id}
            type="text"
            inputMode={decimals > 0 ? "decimal" : "numeric"}
            enterKeyHint="done"
            autoComplete="off"
            autoFocus={autoFocus}
            value={text}
            aria-invalid={error !== null}
            aria-describedby={error ? errorId : undefined}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              setText(event.target.value)
              setError(null)
              if (live) {
                const next = Number(event.target.value)
                if (event.target.value.trim() !== "" && Number.isFinite(next) && next >= min && next <= max && Math.abs(next - value) > 1e-6) {
                  setSynced(next)
                  onCommit(next)
                }
              }
            }}
            onBlur={() => {
              if (!commitText(text)) setText(format(value))
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                if (commitText(text)) event.currentTarget.blur()
              } else if (event.key === "Escape") {
                event.stopPropagation()
                setText(format(value))
                setError(null)
                event.currentTarget.blur()
              } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault()
                nudge((event.key === "ArrowUp" ? 1 : -1) * (event.shiftKey ? 10 : 1))
              }
            }}
            className={cn(
              "w-full text-base tabular-nums md:text-sm",
              box,
              unit ? "pr-10" : "",
              size === "lg" && "md:text-base",
              inputClassName
            )}
          />
          {unit ? (
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </span>
        {steppers ? (
          <button
            type="button"
            aria-label={`Increase ${label}`}
            className={stepBtn}
            disabled={value >= max}
            onClick={() => nudge(1)}
          >
            <Plus className="size-4" />
          </button>
        ) : null}
      </div>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className={cn(
            "text-xs text-destructive",
            floatError && "absolute top-full left-0 z-40 mt-1 rounded-md border border-border bg-card px-2 py-1 whitespace-nowrap shadow-sm"
          )}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
