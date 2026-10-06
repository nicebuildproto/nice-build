"use client"

import { CopyButton, ResetButton } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, Link2 } from "lucide-react"
import { useState } from "react"

export function CalculatorResult({
  primary,
  context,
  secondary,
  formula,
  note,
  copyText,
  onReset,
  share,
  empty,
}: {
  primary?: { label: string; value: string }
  context?: string
  secondary?: { label: string; value: string }[]
  formula?: string
  note?: string
  copyText?: string
  onReset?: () => void
  share?: boolean
  empty?: string
}) {
  if (!primary) {
    return (
      <div className="flex flex-col gap-3" aria-live="polite">
        <p className="text-sm text-[var(--nb-secondary)]">{empty ?? "Enter the figures to see a result."}</p>
        {note ? <p className="text-sm text-[var(--nb-secondary)]">{note}</p> : null}
        {onReset ? <ResetButton onClick={onReset} /> : null}
      </div>
    )
  }

  return (
    <div
      className="flex flex-col gap-5 rounded-xl border border-border bg-[var(--nb-accent)]/55 p-5 sm:p-6"
      aria-live="polite"
    >
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-[var(--nb-secondary)]">{primary.label}</div>
        <output className="max-w-full text-3xl leading-tight font-semibold tracking-[-0.04em] break-words text-[var(--nb-primary)] tabular-nums sm:text-4xl">
          {primary.value}
        </output>
        {context ? <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">{context}</p> : null}
      </div>
      {formula ? (
        <p className="font-mono text-[13px] tracking-[-0.01em] text-[var(--nb-secondary)]">{formula}</p>
      ) : null}
      {secondary?.length ? (
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {secondary.map((item) => (
            <div key={item.label}>
              <div className="text-xs font-medium text-[var(--nb-secondary)]">{item.label}</div>
              <div className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--nb-primary)] tabular-nums sm:text-xl">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {note ? <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">{note}</p> : null}
      {copyText || onReset || share ? (
        <CalculatorActions copyText={copyText} onReset={onReset} share={share} />
      ) : null}
    </div>
  )
}

export function CalculatorActions({
  copyText,
  onReset,
  share,
}: {
  copyText?: string
  onReset?: () => void
  share?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {copyText ? <CopyButton text={copyText} label="Copy result" /> : null}
      {share ? <ShareLinkButton /> : null}
      {onReset ? <ResetButton onClick={onReset} /> : null}
    </div>
  )
}

export function CalculatorExample({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-fit text-left text-[13px] text-[var(--nb-primary)] underline-offset-4 hover:underline"
    >
      Try {label}
    </button>
  )
}

export function CalculatorPresets({
  label,
  values,
  current,
  onSelect,
}: {
  label: string
  values: { label: string; value: string }[]
  current?: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[13px] text-[var(--nb-primary)]">{label}</div>
      <div className="flex flex-wrap gap-2">
        {values.map((item) => (
          <Button
            key={item.value}
            type="button"
            variant={current === item.value ? "default" : "outline"}
            className={cn("h-9 px-3 tabular-nums")}
            onClick={() => onSelect(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function CalculatorPrivacy() {
  return <p className="text-[12px] text-[var(--nb-secondary)]">Calculations happen in your browser.</p>
}

function ShareLinkButton() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")

  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 px-3"
      onClick={async () => {
        const url = window.location.href
        try {
          if (navigator.share) {
            await navigator.share({ title: document.title, url })
            return
          }
          await navigator.clipboard.writeText(url)
          setState("copied")
        } catch {
          try {
            await navigator.clipboard.writeText(url)
            setState("copied")
          } catch {
            setState("failed")
          }
        }
        window.setTimeout(() => setState("idle"), 1400)
      }}
    >
      {state === "copied" ? <Check /> : <Link2 />}
      {state === "copied" ? "Link copied" : state === "failed" ? "Could not copy" : "Copy link"}
    </Button>
  )
}
