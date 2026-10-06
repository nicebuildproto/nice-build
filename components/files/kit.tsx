"use client"

import { Button } from "@/components/ui/button"
import { describeAccept, formatBytes, rejectReason } from "@/lib/files/format"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useId, useState, type ReactNode } from "react"

export type FileStatus = "idle" | "selected" | "ready" | "processing" | "complete" | "failed"

export type QueuedFile = {
  id: string
  file: File
  previewUrl?: string
}

export function FileToolShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-8 pb-16 sm:pb-0", className)}>{children}</div>
}

export function PrivacyNote({
  children = "Your files stay on your device.",
}: {
  children?: ReactNode
}) {
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

export function StatusLine({
  status,
  children,
}: {
  status: FileStatus
  children: ReactNode
}) {
  if (!children) return null
  return (
    <p
      className={cn(
        "text-sm",
        status === "failed" ? "text-destructive" : "text-[var(--nb-secondary)]",
      )}
      aria-live={status === "processing" || status === "failed" ? "polite" : undefined}
      aria-busy={status === "processing" || undefined}
    >
      {children}
    </p>
  )
}

export function IssueList({ issues }: { issues: string[] }) {
  if (!issues.length) return null
  return (
    <ul className="flex flex-col gap-1 text-sm text-destructive" aria-live="polite">
      {issues.map((issue) => (
        <li key={issue}>{issue}</li>
      ))}
    </ul>
  )
}

export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}

export function ResultStats({ items }: { items: { label: string; value: string }[] }) {
  if (!items.length) return null
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">{item.label}</dt>
          <dd className="mt-1 text-sm font-medium break-all text-[var(--nb-primary)] tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function RangeControl({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display?: string
  onChange: (value: number) => void
}) {
  const id = useId()
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-[13px] text-[var(--nb-primary)]">
        <span>{label}</span>
        <span className="tabular-nums text-[var(--nb-secondary)]">{display ?? String(value)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full accent-[var(--nb-primary)]"
      />
    </div>
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
                  ? "border-[var(--nb-primary)] bg-[var(--nb-accent)] text-[var(--nb-primary)]"
                  : "border-border text-[var(--nb-secondary)]",
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

export function FileDropzone({
  accept,
  acceptLabel,
  maxBytes,
  multiple = false,
  paste = false,
  idle,
  onFiles,
}: {
  accept: string
  acceptLabel?: string
  maxBytes?: number
  multiple?: boolean
  paste?: boolean
  idle?: string
  onFiles: (files: File[]) => void
}) {
  const [over, setOver] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const types = acceptLabel ?? describeAccept(accept)
  const limit = maxBytes ? ` · up to ${formatBytes(maxBytes)}` : ""
  const prompt = idle ?? (multiple ? "Drop files here, or browse" : "Drop a file here, or browse")

  const take = useCallback(
    (list: File[]) => {
      const files = list.filter(Boolean)
      if (!files.length) return
      const rejected = files.map((file) => rejectReason(file, accept, maxBytes)).find(Boolean)
      if (rejected) {
        setNote(rejected)
        return
      }
      setNote(null)
      onFiles(multiple ? files : [files[0]])
    },
    [accept, maxBytes, multiple, onFiles],
  )

  useEffect(() => {
    if (!paste) return
    function onPaste(event: ClipboardEvent) {
      const files = Array.from(event.clipboardData?.files ?? [])
      const fromItems = Array.from(event.clipboardData?.items ?? [])
        .filter((item) => item.kind === "file")
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file))
      const next = files.length ? files : fromItems
      if (next.length) {
        event.preventDefault()
        take(next)
      }
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [paste, take])

  return (
    <div className="flex flex-col gap-2">
      <label
        onDragOver={(event) => {
          event.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setOver(false)
          take(Array.from(event.dataTransfer.files ?? []))
        }}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-8 text-center transition-colors has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
          over ? "border-[var(--nb-primary)] bg-[var(--nb-accent)]" : "border-border",
        )}
      >
        <span className="text-sm text-[var(--nb-primary)]">{prompt}</span>
        <span className="max-w-sm text-xs text-[var(--nb-secondary)]">
          {types}
          {limit}
          {paste ? " · click to browse, or paste" : " · click to browse"}
        </span>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(event) => {
            take(Array.from(event.target.files ?? []))
            event.target.value = ""
          }}
        />
      </label>
      {note ? <p className="text-sm text-destructive">{note}</p> : null}
    </div>
  )
}

export function FileCard({
  name,
  meta,
  previewUrl,
  previewAlt,
  onRemove,
  children,
}: {
  name: string
  meta?: string
  previewUrl?: string
  previewAlt?: string
  onRemove?: () => void
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={previewAlt ?? name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--nb-primary)]">{name}</p>
        {meta ? <p className="text-xs text-[var(--nb-secondary)]">{meta}</p> : null}
        {children}
      </div>
      {onRemove ? (
        <Button type="button" variant="ghost" className="h-9 w-fit shrink-0" onClick={onRemove}>
          Remove
        </Button>
      ) : null}
    </div>
  )
}

export function PreviewFrame({
  children,
  label = "Preview",
  className,
}: {
  children: ReactNode
  label?: string
  className?: string
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border", className)} aria-label={label}>
      {children}
    </div>
  )
}

export function uid() {
  return Math.random().toString(36).slice(2, 10)
}
