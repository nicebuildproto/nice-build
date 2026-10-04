"use client"

import { Button } from "@/components/ui/button"
import { foldCount } from "@/lib/flashing/geometry"
import { formatPrice, type PriceResult } from "@/lib/flashing/pricing"
import type { Point } from "@/lib/flashing/geometry"
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
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-5 py-8 sm:px-8 sm:py-10">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--nb-primary)]">Review your flashing</h2>
          <p className="text-sm text-[var(--nb-secondary)]">Check your design and order details before continuing.</p>
        </header>

        <section className="flex flex-col gap-3">
          <h3 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
            Technical drawing
          </h3>
          <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white">
            <TechnicalDrawing points={points} taper={taper} taperLengths={taperLengths} info={info} />
          </div>
          <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => downloadDrawing()}>
            Download drawing
          </Button>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
            Your specification
          </h3>
          <dl className="divide-y divide-black/[0.06] rounded-xl border border-black/[0.08]">
            <SpecRow label="Profile" value={profileName} onEdit={() => onEdit("design")} />
            <SpecRow label="Length" value={`${pieceLengthMm.toLocaleString("en-AU")} mm`} onEdit={() => onEdit("length")} />
            <SpecRow label="Quantity" value={String(quantity)} onEdit={() => onEdit("length")} />
            <SpecRow label="Profile girth" value={`${Math.round(girthMm).toLocaleString("en-AU")} mm`} onEdit={() => onEdit("design")} />
            <SpecRow
              label="Folds"
              value={`${foldCount(points)}${taper ? " · tapered" : ""}`}
              onEdit={() => onEdit("design")}
            />
            <SpecRow label="Colour" value={colourLabel} onEdit={() => onEdit("material")} />
            <SpecRow label="Material" value={materialLabel} onEdit={() => onEdit("material")} />
            <SpecRow label="Item code" value={info.itemCode} />
          </dl>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
            Order summary
          </h3>
          <div className="flex flex-col gap-3 rounded-xl border border-black/[0.08] px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-[var(--nb-primary)]">{profileName}</p>
              <p className="text-sm text-[var(--nb-secondary)]">
                {quantity} × {pieceLengthMm.toLocaleString("en-AU")} mm
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-xs text-[var(--nb-secondary)]">Estimated total</span>
              <span
                className={`text-3xl font-semibold tracking-[-0.03em] tabular-nums text-[var(--nb-primary)] ${pending ? "opacity-40" : ""}`}
              >
                {formatPrice(price.total)}
              </span>
              <span className="text-xs text-[var(--nb-secondary)] tabular-nums">
                {formatPrice(price.perPiece)} each
              </span>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <Button type="button" variant="ghost" className="h-10" onClick={onRequestQuote}>
              Request a quote
            </Button>
            <Button type="button" variant="outline" className="h-10" onClick={onAddToCart}>
              Add to cart
            </Button>
            <Button type="button" className="h-10 sm:ml-auto" onClick={onOrderNow}>
              Order now
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

function SpecRow({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <dt className="text-xs text-[var(--nb-secondary)]">{label}</dt>
        <dd className="truncate text-sm text-[var(--nb-primary)]">{value}</dd>
      </div>
      {onEdit ? (
        <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={onEdit}>
          Edit
        </Button>
      ) : null}
    </div>
  )
}
