"use client"

import { ResetButton } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { downloadText } from "@/lib/tools/download"
import { cn } from "@/lib/utils"
import { ArrowLeftRight, Check, Copy } from "lucide-react"
import { useId, useState, type KeyboardEvent, type ReactNode } from "react"

export function TextToolShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-6 pb-16 sm:gap-8 sm:pb-0", className)}>{children}</div>
}

export function PrivacyNote({
  children = "Your text stays on your device.",
}: {
  children?: ReactNode
}) {
  return <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">{children}</p>
}

export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-2 border-t border-border bg-background px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
      {children}
    </div>
  )
}

export function StatsPanel({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4" aria-live="polite">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">{item.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--nb-primary)] tabular-nums sm:text-3xl">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function TextEditor({
  label,
  value,
  onChange,
  onSelection,
  rows = 12,
  mono = false,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onSelection?: (selected: string | null) => void
  rows?: number
  mono?: boolean
  placeholder?: string
}) {
  const id = useId()

  function reportSelection(target: HTMLTextAreaElement, source: string) {
    if (!onSelection) return
    const start = target.selectionStart ?? 0
    const end = target.selectionEnd ?? 0
    onSelection(end > start ? source.slice(start, end) : null)
  }

  return (
    <label className="flex min-h-0 flex-col gap-2">
      <span className="text-[13px] text-[var(--nb-primary)]">{label}</span>
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect={mono ? "off" : undefined}
        autoCapitalize={mono ? "off" : undefined}
        spellCheck={mono ? false : undefined}
        enterKeyHint="enter"
        onChange={(event) => {
          const next = event.target.value
          onChange(next)
          reportSelection(event.currentTarget, next)
        }}
        onSelect={(event) => reportSelection(event.currentTarget, value)}
        className={cn(
          "min-h-40 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-base leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-48 sm:text-sm",
          mono && "font-mono sm:text-[13px]",
        )}
      />
    </label>
  )
}

export function OutputBox({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <p className="text-[13px] text-[var(--nb-primary)]">{label}</p>
      <pre
        tabIndex={0}
        aria-label={label}
        className={cn(
          "min-h-40 w-full overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border px-3 py-2 text-base leading-relaxed sm:min-h-48 sm:text-sm",
          mono && "font-mono sm:text-[13px]",
        )}
      >
        {value || " "}
      </pre>
    </div>
  )
}

export function SplitPane({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-2 lg:items-start">{children}</div>
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
  const groupId = useId()

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = options.findIndex((option) => option.id === value)
    if (index < 0) return
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault()
      onChange(options[(index + 1) % options.length].id)
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault()
      onChange(options[(index - 1 + options.length) % options.length].id)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p id={groupId} className="text-[13px] text-[var(--nb-primary)]">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={groupId}
        className="flex flex-wrap gap-2"
        onKeyDown={onKeyDown}
      >
        {options.map((option) => {
          const selected = option.id === value
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
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

export function ExamplePicker({
  examples,
  onPick,
}: {
  examples: { label: string; apply: () => void }[]
  onPick?: () => void
}) {
  if (!examples.length) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] text-[var(--nb-secondary)]">Try</span>
      {examples.map((example) => (
        <button
          key={example.label}
          type="button"
          className="h-8 rounded-lg border border-border px-2.5 text-[13px] text-[var(--nb-secondary)] outline-none hover:text-[var(--nb-primary)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => {
            example.apply()
            onPick?.()
          }}
        >
          {example.label}
        </button>
      ))}
    </div>
  )
}

export function CopyTextButton({
  text,
  label = "Copy",
}: {
  text: string
  label?: string
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const shown = state === "copied" ? "Copied" : state === "failed" ? "Could not copy" : label
  const empty = !text

  return (
    <Button
      type="button"
      variant="outline"
      aria-live="polite"
      disabled={empty}
      className="h-10 px-3"
      onClick={async () => {
        const ok = await copyText(text)
        setState(ok ? "copied" : "failed")
        window.setTimeout(() => setState("idle"), 1400)
      }}
    >
      {state === "copied" ? <Check /> : <Copy />}
      {shown}
    </Button>
  )
}

export function DownloadTxt({
  text,
  filename,
  label = "Download .txt",
}: {
  text: string
  filename: string
  label?: string
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10"
      disabled={!text}
      onClick={() => downloadText(text, filename)}
    >
      {label}
    </Button>
  )
}

export function SwapButton({ onClick, label = "Swap" }: { onClick: () => void; label?: string }) {
  return (
    <Button type="button" variant="outline" className="h-10" onClick={onClick}>
      <ArrowLeftRight />
      {label}
    </Button>
  )
}

export function CopyReset({
  text,
  onReset,
  copyLabel = "Copy",
  filename,
  extra,
}: {
  text: string
  onReset: () => void
  copyLabel?: string
  filename?: string
  extra?: ReactNode
}) {
  return (
    <ActionBar>
      <CopyTextButton text={text} label={copyLabel} />
      {filename ? <DownloadTxt text={text} filename={filename} /> : null}
      {extra}
      <ResetButton onClick={onReset} label="Clear" />
    </ActionBar>
  )
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const field = document.createElement("textarea")
      field.value = text
      field.setAttribute("readonly", "")
      field.style.position = "fixed"
      field.style.left = "-9999px"
      document.body.appendChild(field)
      field.select()
      const ok = document.execCommand("copy")
      field.remove()
      return ok
    } catch {
      return false
    }
  }
}
