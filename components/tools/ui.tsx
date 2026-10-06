"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { downloadText } from "@/lib/tools/download"
import { cn } from "@/lib/utils"
import { Check, Copy } from "lucide-react"
import { useCallback, useEffect, useState, type ReactNode } from "react"

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
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  suffix?: string
  min?: number
  step?: string
  placeholder?: string
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <Input
          inputMode="decimal"
          value={value}
          min={min}
          step={step}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cn("h-11 tabular-nums sm:h-10", suffix && (suffix.length > 3 ? "pr-16" : "pr-12"))}
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
  mono = false,
  invalid = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  mono?: boolean
  invalid?: boolean
}) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        spellCheck={mono ? false : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "min-h-36 w-full resize-y overflow-x-auto rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          mono && "min-h-48 bg-[var(--nb-accent)]/35 font-mono text-[13px]",
        )}
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

export function CopyButton({ text, label = "Copy", compact = false }: { text: string; label?: string; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const shown = state === "copied" ? "Copied" : state === "failed" ? "Could not copy" : label

  return (
    <Button
      type="button"
      variant="outline"
      aria-live="polite"
      className={compact ? "h-8 px-2 text-[13px]" : "h-10 px-3"}
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
      {shown}
    </Button>
  )
}

export const selectClass =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function FileDrop({
  accept,
  onFile,
  idle = "Drop a file here, or browse",
  multiple = false,
  onFiles,
  paste = false,
  maxBytes,
}: {
  accept: string
  onFile: (file: File) => void
  idle?: string
  multiple?: boolean
  onFiles?: (files: File[]) => void
  paste?: boolean
  maxBytes?: number
}) {
  const [name, setName] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const takeList = useCallback(
    (list: File[]) => {
      const files = list.filter(Boolean)
      if (!files.length) return
      if (maxBytes) {
        const tooBig = files.find((file) => file.size > maxBytes)
        if (tooBig) {
          setNote(`${tooBig.name} is larger than ${Math.round(maxBytes / 1_000_000)} MB.`)
          return
        }
      }
      setNote(null)
      setName(files.length === 1 ? files[0].name : `${files.length} files`)
      if (onFiles) onFiles(files)
      else onFile(files[0])
    },
    [maxBytes, onFile, onFiles],
  )

  useEffect(() => {
    if (!paste) return
    function onPaste(event: ClipboardEvent) {
      const files = Array.from(event.clipboardData?.files ?? [])
      const items = Array.from(event.clipboardData?.items ?? [])
      const fromItems = items
        .filter((item) => item.kind === "file")
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file))
      const next = files.length ? files : fromItems
      if (next.length) {
        event.preventDefault()
        takeList(next)
      }
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [paste, takeList])

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
          takeList(Array.from(event.dataTransfer.files ?? []))
        }}
        className={cn(
          "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-8 text-center transition-colors has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
          over ? "border-[var(--nb-primary)] bg-[var(--nb-accent)]" : "border-border"
        )}
      >
        <span className="text-sm text-[var(--nb-primary)]">{name ?? idle}</span>
        <span className="text-xs text-[var(--nb-secondary)]">
          {name ? (multiple ? "Drop more files to add them" : "Drop another file to replace it") : paste ? "Click to browse, or paste" : "Click to browse"}
        </span>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(event) => {
            takeList(Array.from(event.target.files ?? []))
            event.target.value = ""
          }}
        />
      </label>
      {note ? <p className="text-sm text-destructive">{note}</p> : null}
    </div>
  )
}

export function ToolNote({ children }: { children: ReactNode }) {
  return <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">{children}</p>
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <p className="text-sm text-destructive">{children}</p>
}

export function DownloadButton({
  text,
  filename,
  mime,
  label = "Download",
}: {
  text: string
  filename: string
  mime?: string
  label?: string
}) {
  return (
    <Button type="button" variant="outline" className="h-10 px-3" onClick={() => downloadText(text, filename, mime)}>
      {label}
    </Button>
  )
}

export function ResetButton({ onClick, label = "Reset" }: { onClick: () => void; label?: string }) {
  return (
    <Button type="button" variant="ghost" className="h-10 px-3" onClick={onClick}>
      {label}
    </Button>
  )
}

export function parseAmount(value: string) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : null
}
