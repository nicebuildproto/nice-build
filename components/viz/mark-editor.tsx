"use client"

import { ColorField, ToggleField, colorPickerLocked } from "@/components/viz/fields"
import { stageFloat } from "@/components/stage/chrome"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export type MarkDash = "solid" | "dashed" | "dotted"

export type MarkStyle = {
  color?: string
  opacity?: number
  showLabel?: boolean
  strokeWidth?: number
  dash?: MarkDash
  showPoints?: boolean
}

export type MarkSelection = {
  id: string
  title: string
  x: number
  y: number
}

export type MarkField = "label" | "width" | "dash" | "points"

export function markTarget(
  id: string,
  title: string,
  selected: boolean,
  select: (id: string, title: string, event: { clientX: number; clientY: number; stopPropagation?: () => void }) => void
) {
  return {
    tabIndex: 0 as const,
    role: "button" as const,
    "aria-label": `Edit ${title}`,
    "aria-pressed": selected,
    onKeyDown: (event: { key: string; preventDefault: () => void; currentTarget: Element }) => {
      if (event.key !== "Enter" && event.key !== " ") return
      event.preventDefault()
      const box = event.currentTarget.getBoundingClientRect()
      select(id, title, { clientX: box.left + box.width / 2, clientY: box.top + 8 })
    },
  }
}

export function dashOf(dash?: MarkDash) {
  if (dash === "dashed") return "7 5"
  if (dash === "dotted") return "1.5 5"
  return undefined
}

export function useMarks() {
  const [marks, setMarks] = useState<Record<string, MarkStyle>>({})
  const [selected, setSelected] = useState<MarkSelection | null>(null)
  const editingRef = useRef<string | null>(null)

  const select = useCallback((id: string, title: string, event: { clientX: number; clientY: number; stopPropagation?: () => void }) => {
    event.stopPropagation?.()
    editingRef.current = id
    setSelected({ id, title, x: event.clientX, y: event.clientY })
  }, [])

  const update = useCallback((patch: Partial<MarkStyle>) => {
    const id = editingRef.current
    if (!id) return
    setMarks((current) => ({ ...current, [id]: { ...current[id], ...patch } }))
  }, [])

  const close = useCallback(() => {
    setSelected(null)
  }, [])

  const reset = useCallback(() => {
    setMarks({})
    setSelected(null)
  }, [])

  const of = useCallback((id: string) => marks[id] ?? {}, [marks])

  return { marks, selected, select, update, close, reset, of }
}

export function MarkPopover({
  selected,
  value,
  color,
  fields,
  onChange,
  onClose,
}: {
  selected: MarkSelection | null
  value: MarkStyle
  color: string
  fields: MarkField[]
  onChange: (patch: Partial<MarkStyle>) => void
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    if (!selected) {
      setBox(null)
      return
    }
    const panel = panelRef.current
    const width = panel?.offsetWidth ?? 248
    const height = panel?.offsetHeight ?? 220
    const pad = 12
    let left = selected.x + 14
    let top = selected.y + 14
    if (left + width > window.innerWidth - pad) left = selected.x - width - 14
    if (top + height > window.innerHeight - pad) top = window.innerHeight - height - pad
    setBox({ left: Math.max(pad, left), top: Math.max(pad, top) })
  }, [selected])

  useEffect(() => {
    if (!selected) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    function onPointer(event: PointerEvent) {
      const panel = panelRef.current
      if (!panel) return
      if (!(event.target instanceof Node)) return
      if (panel.contains(event.target)) return
      if (colorPickerLocked()) return
      if (event.target instanceof Element && event.target.closest('input[type="color"]')) return
      if (panel.querySelector('input[type="color"][data-picking="1"]')) return
      onClose()
    }
    document.addEventListener("keydown", onKey)
    const timer = window.setTimeout(() => document.addEventListener("pointerdown", onPointer), 0)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
    }
  }, [onClose, selected])

  if (!selected || typeof document === "undefined") return null

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`Edit ${selected.title}`}
      tabIndex={-1}
      className={cn(
        stageFloat,
        "fixed z-[80] flex w-[248px] flex-col gap-3 rounded-2xl p-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      )}
      style={{ left: box?.left ?? -9999, top: box?.top ?? -9999 }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[13px] font-medium text-foreground">{selected.title}</p>
        <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </div>
      <ColorField label="Colour" value={value.color ?? color} onChange={(next) => onChange({ color: next })} />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-[13px] font-medium">Opacity</Label>
          <span className="text-[13px] text-[var(--nb-secondary)] tabular-nums">{Math.round((value.opacity ?? 1) * 100)}</span>
        </div>
        <Slider
          value={[Math.round((value.opacity ?? 1) * 100)]}
          min={15}
          max={100}
          aria-label="Opacity"
          onValueChange={(next) => {
            const resolved = Array.isArray(next) ? next[0] : next
            if (typeof resolved === "number") onChange({ opacity: resolved / 100 })
          }}
        />
      </div>
      {fields.includes("label") ? (
        <ToggleField
          label="Label"
          checked={value.showLabel !== false}
          onChange={(showLabel) => onChange({ showLabel })}
        />
      ) : null}
      {fields.includes("width") ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-[13px] font-medium">Line width</Label>
            <span className="text-[13px] text-[var(--nb-secondary)] tabular-nums">{value.strokeWidth ?? 2}</span>
          </div>
          <Slider
            value={[value.strokeWidth ?? 2]}
            min={1}
            max={6}
            step={0.5}
            aria-label="Line width"
            onValueChange={(next) => {
              const resolved = Array.isArray(next) ? next[0] : next
              if (typeof resolved === "number") onChange({ strokeWidth: resolved })
            }}
          />
        </div>
      ) : null}
      {fields.includes("dash") ? (
        <div className="flex flex-col gap-2">
          <Label className="text-[13px] font-medium">Line style</Label>
          <div className="grid grid-cols-3 gap-1">
            {(["solid", "dashed", "dotted"] as const).map((dash) => (
              <Button
                key={dash}
                type="button"
                size="default"
                variant={(value.dash ?? "solid") === dash ? "secondary" : "ghost"}
                aria-pressed={(value.dash ?? "solid") === dash}
                onClick={() => onChange({ dash })}
              >
                {dash === "solid" ? "Solid" : dash === "dashed" ? "Dashed" : "Dotted"}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      {fields.includes("points") ? (
        <ToggleField
          label="Points"
          checked={value.showPoints !== false}
          onChange={(showPoints) => onChange({ showPoints })}
        />
      ) : null}
    </div>,
    document.body
  )
}
