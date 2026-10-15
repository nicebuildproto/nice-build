"use client"

import { stageFloat } from "@/components/stage/chrome"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ColorField, colorPickerLocked } from "@/components/viz/fields"
import type { NumberFormat } from "@/lib/sankey/types"
import { cn } from "@/lib/utils"
import { Copy, Plus, Trash2, X } from "lucide-react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export type FlowTarget = {
  id: string
  target: string
  value: string
}

export type NodeFields = {
  numberFormat: NumberFormat
  note: string
  noteMax: number
  onNumberFormat: (value: NumberFormat) => void
  onApplyToAll: () => void
  onNote: (value: string) => void
}

const numberFormats: { id: NumberFormat; label: string }[] = [
  { id: "value", label: "Value" },
  { id: "percent", label: "% of total" },
  { id: "both", label: "Value and %" },
  { id: "compact", label: "Compact" },
  { id: "hidden", label: "Hidden" },
]

export function FlowEditor({
  title,
  x,
  y,
  source,
  onSource,
  targets,
  onTarget,
  onValue,
  onDelete,
  onDuplicate,
  onAddTarget,
  color,
  onColor,
  recent = [],
  nodeFields,
  onClose,
}: {
  title: string
  x: number
  y: number
  source: string
  onSource: (value: string) => void
  targets: FlowTarget[]
  onTarget: (id: string, value: string) => void
  onValue: (id: string, value: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onAddTarget: () => void
  color?: string
  onColor?: (value: string) => void
  recent?: string[]
  nodeFields?: NodeFields
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const panel = panelRef.current
    const width = panel?.offsetWidth ?? 300
    const height = panel?.offsetHeight ?? 280
    const pad = 12
    let left = x + 14
    let top = y + 14
    if (left + width > window.innerWidth - pad) left = x - width - 14
    if (top + height > window.innerHeight - pad) top = window.innerHeight - height - pad
    setBox({ left: Math.max(pad, left), top: Math.max(pad, top) })
  }, [x, y, targets.length, recent.length, nodeFields?.note.length])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    function onPointer(event: PointerEvent) {
      const panel = panelRef.current
      if (!panel || !(event.target instanceof Node) || panel.contains(event.target)) return
      if (colorPickerLocked()) return
      onClose()
    }
    document.addEventListener("keydown", onKey)
    const timer = window.setTimeout(() => document.addEventListener("pointerdown", onPointer), 0)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
    }
  }, [onClose])

  if (typeof document === "undefined") return null

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`Edit ${title}`}
      className={cn(stageFloat, "fixed z-[80] flex max-h-[calc(100dvh-24px)] w-[300px] max-w-[calc(100vw-24px)] flex-col gap-3 overflow-y-auto rounded-2xl p-3")}
      style={{ left: box?.left ?? -9999, top: box?.top ?? -9999 }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[13px] font-medium text-foreground">{title}</p>
        <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">Source</span>
        <Input value={source} aria-label="Source" onChange={(event) => onSource(event.target.value)} className="h-8 text-[13px]" />
      </label>
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">Target</span>
        {targets.length === 0 ? (
          <p className="text-[13px] text-[var(--nb-secondary)]">No target yet.</p>
        ) : (
          targets.map((row) => (
            <div key={row.id} className="flex items-center gap-1">
              <Input
                value={row.target}
                aria-label="Target"
                placeholder="Target"
                onChange={(event) => onTarget(row.id, event.target.value)}
                className="h-8 min-w-0 flex-1 text-[13px]"
              />
              <Input
                value={row.value}
                aria-label="Value"
                placeholder="Value"
                inputMode="decimal"
                onChange={(event) => onValue(row.id, event.target.value)}
                className="h-8 w-16 text-[13px] tabular-nums"
              />
              <Button type="button" variant="ghost" size="icon" aria-label="Duplicate flow" onClick={() => onDuplicate(row.id)}>
                <Copy />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Delete flow" onClick={() => onDelete(row.id)}>
                <Trash2 />
              </Button>
            </div>
          ))
        )}
        {targets.length === 0 || targets.some((row) => row.target.trim() === "") ? (
          <Button type="button" variant="outline" className="h-8 w-fit" onClick={onAddTarget}>
            <Plus />
            Add target
          </Button>
        ) : (
          <Button type="button" variant="ghost" className="h-8 w-fit" onClick={onAddTarget}>
            <Plus />
            Add target
          </Button>
        )}
      </div>
      {color && onColor ? (
        <>
          {recent.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">Recent</span>
              <div className="flex flex-wrap gap-1.5">
                {recent.map((swatch) => {
                  const selected = swatch.toLowerCase() === color.toLowerCase()
                  return (
                    <button
                      key={swatch}
                      type="button"
                      aria-label={`Use ${swatch}`}
                      aria-pressed={selected}
                      onClick={() => onColor(swatch)}
                      className={cn(
                        "size-6 rounded-md border border-black/15",
                        selected && "ring-2 ring-[var(--nb-primary)] ring-offset-2 ring-offset-background"
                      )}
                      style={{ backgroundColor: swatch }}
                    />
                  )
                })}
              </div>
            </div>
          ) : null}
          <ColorField label="Node colour" value={color} onChange={onColor} />
        </>
      ) : null}
      {nodeFields ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="sankey-number-format"
              className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase"
            >
              Show number as
            </label>
            <div className="flex items-center gap-2">
              <select
                id="sankey-number-format"
                value={nodeFields.numberFormat}
                onChange={(event) => nodeFields.onNumberFormat(event.target.value as NumberFormat)}
                className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-8 md:text-[13px]"
              >
                {numberFormats.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={nodeFields.onApplyToAll}
                className="shrink-0 px-1 py-2 text-base text-[var(--nb-secondary)] underline underline-offset-4 hover:text-[var(--nb-primary)] md:text-[13px]"
              >
                Apply to all nodes
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="sankey-node-note"
                className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase"
              >
                Note
              </label>
              <span className="text-[12px] text-[var(--nb-secondary)] tabular-nums" aria-live="off">
                {nodeFields.note.length}/{nodeFields.noteMax}
              </span>
            </div>
            <textarea
              id="sankey-node-note"
              value={nodeFields.note}
              maxLength={nodeFields.noteMax}
              rows={3}
              placeholder="Add a short note (optional)"
              onChange={(event) => nodeFields.onNote(event.target.value)}
              className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base leading-snug outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-[13px]"
            />
          </div>
        </>
      ) : null}
    </div>,
    document.body
  )
}
