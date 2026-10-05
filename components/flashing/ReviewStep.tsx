"use client"

import { Button } from "@/components/ui/button"
import { foldCount } from "@/lib/flashing/geometry"
import { formatPrice, type PriceResult } from "@/lib/flashing/pricing"
import type { Point } from "@/lib/flashing/geometry"
import type { ReactNode } from "react"
import { downloadDrawing, TechnicalDrawing, type DrawingInfo } from "./TechnicalDrawing"

export function ReviewStep({
  points,
  taper,
  taperLengths,
  info,
  profileName,
  pieceLengthMm,
  quantity,
  girthMm,
  materialLabel,
  colourLabel,
  price,
  pending,
  onEdit,
  onRequestQuote,
  onAddToCart,
  onOrderNow,
}: {
  points: Point[]
  taper: Point[] | null
  taperLengths: (number | null)[]
  info: DrawingInfo
  profileName: string
  pieceLengthMm: number
  quantity: number
  girthMm: number
  materialLabel: string
  colourLabel: string
  price: PriceResult
  pending: boolean
  onEdit: (step: "length" | "design" | "material") => void
  onRequestQuote: () => void
  onAddToCart: () => void
  onOrderNow: () => void
}) {
  const lengthLabel = `${pieceLengthMm.toLocaleString("en-AU")} mm`
  const girthLabel = `${Math.round(girthMm).toLocaleString("en-AU")} mm`
  const foldsLabel = `${foldCount(points)}${taper ? " · tapered" : ""}`

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-[76rem] items-start gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-x-12 lg:px-8 lg:py-8">
          <header className="flex flex-col gap-2 lg:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--nb-primary)]">Review your flashing</h2>
            <p className="max-w-xl text-sm text-[var(--nb-secondary)]">
              Check your design and order details before continuing.
            </p>
          </header>

          <section className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
                Technical drawing
              </h3>
              <Button type="button" variant="outline" className="h-9" onClick={() => downloadDrawing()}>
                Download drawing
              </Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white dark:border-white/10">
              <TechnicalDrawing points={points} taper={taper} taperLengths={taperLengths} info={info} />
            </div>
          </section>

          <section className="flex min-w-0 flex-col gap-5">
            <h3 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
              Your specification
            </h3>
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-1">
              <SpecGroup title="Profile">
                <SpecRow label="Profile" value={profileName} onEdit={() => onEdit("design")} />
                <SpecRow label="Profile girth" value={girthLabel} onEdit={() => onEdit("design")} />
                <SpecRow label="Folds" value={foldsLabel} onEdit={() => onEdit("design")} />
              </SpecGroup>
              <SpecGroup title="Pieces">
                <SpecRow label="Length" value={lengthLabel} onEdit={() => onEdit("length")} />
                <SpecRow label="Quantity" value={String(quantity)} onEdit={() => onEdit("length")} />
              </SpecGroup>
              <SpecGroup title="Finish" className="sm:col-span-2 lg:col-span-1">
                <SpecRow label="Colour" value={colourLabel} onEdit={() => onEdit("material")} />
                <SpecRow label="Material" value={materialLabel} onEdit={() => onEdit("material")} />
                <SpecRow label="Item code" value={info.itemCode} mono />
              </SpecGroup>
            </div>
          </section>
        </div>
      </div>

      <footer className="shrink-0 border-t border-black/[0.08] bg-background dark:border-white/10" aria-label="Order summary">
        <div className="mx-auto flex w-full max-w-[76rem] flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-8">
            <div className="min-w-0">
              <h3 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
                Order summary
              </h3>
              <p className="mt-1 truncate text-sm text-[var(--nb-primary)]">{profileName}</p>
              <p className="text-sm text-[var(--nb-secondary)]">
                {quantity} × {lengthLabel}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--nb-secondary)]">Estimated total</p>
              <p
                className={`text-3xl font-semibold tracking-[-0.03em] tabular-nums text-[var(--nb-primary)] ${pending ? "opacity-40" : ""}`}
                aria-live="polite"
              >
                {formatPrice(price.total)}
              </p>
              <p className="text-xs text-[var(--nb-secondary)] tabular-nums">{formatPrice(price.perPiece)} each</p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <Button type="button" variant="ghost" className="h-11" onClick={onRequestQuote}>
              Request a quote
            </Button>
            <Button type="button" variant="outline" className="h-11" onClick={onAddToCart}>
              Add to cart
            </Button>
            <Button type="button" className="h-11" onClick={onOrderNow}>
              Order now
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}

function SpecGroup({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <h4 className="mb-2 text-xs font-medium text-[var(--nb-primary)]">{title}</h4>
      <dl className="divide-y divide-black/[0.06] border-t border-black/[0.08] dark:divide-white/10 dark:border-white/10">
        {children}
      </dl>
    </div>
  )
}

function SpecRow({
  label,
  value,
  mono,
  onEdit,
}: {
  label: string
  value: string
  mono?: boolean
  onEdit?: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <dt className="text-xs text-[var(--nb-secondary)]">{label}</dt>
        <dd className={`text-sm break-words text-[var(--nb-primary)] ${mono ? "font-mono text-[13px] leading-5" : ""}`}>
          {value}
        </dd>
      </div>
      {onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0"
          aria-label={`Edit ${label}`}
          onClick={onEdit}
        >
          Edit
        </Button>
      ) : null}
    </div>
  )
}
