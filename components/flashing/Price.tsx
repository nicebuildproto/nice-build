"use client"

import { formatPrice, type PriceResult } from "@/lib/flashing/pricing"
import { cn } from "@/lib/utils"

/** The estimated total. The value cross-fades when it changes and dims while the price is recalculating. */
export function PriceValue({
  price,
  pending,
  className,
}: {
  price: PriceResult
  pending: boolean
  className?: string
}) {
  const text = formatPrice(price.total)
  return (
    <span
      key={text}
      aria-live="polite"
      className={cn(
        "block font-semibold tracking-tight tabular-nums transition-opacity duration-200 animate-in fade-in-0 motion-reduce:animate-none motion-reduce:transition-none",
        pending && "opacity-60",
        className
      )}
    >
      {text}
    </span>
  )
}

export function eachLabel(price: PriceResult, quantity: number) {
  return quantity > 1 ? `${formatPrice(price.perPiece)} each` : null
}
