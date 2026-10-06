"use client"

import { CopyButton, ResetButton } from "@/components/tools/ui"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useSyncExternalStore, type ReactNode } from "react"

export function BusinessShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-8", className)}>{children}</div>
}

export function PrivacyNote({ children = "Your data stays in this browser. Nothing is uploaded." }: { children?: ReactNode }) {
  return <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">{children}</p>
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

export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
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

export function ResultHero({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note?: string
}) {
  return (
    <div aria-live="polite">
      <p className="text-xs font-medium text-[var(--nb-secondary)]">{label}</p>
      <p className="mt-1 text-4xl leading-none font-semibold tracking-[-0.04em] text-[var(--nb-primary)] tabular-nums sm:text-5xl">
        {value}
      </p>
      {note ? <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">{note}</p> : null}
    </div>
  )
}

export function StatRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs font-medium text-[var(--nb-secondary)]">{item.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--nb-primary)] tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
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
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  optional,
  type = "text",
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  optional?: boolean
  type?: string
  autoComplete?: string
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] text-[var(--nb-primary)]">
        {label}
        {optional ? <span className="text-[var(--nb-secondary)]"> · optional</span> : null}
      </span>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="h-10"
      />
    </label>
  )
}

export function AreaField({
  label,
  value,
  onChange,
  rows = 3,
  optional,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  optional?: boolean
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] text-[var(--nb-primary)]">
        {label}
        {optional ? <span className="text-[var(--nb-secondary)]"> · optional</span> : null}
      </span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-20 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </label>
  )
}

export function MoneyField({
  label,
  value,
  onChange,
  hint,
  invalid,
  describedBy,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  invalid?: boolean
  describedBy?: string
}) {
  const hintId = describedBy ?? (hint ? `${label.replace(/\s+/g, "-").toLowerCase()}-hint` : undefined)
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] text-[var(--nb-primary)]">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[var(--nb-secondary)]">$</span>
        <Input
          inputMode="decimal"
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={hintId}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 pl-7 tabular-nums"
        />
      </div>
      {hint ? (
        <span id={hintId} className="text-[12px] text-[var(--nb-secondary)]">
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export function PercentField({
  label,
  value,
  onChange,
  hint,
  invalid,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  invalid?: boolean
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] text-[var(--nb-primary)]">{label}</span>
      <div className="relative">
        <Input
          inputMode="decimal"
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 pr-10 tabular-nums"
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[var(--nb-secondary)]">%</span>
      </div>
      {hint ? <span className="text-[12px] text-[var(--nb-secondary)]">{hint}</span> : null}
    </label>
  )
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] text-[var(--nb-primary)]">{label}</span>
      <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-10" />
    </label>
  )
}

export function TotalsPanel({
  rows,
  totalLabel,
  total,
}: {
  rows: { label: string; value: string }[]
  totalLabel: string
  total: string
}) {
  return (
    <div className="ml-auto w-full max-w-xs" aria-live="polite">
      <dl className="flex flex-col gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-6">
            <dt className="text-[var(--nb-secondary)]">{row.label}</dt>
            <dd className="tabular-nums text-[var(--nb-primary)]">{row.value}</dd>
          </div>
        ))}
        <div className="mt-2 flex items-baseline justify-between gap-6 border-t border-border pt-3">
          <dt className="text-[13px] font-medium text-[var(--nb-primary)]">{totalLabel}</dt>
          <dd className="text-2xl font-semibold tracking-[-0.03em] text-[var(--nb-primary)] tabular-nums">{total}</dd>
        </div>
      </dl>
    </div>
  )
}

export function printHtml(title: string, body: string) {
  const html = `<!doctype html><html><head><title>${escapeHtml(title)}</title><style>
    :root { color-scheme: light; }
    body { font-family: ui-sans-serif, system-ui, sans-serif; color: #111; background: #fff; margin: 0; padding: 36px; }
    .sheet { max-width: 720px; margin: 0 auto; }
    h1 { font-size: 28px; letter-spacing: -0.03em; margin: 0; }
    .muted { color: #6b7280; font-size: 12px; }
    .row { display: flex; gap: 32px; margin: 24px 0; }
    .col { flex: 1; white-space: pre-line; font-size: 13px; line-height: 1.45; }
    .label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
    th { text-align: left; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; font-weight: 600; padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
    td { padding: 10px 0; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals { margin-top: 20px; margin-left: auto; width: 240px; font-size: 13px; }
    .totals div { display: flex; justify-content: space-between; gap: 16px; padding: 4px 0; }
    .totals .due { font-size: 16px; font-weight: 650; border-top: 1px solid #e5e5e5; margin-top: 8px; padding-top: 10px; }
    .notes { margin-top: 28px; font-size: 13px; color: #4b5563; white-space: pre-line; }
    @media print { body { padding: 0; } }
  </style></head><body><div class="sheet">${body}</div></body></html>`
  const frame = window.document.createElement("iframe")
  frame.setAttribute("style", "position:fixed;right:0;bottom:0;width:0;height:0;border:0")
  window.document.body.appendChild(frame)
  const doc = frame.contentDocument
  if (!doc) return
  doc.open()
  doc.write(html)
  doc.close()
  frame.contentWindow?.focus()
  frame.contentWindow?.print()
  window.setTimeout(() => frame.remove(), 1000)
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export function ShareUrlButton({ href, label = "Copy share link" }: { href: string; label?: string }) {
  return <CopyButton text={href} label={label} />
}

export { CopyButton, ResetButton }

function subscribeSearch(onChange: () => void) {
  window.addEventListener("popstate", onChange)
  return () => window.removeEventListener("popstate", onChange)
}

export function useBrowserSearch() {
  return useSyncExternalStore(subscribeSearch, () => window.location.search, () => "")
}

export function useBrowserPath() {
  return useSyncExternalStore(
    () => () => {},
    () => `${window.location.origin}${window.location.pathname}`,
    () => "",
  )
}

export function useSessionItem(key: string) {
  return useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return window.sessionStorage.getItem(key)
      } catch {
        return null
      }
    },
    () => null,
  )
}

export function useLocalItem(key: string) {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange)
      return () => window.removeEventListener("storage", onChange)
    },
    () => {
      try {
        return window.localStorage.getItem(key)
      } catch {
        return null
      }
    },
    () => null,
  )
}
