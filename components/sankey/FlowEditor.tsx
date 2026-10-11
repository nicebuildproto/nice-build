"use client"

import { stageFloat } from "@/components/stage/chrome"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ColorField, colorPickerLocked } from "@/components/viz/fields"
import { cn } from "@/lib/utils"
import { Copy, Plus, Trash2, X } from "lucide-react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export type FlowTarget = {
  id: string
  target: string
  value: string
}

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
  }, [x, y, targets.length, recent.length])

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
      className={cn(stageFloat, "fixed z-[80] flex w-[300px] flex-col gap-3 rounded-2xl p-3")}
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
    </div>,
    document.body
  )
}
