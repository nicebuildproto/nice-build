"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Check, Copy } from "lucide-react"
import { useState, type ReactNode } from "react"

export function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-[13px] text-[var(--nb-primary)]">{label}</span>
      {children}
    </label>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  min,
  step = "any",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  suffix?: string
  min?: number
  step?: string
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <Input
          inputMode="decimal"
          value={value}
          min={min}
          step={step}
          onChange={(event) => onChange(event.target.value)}
          className={cn("h-10 tabular-nums", suffix && (suffix.length > 3 ? "pr-16" : "pr-12"))}
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[var(--nb-secondary)]">
            {suffix}
          </span>
        ) : null}
      </div>
    </Field>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 8,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-36 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </Field>
  )
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-[var(--nb-secondary)]">{label}</div>
      <div className="mt-1 text-3xl leading-none font-semibold tracking-[-0.04em] text-[var(--nb-primary)] tabular-nums">
        {value}
      </div>
    </div>
  )
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")

  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 px-3"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setState("copied")
        } catch {
          setState("failed")
        }
        window.setTimeout(() => setState("idle"), 1400)
      }}
    >
      {state === "copied" ? <Check /> : <Copy />}
      {state === "copied" ? "Copied" : state === "failed" ? "Could not copy" : label}
    </Button>
  )
}

export function FileDrop({
  accept,
  onFile,
  idle = "Drop a file here, or browse",
}: {
  accept: string
  onFile: (file: File) => void
  idle?: string
}) {
  const [name, setName] = useState<string | null>(null)
  const [over, setOver] = useState(false)

  function take(file: File | undefined) {
    if (!file) return
    setName(file.name)
    onFile(file)
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        take(event.dataTransfer.files?.[0])
      }}
      className={cn(
        "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-8 text-center transition-colors has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
        over ? "border-[var(--nb-primary)] bg-[var(--nb-accent)]" : "border-border"
      )}
    >
      <span className="text-sm text-[var(--nb-primary)]">{name ?? idle}</span>
      <span className="text-xs text-[var(--nb-secondary)]">{name ? "Drop another file to replace it" : "Click to browse"}</span>
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          take(event.target.files?.[0])
          event.target.value = ""
        }}
      />
    </label>
  )
}

export function parseAmount(value: string) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : null
}
