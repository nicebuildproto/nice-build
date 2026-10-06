"use client"

import { CopyButton, DownloadButton, ResetButton } from "@/components/tools/ui"
import { Input } from "@/components/ui/input"
import { downloadText } from "@/lib/tools/download"
import { cn } from "@/lib/utils"
import { type ReactNode } from "react"

export function TradeShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-8 pb-20 sm:pb-0", className)}>{children}</div>
}

export function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">{title}</h2>
        {hint ? <p className="text-[13px] text-[var(--nb-secondary)]">{hint}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function PrivacyNote({
  children = "Measurements stay in this browser. Nothing is uploaded.",
}: {
  children?: ReactNode
}) {
  return <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">{children}</p>
}

export function IssueList({ issues }: { issues: string[] }) {
  if (issues.length === 0) return null
  return (
    <ul className="flex flex-col gap-1 text-[13px] text-destructive" aria-live="polite">
      {issues.map((issue) => (
        <li key={issue}>{issue}</li>
      ))}
    </ul>
  )
}

export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}

export function ModeTabs({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { id: string; label: string }[]
  onChange: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] text-[var(--nb-primary)]">{label}</p>
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.id === value
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn(
                "h-10 rounded-lg border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-[var(--nb-primary)] hover:bg-muted",
              )}
              onClick={() => onChange(option.id)}
              onKeyDown={(event) => {
                const index = options.findIndex((item) => item.id === value)
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault()
                  onChange(options[(index + 1) % options.length].id)
                }
                if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault()
                  onChange(options[(index - 1 + options.length) % options.length].id)
                }
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MeasureField({
  label,
  value,
  onChange,
  unit,
  onUnitChange,
  units,
  hint,
  optional,
  invalid,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  unit: string
  onUnitChange?: (unit: string) => void
  units?: { id: string; label: string }[]
  hint?: string
  optional?: boolean
  invalid?: boolean
}) {
  const hintId = hint ? `${label.replace(/\s+/g, "-").toLowerCase()}-hint` : undefined
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] text-[var(--nb-primary)]">
        {label}
        {optional ? <span className="text-[var(--nb-secondary)]"> · optional</span> : null}
      </span>
      <div className="flex gap-2">
        <Input
          inputMode="decimal"
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={hintId}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 min-w-0 flex-1 tabular-nums sm:h-10"
        />
        {units && onUnitChange ? (
          <select
            aria-label={`${label} unit`}
            value={unit}
            onChange={(event) => onUnitChange(event.target.value)}
            className="h-11 w-[4.75rem] shrink-0 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-10"
          >
            {units.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="grid h-11 w-12 shrink-0 place-items-center text-sm text-[var(--nb-secondary)] sm:h-10">
            {unit}
          </span>
        )}
      </div>
      {hint ? (
        <span id={hintId} className="text-[12px] text-[var(--nb-secondary)]">
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export function QtyField({
  label,
  value,
  onChange,
  suffix,
  hint,
  optional,
  invalid,
  min,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  suffix?: string
  hint?: string
  optional?: boolean
  invalid?: boolean
  min?: number
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] text-[var(--nb-primary)]">
        {label}
        {optional ? <span className="text-[var(--nb-secondary)]"> · optional</span> : null}
      </span>
      <div className="relative">
        <Input
          inputMode="decimal"
          value={value}
          min={min}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
          className={cn("h-11 tabular-nums sm:h-10", suffix && (suffix.length > 3 ? "pr-16" : "pr-12"))}
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[var(--nb-secondary)]">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <span className="text-[12px] text-[var(--nb-secondary)]">{hint}</span> : null}
    </label>
  )
}

export function WasteSelector({
  value,
  onChange,
  options = [
    { id: "0", label: "None" },
    { id: "5", label: "5%" },
    { id: "10", label: "10%" },
    { id: "15", label: "15%" },
  ],
}: {
  value: string
  onChange: (value: string) => void
  options?: { id: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] text-[var(--nb-primary)]">Waste allowance</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Waste allowance">
        {options.map((option) => {
          const selected = option.id === value
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              className={cn(
                "h-10 rounded-lg border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-[var(--nb-primary)] hover:bg-muted",
              )}
              onClick={() => onChange(option.id)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ResultCard({
  label,
  value,
  note,
  rows,
  assumptions,
  children,
}: {
  label: string
  value: string
  note?: string
  rows?: { label: string; value: string }[]
  assumptions?: string[]
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-[var(--nb-accent)]/55 p-5 sm:p-6" aria-live="polite">
      <div>
        <p className="text-xs font-medium text-[var(--nb-secondary)]">{label}</p>
        <p className="mt-1 text-4xl leading-none font-semibold tracking-[-0.04em] text-[var(--nb-primary)] tabular-nums sm:text-5xl">
          {value}
        </p>
        {note ? <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">{note}</p> : null}
      </div>
      {rows?.length ? (
        <dl className="flex flex-wrap gap-x-10 gap-y-4">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-xs font-medium text-[var(--nb-secondary)]">{row.label}</dt>
              <dd className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--nb-primary)] tabular-nums sm:text-xl">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {assumptions?.length ? (
        <ul className="flex max-w-xl flex-col gap-1 text-[13px] text-[var(--nb-secondary)]">
          {assumptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {children}
    </div>
  )
}

export function JobSummary({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-0.5">
          <dt className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">{row.label}</dt>
          <dd className="text-[15px] tracking-[-0.01em] text-[var(--nb-primary)]">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function StickyResult({ label, value }: { label: string; value: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[12px] text-[var(--nb-secondary)]">{label}</span>
        <span className="text-lg font-semibold tracking-[-0.03em] text-[var(--nb-primary)] tabular-nums">{value}</span>
      </div>
    </div>
  )
}

export function PrintButton({ title, text, label = "Print" }: { title: string; text: string; label?: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-3 text-sm text-[var(--nb-primary)] outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      onClick={() => printText(title, text)}
    >
      {label}
    </button>
  )
}

export function ExampleButton({ label, onClick }: { label: string; onClick: () => void }) {
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

export function printText(title: string, body: string) {
  const frame = window.document.createElement("iframe")
  frame.setAttribute("style", "position:fixed;right:0;bottom:0;width:0;height:0;border:0")
  window.document.body.appendChild(frame)
  const doc = frame.contentDocument
  if (!doc) return
  doc.open()
  doc.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 36px; color: #111; }
    h1 { font-size: 22px; margin: 0 0 16px; }
    pre { white-space: pre-wrap; font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; }
  </style></head><body><h1>${escapeHtml(title)}</h1><pre>${escapeHtml(body)}</pre></body></html>`)
  doc.close()
  frame.contentWindow?.focus()
  frame.contentWindow?.print()
  window.setTimeout(() => frame.remove(), 1000)
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

export function downloadSummary(filename: string, text: string) {
  downloadText(text, filename)
}

export { CopyButton, DownloadButton, ResetButton }
