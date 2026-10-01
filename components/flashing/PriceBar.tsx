"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice, type PriceResult } from "@/lib/flashing/pricing"
import { cn } from "@/lib/utils"
import { useState, type ReactNode } from "react"
import { GirthReadout } from "./GirthReadout"
import { useAnimatedNumber } from "./hooks"

export const PIECE_LENGTH_MIN = 100
export const PIECE_LENGTH_MAX = 8000

export function PriceBar({
  review,
  pieceLengthMm,
  onPieceLengthChange,
  quantity,
  onQuantityChange,
  girthMm,
  folds,
  materialSummary,
  price,
  pending,
  onAddToCart,
  onRequestQuote,
}: {
  review: boolean
  pieceLengthMm: number
  onPieceLengthChange: (value: number) => void
  quantity: number
  onQuantityChange: (value: number) => void
  girthMm: number
  folds: number
  materialSummary: string
  price: PriceResult
  pending: boolean
  onAddToCart: () => void
  onRequestQuote: () => void
}) {
  const shown = useAnimatedNumber(review ? price.total : price.perPiece)

  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-black/[0.06] bg-white px-6 py-4">
      <NumberField
        label="Piece length"
        suffix="mm"
        value={pieceLengthMm}
        min={PIECE_LENGTH_MIN}
        max={PIECE_LENGTH_MAX}
        onChange={onPieceLengthChange}
      />
      {review ? (
        <NumberField label="Quantity" value={quantity} min={1} max={999} onChange={onQuantityChange} />
      ) : null}
      <Stat label="Total length of metal">
        <GirthReadout girthMm={girthMm} className="text-sm" />
      </Stat>
      <Stat label="Folds">
        <span className="text-sm tabular-nums">{folds}</span>
      </Stat>
      <Stat label="Material" className="min-w-0">
        <span className="block max-w-56 truncate text-sm">{materialSummary}</span>
      </Stat>

      <div className="ml-auto flex items-end gap-6">
        <div className="text-right">
          <span className="block text-xs text-[var(--nb-secondary)]">
            {review
              ? quantity > 1
                ? `Total · ${quantity} × ${formatPrice(price.perPiece)}`
                : "Total"
              : "Price per piece"}
          </span>
          <span
            className={cn(
              "block font-semibold tracking-tight tabular-nums transition-opacity duration-300",
              review ? "text-3xl" : "text-2xl",
              pending && "opacity-40"
            )}
            aria-live="polite"
          >
            {formatPrice(shown)}
          </span>
        </div>
        {review ? (
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={onRequestQuote}>
              Request quote
            </Button>
            <Button size="lg" onClick={onAddToCart}>
              Add to cart
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Stat({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1 pb-1.5", className)}>
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
          className={cn("h-9 tabular-nums", suffix ? "w-28 pr-10" : "w-20")}
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
