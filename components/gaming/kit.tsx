"use client"

import { CopyButton, ResetButton } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEffect, useState, type ReactNode } from "react"

export function GamingToolShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-6 sm:gap-8", className)}>{children}</div>
}

export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">{children}</p>
}

export function LimitNote({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-xl rounded-lg border border-border px-3 py-2 text-[13px] leading-relaxed text-[var(--nb-secondary)]">
      {children}
    </p>
  )
}

export function MetricCard({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note?: string
}) {
  return (
    <div>
      <div className="text-xs font-medium text-[var(--nb-secondary)]">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[var(--nb-primary)] tabular-nums sm:text-4xl">
        {value}
      </div>
      {note ? <p className="mt-1 max-w-xs text-[12px] text-[var(--nb-secondary)]">{note}</p> : null}
    </div>
  )
}

export function ResultDisplay({
  children,
  label,
}: {
  children: ReactNode
  label?: string
}) {
  return (
    <p aria-live="polite" aria-atomic="true" className="text-5xl font-semibold tracking-[-0.04em] text-[var(--nb-primary)] tabular-nums">
      {label ? <span className="sr-only">{label}: </span> : null}
      {children}
    </p>
  )
}

export function HardwareStatus({
  state,
  detail,
}: {
  state: "waiting" | "live" | "limited"
  detail: string
}) {
  const label = state === "live" ? "Connected" : state === "limited" ? "Limited" : "Waiting"
  return (
    <p className="text-sm text-[var(--nb-secondary)]" aria-live="polite">
      <span className="font-medium text-[var(--nb-primary)]">{label}.</span> {detail}
    </p>
  )
}

export function GameSelector({
  games,
  value,
  onChange,
  label,
}: {
  games: { id: string; name: string }[]
  value: string
  onChange: (id: string) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {games.map((game) => (
        <Button
          key={game.id}
          type="button"
          variant={game.id === value ? "default" : "outline"}
          className="h-10 px-3"
          aria-pressed={game.id === value}
          onClick={() => onChange(game.id)}
        >
          {game.name}
        </Button>
      ))}
    </div>
  )
}

export function TestArea({
  children,
  className,
  label,
}: {
  children?: ReactNode
  className?: string
  label: string
}) {
  return (
    <div
      role="application"
      aria-label={label}
      tabIndex={0}
      className={cn("rounded-xl border border-border focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50", className)}
    >
      {children}
    </div>
  )
}

export function CopyReset({
  text,
  onReset,
}: {
  text: string
  onReset?: () => void
}) {
  return (
    <ActionBar>
      <CopyButton text={text} label="Copy result" />
      {onReset ? <ResetButton onClick={onReset} /> : null}
    </ActionBar>
  )
}

export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)")
    const update = () => setCoarse(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  return coarse
}

export { CopyButton, ResetButton }
