"use client"

import { CopyButton, Field } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { parseHex } from "@/lib/design/colour"
import { cn } from "@/lib/utils"
import { useState, useSyncExternalStore, type ReactNode } from "react"

export function CreativeShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-6", className)}>{children}</div>
}

export function PreviewCanvas({
  children,
  className,
  label = "Preview",
}: {
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <div
      className={cn("overflow-hidden rounded-2xl border border-border", className)}
      aria-label={label}
    >
      {children}
    </div>
  )
}

export function ColourInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const parsed = parseHex(value)
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={parsed ?? "#111111"}
          aria-label={`${label} colour picker`}
          onChange={(event) => onChange(event.target.value)}
          className="size-10 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
        />
        <Input
          value={value}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-invalid={parsed ? undefined : true}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 font-mono"
        />
      </div>
    </Field>
  )
}

export function PresetRow({
  label = "Presets",
  children,
}: {
  label?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] text-[var(--nb-primary)]">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

export function ActionRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}

export function CssBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-[var(--nb-accent)]/40 p-4 font-mono text-[13px] leading-relaxed text-[var(--nb-primary)]">
      {code}
    </pre>
  )
}

export function Grade({
  label,
  pass,
  detail,
}: {
  label: string
  pass: boolean
  detail?: string
}) {
  return (
    <div className="min-w-36">
      <p className="text-xs font-medium text-[var(--nb-secondary)]">{label}</p>
      <p className="mt-1 text-[15px] font-medium text-[var(--nb-primary)]">
        <span aria-hidden="true">{pass ? "✓" : "✕"} </span>
        {pass ? `Meets ${label}` : `Does not meet ${label}`}
      </p>
      {detail ? <p className="mt-0.5 text-[12px] text-[var(--nb-secondary)]">{detail}</p> : null}
    </div>
  )
}

export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between gap-2 text-[13px] text-[var(--nb-primary)]">
        {label}
        <span className="tabular-nums text-[var(--nb-secondary)]">
          {value}
          {suffix ?? ""}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full accent-[var(--nb-primary)]"
      />
    </label>
  )
}

export function ShareLinkButton({ query }: { query: string }) {
  const [label, setLabel] = useState("Copy link")
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 px-3"
      onClick={async () => {
        const url = `${window.location.origin}${window.location.pathname}?${query}`
        try {
          await navigator.clipboard.writeText(url)
          setLabel("Copied")
        } catch {
          setLabel("Could not copy")
        }
        window.setTimeout(() => setLabel("Copy link"), 1400)
      }}
    >
      {label}
    </Button>
  )
}

function subscribeSearch(onChange: () => void) {
  window.addEventListener("popstate", onChange)
  return () => window.removeEventListener("popstate", onChange)
}

export function useSearchString() {
  return useSyncExternalStore(
    subscribeSearch,
    () => window.location.search,
    () => "",
  )
}

export function FormatRow({ hex, rgb, hsl }: { hex: string; rgb: string; hsl: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <CopyStat label="HEX" value={hex} />
      <CopyStat label="RGB" value={rgb} />
      <CopyStat label="HSL" value={hsl} />
    </div>
  )
}

function CopyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] font-medium tracking-[0.12em] text-[var(--nb-secondary)] uppercase">{label}</p>
        <p className="truncate font-mono text-[13px] text-[var(--nb-primary)]">{value}</p>
      </div>
      <CopyButton text={value} label="Copy" compact />
    </div>
  )
}
