"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPrice, type PriceResult } from "@/lib/flashing/pricing"
import { useId, useLayoutEffect, useRef, useState } from "react"
import { downloadDrawing, TechnicalDrawing, type DrawingInfo } from "./TechnicalDrawing"
import type { Point } from "@/lib/flashing/geometry"

type Fulfillment = "delivery" | "pickup"

export function OrderStep({
  points,
  taper,
  taperLengths,
  info,
  profileName,
  pieceLengthMm,
  quantity,
  materialSummary,
  price,
  onBack,
  onPlace,
}: {
  points: Point[]
  taper: Point[] | null
  taperLengths: (number | null)[]
  info: DrawingInfo
  profileName: string
  pieceLengthMm: number
  quantity: number
  materialSummary: string
  price: PriceResult
  onBack: () => void
  onPlace: () => void
}) {
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery")
  const [error, setError] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    headingRef.current?.focus({ preventScroll: true })
  }, [])
  const nameId = useId()
  const companyId = useId()
  const emailId = useId()
  const phoneId = useId()
  const addressId = useId()
  const suburbId = useId()
  const stateId = useId()
  const postcodeId = useId()

  return (
    <div className="flex-1">
      <form
        className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 pt-6 sm:gap-10 sm:px-8 sm:pt-10"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          const required = ["name", "email", "phone"]
          if (fulfillment === "delivery") required.push("address", "suburb", "state", "postcode")
          const missing = required.find((key) => !String(data.get(key) ?? "").trim())
          if (missing) {
            setError("Fill in the required fields to continue.")
            return
          }
          onPlace()
        }}
      >
        <header className="flex flex-col gap-2">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-semibold tracking-tight text-[var(--nb-primary)] outline-none"
          >
            Complete your order
          </h1>
          <p className="text-sm text-[var(--nb-secondary)]">This is a prototype. No payment will be taken.</p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">Delivery</h2>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Delivery or pickup">
            {(["delivery", "pickup"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={fulfillment === option}
                onClick={() => setFulfillment(option)}
                className={
                  fulfillment === option
                    ? "h-12 rounded-xl border border-[var(--nb-primary)] text-base sm:h-11 sm:text-sm"
                    : "h-12 rounded-xl border border-border text-base text-[var(--nb-secondary)] hover:border-foreground/30 sm:h-11 sm:text-sm"
                }
              >
                {option === "delivery" ? "Delivery" : "Pickup"}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">Your details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={nameId} name="name" label="Name" autoComplete="name" enterKeyHint="next" required />
            <Field id={companyId} name="company" label="Company" autoComplete="organization" enterKeyHint="next" />
            <Field id={emailId} name="email" label="Email" type="email" inputMode="email" autoComplete="email" enterKeyHint="next" required />
            <Field id={phoneId} name="phone" label="Phone" type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" required />
          </div>
        </section>

        {fulfillment === "delivery" ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
              Delivery details
            </h2>
            <Field id={addressId} name="address" label="Address" autoComplete="street-address" enterKeyHint="next" required />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id={suburbId} name="suburb" label="Suburb" autoComplete="address-level2" enterKeyHint="next" required />
              <Field id={stateId} name="state" label="State" autoComplete="address-level1" enterKeyHint="next" required />
              <Field id={postcodeId} name="postcode" label="Postcode" autoComplete="postal-code" inputMode="numeric" enterKeyHint="done" required />
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-4">
          <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">Order summary</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="max-h-56 overflow-hidden border-b border-border bg-white">
              <TechnicalDrawing points={points} taper={taper} taperLengths={taperLengths} info={info} />
            </div>
            <div className="flex flex-col gap-1 px-5 py-4">
              <p className="text-sm text-[var(--nb-primary)]">{profileName}</p>
              <p className="text-sm text-[var(--nb-secondary)]">
                {quantity} × {pieceLengthMm.toLocaleString("en-AU")} mm · {materialSummary}
              </p>
              <p className="mt-2 text-xs text-[var(--nb-secondary)]">Estimated total</p>
              <p className="text-3xl font-semibold tracking-[-0.03em] tabular-nums">{formatPrice(price.total)}</p>
            </div>
          </div>
        </section>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t border-border bg-background px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0 sm:pb-10">
          <Button type="button" variant="ghost" className="h-12 text-base sm:h-10 sm:text-sm" onClick={onBack}>
            Back
          </Button>
          <Button type="button" variant="outline" className="h-12 text-base sm:h-10 sm:text-sm" onClick={() => downloadDrawing()}>
            Download drawing
          </Button>
          <Button type="submit" className="h-12 text-base sm:ml-auto sm:h-10 sm:text-sm">
            Place order
          </Button>
        </div>
      </form>
    </div>
  )
}

export function ConfirmationStep({
  orderRef,
  points,
  taper,
  taperLengths,
  info,
  onBack,
}: {
  orderRef: string
  points: Point[]
  taper: Point[] | null
  taperLengths: (number | null)[]
  info: DrawingInfo
  onBack: () => void
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-6 sm:py-16">
      <div className="sr-only" aria-hidden>
        <TechnicalDrawing points={points} taper={taper} taperLengths={taperLengths} info={info} />
      </div>
      <div className="flex w-full max-w-lg flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--nb-primary)]">Order received</h1>
          <p className="text-[15px] leading-relaxed text-[var(--nb-secondary)]">
            Your order has been submitted. We’ll confirm the fabrication details with you shortly.
          </p>
          <p className="text-sm font-medium tabular-nums text-[var(--nb-primary)]">Order #{orderRef}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="h-10"
            onClick={() => downloadDrawing(`flashing-${orderRef}.svg`)}
          >
            Download specification
          </Button>
          <Button type="button" variant="outline" className="h-10" onClick={onBack}>
            Back to designer
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  inputMode,
  enterKeyHint,
  required,
}: {
  id: string
  name: string
  label: string
  type?: string
  autoComplete?: string
  inputMode?: "email" | "tel" | "numeric" | "text"
  enterKeyHint?: "next" | "done" | "go"
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} autoComplete={autoComplete} inputMode={inputMode} enterKeyHint={enterKeyHint} required={required} className="h-12 sm:h-10" />
    </div>
  )
}
