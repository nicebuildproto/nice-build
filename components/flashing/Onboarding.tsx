"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { templates, type FlashingTemplate } from "@/lib/flashing/templates"
import { cn } from "@/lib/utils"
import { ArrowLeft, Plus } from "lucide-react"
import { useState } from "react"
import { PIECE_LENGTH_MAX, PIECE_LENGTH_MIN } from "./PriceBar"
import { ProfileIcon } from "./ProfileShape"

export function LengthStep({
  initial,
  initialQuantity,
  submitLabel = "Continue",
  onBack,
  onSubmit,
}: {
  initial: number | null
  initialQuantity: number
  submitLabel?: string
  onBack?: () => void
  onSubmit: (lengthMm: number, quantity: number) => void
}) {
  const [text, setText] = useState(initial ? String(initial) : "")
  const [quantityText, setQuantityText] = useState(String(initialQuantity))
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const value = Math.round(Number(text))
    const quantity = Math.round(Number(quantityText))
    if (text.trim() === "" || !Number.isFinite(value)) {
      setError("Enter a length in millimetres.")
    } else if (value < PIECE_LENGTH_MIN || value > PIECE_LENGTH_MAX) {
      setError(`Pieces can be ${PIECE_LENGTH_MIN} to ${PIECE_LENGTH_MAX} mm long.`)
    } else if (quantityText.trim() === "" || !Number.isFinite(quantity) || quantity < 1 || quantity > 999) {
      setError("Enter a quantity from 1 to 999.")
    } else {
      onSubmit(value, quantity)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 items-stretch justify-center sm:items-center sm:px-6 sm:py-16">
      <form
        className="flex min-h-0 w-full flex-1 flex-col gap-6 sm:max-w-sm sm:flex-none"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-5 pt-6 sm:flex-none sm:overflow-visible sm:p-0">
        <div className="flex flex-col gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-fit items-center gap-1 text-sm text-[var(--nb-secondary)] transition-colors hover:text-[var(--nb-primary)]"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight">How long is this piece?</h1>
          <p className="text-sm text-[var(--nb-secondary)]">
            Choose the length for this design. Need another piece? You can add it later with a different
            design, length or quantity.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="flashing-piece-length" className="text-sm text-[var(--nb-secondary)]">
            Piece length
          </label>
          <span className="relative">
            <Input
              id="flashing-piece-length"
              type="text"
              inputMode="numeric"
              enterKeyHint="next"
              autoComplete="off"
              autoFocus
              placeholder="2400"
              aria-invalid={error !== null}
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setError(null)
              }}
              className="h-12 pr-14 text-base tabular-nums"
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-[var(--nb-secondary)]">
              mm
            </span>
          </span>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-[var(--nb-secondary)]">How many pieces?</span>
          <Input
            type="text"
            inputMode="numeric"
            enterKeyHint="done"
            autoComplete="off"
            aria-label="Quantity"
            value={quantityText}
            onChange={(event) => {
              setQuantityText(event.target.value)
              setError(null)
            }}
            className="h-12 w-28 text-base tabular-nums"
          />
        </label>
        </div>
        <div className="sticky bottom-0 border-t border-border bg-background px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:border-0 sm:bg-transparent sm:p-0">
          <Button type="submit" size="lg" className="h-12 w-full text-base sm:h-11">
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function TemplateStep({
  onBack,
  onChoose,
}: {
  onBack: () => void
  onChoose: (templateId: string | null) => void
}) {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-6 sm:gap-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-fit items-center gap-1 text-sm text-[var(--nb-secondary)] transition-colors hover:text-[var(--nb-primary)]"
        >
          <ArrowLeft className="size-4" /> Piece length
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Start from a shape</h1>
        <p className="text-sm text-[var(--nb-secondary)]">
          Every point stays editable. Pick the closest match, or start blank.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => onChoose(null)}
          className="flex min-h-44 flex-col justify-between gap-4 rounded-2xl border border-dashed border-border p-4 sm:min-h-48 sm:p-5 text-left transition-colors hover:border-foreground/40 hover:bg-[var(--nb-accent)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="flex h-11 items-center">
            <Plus className="size-6 text-[var(--nb-primary)]" strokeWidth={1.5} />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-sm font-medium">New design</span>
            <span className="text-sm text-[var(--nb-secondary)]">Start with a blank canvas.</span>
          </span>
        </button>
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} onChoose={() => onChoose(template.id)} />
        ))}
      </div>
    </div>
  )
}

function TemplateCard({ template, onChoose }: { template: FlashingTemplate; onChoose: () => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="group flex min-h-44 flex-col rounded-2xl sm:min-h-48 border border-border transition-colors hover:border-foreground/30">
      <button
        type="button"
        onClick={onChoose}
        className="flex flex-1 flex-col justify-between gap-4 rounded-t-2xl p-4 pb-3 text-left sm:p-5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <ProfileIcon points={template.points} className="h-11 w-[72px] text-[var(--nb-primary)]" />
        <span className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            {template.name}
            {template.alias ? (
              <span className="font-normal text-[var(--nb-secondary)]"> · {template.alias}</span>
            ) : null}
          </span>
          <span className="text-sm text-[var(--nb-secondary)]">
            {expanded ? template.detail : template.summary}
          </span>
        </span>
      </button>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className={cn(
          "mx-4 mb-2 flex h-11 w-fit items-center text-sm text-[var(--nb-secondary)] underline-offset-4 sm:mx-5 transition-colors hover:text-[var(--nb-primary)] hover:underline"
        )}
      >
        {expanded ? "Show less" : "Learn more"}
      </button>
    </div>
  )
}

export const editSteps = [
  { id: "design", label: "Profile" },
  { id: "taper", label: "Taper" },
  { id: "align", label: "Align" },
  { id: "material", label: "Material" },
  { id: "review", label: "Review" },
] as const

export type EditStepId = (typeof editSteps)[number]["id"]
