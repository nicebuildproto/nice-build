"use client"

import { CopyButton, ResetButton } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { downloadText } from "@/lib/tools/download"
import { cn } from "@/lib/utils"
import { useEffect, type KeyboardEvent, type ReactNode, type RefObject } from "react"

export function DeveloperPrivacy({ children = "Runs entirely in your browser. Nothing is uploaded." }: { children?: ReactNode }) {
  return <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">{children}</p>
}

export function KeyboardHint({ keys = "Ctrl/⌘ + Enter" }: { keys?: string }) {
  return <p className="text-[12px] text-[var(--nb-secondary)]">{keys}</p>
}

export function useModEnter(onRun: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    function onKey(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        const target = event.target as HTMLElement | null
        if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable)) {
          event.preventDefault()
          onRun()
        } else if (target?.tagName !== "BUTTON") {
          event.preventDefault()
          onRun()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onRun, enabled])
}

export function countsFor(value: string) {
  const chars = value.length
  const lines = value ? value.split("\n").length : 0
  return { chars, lines }
}

export function CodeField({
  label,
  value,
  onChange,
  placeholder,
  rows = 12,
  invalid,
  describedBy,
  inputRef,
  onModEnter,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  invalid?: boolean
  describedBy?: string
  inputRef?: RefObject<HTMLTextAreaElement | null>
  onModEnter?: () => void
}) {
  const { chars, lines } = countsFor(value)

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (onModEnter && (event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      onModEnter()
    }
  }

  return (
    <label className="flex flex-col gap-2">
      <span className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[13px] text-[var(--nb-primary)]">{label}</span>
        <span className="text-[12px] tabular-nums text-[var(--nb-secondary)]">
          {lines} {lines === 1 ? "line" : "lines"} · {chars.toLocaleString("en-AU")} {chars === 1 ? "character" : "characters"}
        </span>
      </span>
      <textarea
        ref={inputRef}
        value={value}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="min-h-48 w-full max-w-full resize-y overflow-x-auto rounded-lg border border-input bg-[var(--nb-accent)]/35 px-3 py-2 font-mono text-[13px] leading-relaxed text-[var(--nb-primary)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </label>
  )
}

export function CodeOutput({
  label = "Output",
  value,
  empty,
  preview,
}: {
  label?: string
  value: string
  empty?: string
  preview?: string
}) {
  if (!value) {
    return empty ? <p className="text-sm text-[var(--nb-secondary)]">{empty}</p> : null
  }
  const shown = preview ?? value
  const { chars, lines } = countsFor(value)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[13px] text-[var(--nb-primary)]">{label}</p>
        <p className="text-[12px] tabular-nums text-[var(--nb-secondary)]">
          {lines} {lines === 1 ? "line" : "lines"} · {chars.toLocaleString("en-AU")} {chars === 1 ? "character" : "characters"}
        </p>
      </div>
      <pre className="max-h-[28rem] overflow-auto rounded-xl border border-border bg-[var(--nb-accent)]/40 p-4 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap text-[var(--nb-primary)]">
        {shown}
      </pre>
    </div>
  )
}

export function ErrorPanel({
  id,
  message,
  line,
  column,
  onJump,
}: {
  id?: string
  message: string
  line?: number | null
  column?: number | null
  onJump?: () => void
}) {
  return (
    <div
      id={id}
      role="alert"
      className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
    >
      <p className="text-sm text-destructive">{message}</p>
      {onJump && line != null ? (
        <button type="button" className="w-fit text-[13px] text-[var(--nb-primary)] underline-offset-4 hover:underline" onClick={onJump}>
          Jump to line {line}
          {column != null ? `, column ${column}` : ""}
        </button>
      ) : null}
    </div>
  )
}

export function ResultSummary({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="text-[13px] text-[var(--nb-secondary)]">
      {children}
    </p>
  )
}

export function DeveloperActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>
}

export function DownloadAction({
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

export function ExampleButton({ onClick, label = "Load example" }: { onClick: () => void; label?: string }) {
  return (
    <Button type="button" variant="outline" className="h-10 px-3" onClick={onClick}>
      {label}
    </Button>
  )
}

export { CopyButton, ResetButton }
