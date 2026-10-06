"use client"

import { CopyButton, ResetButton } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEffect, useState, type ReactNode } from "react"

export function EverydayToolShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-6 sm:gap-8", className)}>{children}</div>
}

export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}

export function PrimaryAction({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button type="button" className="h-11 min-w-24 px-5" disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  )
}

export function ResultDisplay({
  children,
  label,
  live = true,
}: {
  children: ReactNode
  label?: string
  live?: boolean
}) {
  return (
    <p
      aria-live={live ? "polite" : undefined}
      aria-atomic="true"
      className="text-5xl font-semibold tracking-[-0.04em] text-[var(--nb-primary)]"
    >
      {label ? <span className="sr-only">{label}: </span> : null}
      {children}
    </p>
  )
}

export function TimerDisplay({
  children,
  label,
}: {
  children: ReactNode
  label?: string
}) {
  return (
    <p
      aria-live="polite"
      aria-atomic="true"
      className="text-5xl font-semibold tracking-[-0.04em] text-[var(--nb-primary)] tabular-nums sm:text-6xl"
    >
      {label ? <span className="sr-only">{label}: </span> : null}
      {children}
    </p>
  )
}

export function History({
  items,
  label = "History",
}: {
  items: string[]
  label?: string
}) {
  if (!items.length) return null
  return (
    <ol className="flex flex-col gap-1 text-sm text-[var(--nb-secondary)] tabular-nums" aria-label={label}>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ol>
  )
}

export function PresetPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={option.value === value ? "default" : "outline"}
          className="h-10 px-3"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

export function InputCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">{children}</p>
}

export function ShareButton({ text, title }: { text: string; title: string }) {
  const [canShare, setCanShare] = useState(false)
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function")
  }, [])
  if (!canShare || !text) return null
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 px-3"
      onClick={() => {
        void navigator.share({ title, text }).catch(() => {})
      }}
    >
      Share
    </Button>
  )
}

export function CopyResetShare({
  text,
  title,
  onReset,
  resetLabel = "Reset",
}: {
  text: string
  title: string
  onReset?: () => void
  resetLabel?: string
}) {
  return (
    <ActionBar>
      <CopyButton text={text} />
      <ShareButton text={text} title={title} />
      {onReset ? <ResetButton onClick={onReset} label={resetLabel} /> : null}
    </ActionBar>
  )
}

export function useNow(active = true, interval = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, interval)
    const onVis = () => {
      if (document.visibilityState === "visible") tick()
    }
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("focus", tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener("focus", tick)
    }
  }, [active, interval])
  return now
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  return reduced
}

export { CopyButton, ResetButton }
