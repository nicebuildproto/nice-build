"use client"

import { Input } from "@/components/ui/input"
import { formatPrice, type PriceResult } from "@/lib/flashing/pricing"
import { cn } from "@/lib/utils"
import { useState, type ReactNode } from "react"
import { GirthReadout } from "./GirthReadout"
import { useAnimatedNumber } from "./hooks"

export const PIECE_LENGTH_MIN = 100
export const PIECE_LENGTH_MAX = 8000

export function PriceBar({
  pieceLengthMm,
  onPieceLengthChange,
  quantity,
  onQuantityChange,
  girthMm,
  folds,
  materialSummary,
  price,
  pending,
}: {
  pieceLengthMm: number
  onPieceLengthChange: (value: number) => void
  quantity: number
  onQuantityChange: (value: number) => void
  girthMm: number
  folds: number
  materialSummary: string
  price: PriceResult
  pending: boolean
}) {
  const metres = pieceLengthMm / 1000
  const perMetre = metres > 0 ? price.perPiece / metres : null
  const shown = useAnimatedNumber(price.total)

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="order-2 flex flex-wrap items-end gap-x-5 gap-y-2 lg:order-1">
        <NumberField
          label="Piece length"
          suffix="mm"
          value={pieceLengthMm}
          min={PIECE_LENGTH_MIN}
          max={PIECE_LENGTH_MAX}
          onChange={onPieceLengthChange}
        />
        <NumberField label="Quantity" value={quantity} min={1} max={999} onChange={onQuantityChange} />
        <Stat label="Profile girth">
          <GirthReadout girthMm={girthMm} className="text-[13px]" />
        </Stat>
        <Stat label="Folds">
          <span className="text-[13px] tabular-nums">{folds}</span>
        </Stat>
        <Stat label="Material" className="min-w-0">
          <span className="block max-w-44 truncate text-[13px]" title={materialSummary}>
            {materialSummary}
          </span>
        </Stat>
      </div>
      <div className="order-1 flex flex-col lg:order-2 lg:items-end">
        <span className="text-xs text-[var(--nb-secondary)]">Estimated total</span>
        <span
          className={cn(
            "text-[1.75rem] leading-none font-semibold tracking-[-0.03em] tabular-nums text-[var(--nb-primary)] transition-opacity duration-300",
            pending && "opacity-40"
          )}
          aria-live="polite"
        >
          {formatPrice(shown)}
        </span>
        <span className="mt-1 text-xs text-[var(--nb-secondary)] tabular-nums">
          {perMetre === null
            ? "—"
            : `${formatPrice(perMetre)} / m${quantity > 1 ? ` · ${formatPrice(price.perPiece)} each` : ""}`}
        </span>
      </div>
    </div>
  )
}

function Stat({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-xs text-[var(--nb-secondary)]">{label}</span>
      {children}
    </div>
  )
}

function NumberField({
  label,
  suffix,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  suffix?: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  const [text, setText] = useState(String(value))
  const [synced, setSynced] = useState(value)

  if (value !== synced) {
    setSynced(value)
    setText(String(value))
  }

  const parse = (raw: string) => {
    const next = Math.round(Number(raw))
    return raw.trim() !== "" && Number.isFinite(next) && next >= min && next <= max ? next : null
  }
  const invalid = parse(text) === null

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-[var(--nb-secondary)]">{label}</span>
      <span className="relative">
        <Input
          type="text"
          inputMode="numeric"
          value={text}
          aria-invalid={invalid}
          onChange={(event) => {
            setText(event.target.value)
            const next = parse(event.target.value)
            if (next !== null && next !== value) {
              setSynced(next)
              onChange(next)
            }
          }}
          onBlur={() => setText(String(value))}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
          }}
          className={cn("h-8 tabular-nums", suffix ? "w-24 pr-9" : "w-16")}
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-[var(--nb-secondary)]">
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  )
}
