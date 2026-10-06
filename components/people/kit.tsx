"use client"

import { ResetButton } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { downloadText } from "@/lib/tools/download"
import { cn } from "@/lib/utils"
import { Check, Copy, Printer } from "lucide-react"
import { useState, type ReactNode } from "react"

export function PeopleToolShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-6 sm:gap-8", className)}>{children}</div>
}

export function PrivacyNote({
  children = "Your answers stay on this device. Nothing is sent anywhere.",
}: {
  children?: ReactNode
}) {
  return <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">{children}</p>
}

export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}

export function ResultSection({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <section className="flex max-w-2xl flex-col gap-4" aria-live="polite">
      {title ? <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--nb-primary)]">{title}</h2> : null}
      {children}
    </section>
  )
}

export function DocumentPreview({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] text-[var(--nb-primary)]">{label}</p>
      <pre
        tabIndex={0}
        aria-label={label}
        className="min-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border px-4 py-3 text-base leading-relaxed sm:text-sm"
      >
        {text || " "}
      </pre>
    </div>
  )
}

export function CopyTextButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const shown = state === "copied" ? "Copied" : state === "failed" ? "Could not copy" : label
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 px-3"
      disabled={!text}
      aria-live="polite"
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

export function DownloadTxt({ text, filename, label = "Download .txt" }: { text: string; filename: string; label?: string }) {
  return (
    <Button type="button" variant="outline" className="h-10" disabled={!text} onClick={() => downloadText(text, filename)}>
      {label}
    </Button>
  )
}

export function PrintButton() {
  return (
    <Button type="button" variant="outline" className="h-10" onClick={() => window.print()}>
      <Printer />
      Print
    </Button>
  )
}

export function CopyReset({
  text,
  filename,
  onReset,
  copyLabel = "Copy",
  resetLabel = "Clear",
}: {
  text: string
  filename?: string
  onReset?: () => void
  copyLabel?: string
  resetLabel?: string
}) {
  return (
    <ActionBar>
      <CopyTextButton text={text} label={copyLabel} />
      {filename ? <DownloadTxt text={text} filename={filename} /> : null}
      <PrintButton />
      {onReset ? <ResetButton onClick={onReset} label={resetLabel} /> : null}
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
