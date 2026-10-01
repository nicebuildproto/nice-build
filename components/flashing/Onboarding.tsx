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
  onSubmit,
}: {
  initial: number | null
  onSubmit: (lengthMm: number) => void
}) {
  const [text, setText] = useState(initial ? String(initial) : "")
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const value = Math.round(Number(text))
    if (text.trim() === "" || !Number.isFinite(value)) {
      setError("Enter a length in millimetres.")
    } else if (value < PIECE_LENGTH_MIN || value > PIECE_LENGTH_MAX) {
      setError(`Pieces can be ${PIECE_LENGTH_MIN} to ${PIECE_LENGTH_MAX} mm long.`)
    } else {
      onSubmit(value)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <form
        className="flex w-full max-w-sm flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">How long is each piece?</h1>
          <p className="text-sm text-[var(--nb-secondary)]">You can change this later.</p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="relative">
            <Input
              type="text"
              inputMode="numeric"
              autoFocus
              placeholder="2400"
              aria-label="Piece length in millimetres"
              aria-invalid={error !== null}
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setError(null)
              }}
              className="h-12 pr-14 text-lg tabular-nums"
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-[var(--nb-secondary)]">
              mm
            </span>
          </span>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <Button type="submit" size="lg" className="h-11">
          Continue
        </Button>
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
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex w-fit items-center gap-1 text-sm text-[var(--nb-secondary)] transition-colors hover:text-[var(--nb-primary)]"
        >
          <ArrowLeft className="size-3.5" /> Piece length
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">Start from a shape</h1>
        <p className="text-sm text-[var(--nb-secondary)]">
          Every point stays editable. Pick the closest match, or start blank.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => onChoose(null)}
          className="flex min-h-48 flex-col justify-between gap-4 rounded-2xl border border-dashed border-black/15 p-5 text-left transition-colors hover:border-black/40 hover:bg-[var(--nb-accent)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
    <div className="group flex min-h-48 flex-col rounded-2xl border border-black/[0.08] transition-colors hover:border-black/30">
      <button
        type="button"
        onClick={onChoose}
        className="flex flex-1 flex-col justify-between gap-4 rounded-t-2xl p-5 pb-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
          "mx-5 mb-4 w-fit text-xs text-[var(--nb-secondary)] underline-offset-4 transition-colors hover:text-[var(--nb-primary)] hover:underline"
        )}
      >
        {expanded ? "Show less" : "Learn more"}
      </button>
    </div>
  )
}

export const editSteps = [
  { id: "design", label: "Design" },
  { id: "taper", label: "Taper" },
  { id: "align", label: "Align" },
  { id: "material", label: "Material" },
  { id: "review", label: "Review" },
] as const

export type EditStepId = (typeof editSteps)[number]["id"]

export function StepIndicator({
  current,
  reached,
  onSelect,
}: {
  current: number
  reached: number
  onSelect: (index: number) => void
}) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto">
      {editSteps.map((step, index) => {
        const active = index === current
        const available = index <= reached
        return (
          <li key={step.id} className="flex items-center gap-1">
            {index > 0 ? (
              <span className={cn("h-px w-4 sm:w-6", index <= reached ? "bg-black/30" : "bg-black/10")} />
            ) : null}
            <button
              type="button"
              disabled={!available}
              aria-current={active ? "step" : undefined}
              onClick={() => onSelect(index)}
              className={cn(
                "flex items-center gap-2 rounded-full px-2.5 py-1 text-sm transition-colors",
                active && "bg-[var(--nb-primary)] text-white",
                !active && available && "text-[var(--nb-primary)] hover:bg-[var(--nb-accent)]",
                !available && "cursor-default text-black/30"
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[11px] tabular-nums",
                  active ? "bg-white/15" : available ? "bg-black/[0.06]" : "bg-black/[0.03]"
                )}
              >
                {index + 1}
              </span>
              {step.label}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
