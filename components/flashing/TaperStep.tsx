"use client"

import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { centroid, distance, formatMm, midpoint, normalOf, taperedPoints, type Point } from "@/lib/flashing/geometry"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ToolbarGroup } from "./IconButton"
import { toPath } from "./ProfileShape"
import { Viewport } from "./Viewport"

export function outwardNormal(a: Point, b: Point, center: Point): Point {
  const n = normalOf(a, b)
  const mid = midpoint(a, b)
  const toward = (mid.x - center.x) * n.x + (mid.y - center.y) * n.y
  return toward < 0 ? { x: -n.x, y: -n.y } : n
}

export function TaperLegend() {
  return (
    <span className="flex items-center gap-4">
      <span className="flex items-center gap-1.5">
        <svg width="22" height="6" aria-hidden>
          <line x1="0" y1="3" x2="22" y2="3" stroke="#6B7280" strokeWidth="1.75" />
        </svg>
        Square end
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="22" height="6" aria-hidden>
          <line x1="0" y1="3" x2="22" y2="3" stroke="#111111" strokeWidth="2" strokeDasharray="5 3" />
        </svg>
        Tapered end
      </span>
    </span>
  )
}

export function TaperLines({
  base,
  taper,
}: {
  base: Point[]
  taper: Point[] | null
}) {
  return (
    <g className="pointer-events-none">
      {taper
        ? base.map((point, i) => (
            <line
              key={`link-${i}`}
              x1={point.x}
              y1={point.y}
              x2={taper[i].x}
              y2={taper[i].y}
              stroke="#D1D5DB"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
          ))
        : null}
      <path
        d={toPath(base)}
        fill="none"
        stroke={taper ? "#6B7280" : "var(--nb-primary)"}
        strokeWidth={taper ? 1.75 : 2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {taper ? (
      <path
        d={toPath(taper)}
        fill="none"
        stroke="var(--nb-primary)"
        strokeWidth={2}
        strokeDasharray="7 5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      ) : null}
    </g>
  )
}

export function TaperStep({
  points,
  enabled,
  onEnabledChange,
  lengths,
  onLengthChange,
  anchor,
  showGrid,
  onToggleGrid,
}: {
  points: Point[]
  enabled: boolean
  onEnabledChange: (value: boolean) => void
  lengths: (number | null)[]
  onLengthChange: (index: number, value: number | null) => void
  anchor: number
  showGrid: boolean
  onToggleGrid: () => void
}) {
  const [editing, setEditing] = useState<number | null>(null)
  const taper = enabled ? taperedPoints(points, lengths, anchor) : null

  return (
    <Viewport
      fitPoints={taper ? [...points, ...taper] : points}
      fitKey={enabled ? "taper-on" : "taper-off"}
      showGrid={showGrid}
      onToggleGrid={onToggleGrid}
      onBackgroundClick={() => setEditing(null)}
      topLeft={
        <ToolbarGroup className="max-w-xs items-start gap-3 px-3.5 py-3">
          <label className="flex cursor-pointer items-start gap-3">
            <Switch
              checked={enabled}
              onCheckedChange={(value) => {
                onEnabledChange(value)
                setEditing(null)
              }}
              className="mt-0.5"
            />
            <span>
              <span className="block text-sm text-[var(--nb-primary)]">
                This flashing has a tapered edge
              </span>
              <span className="block text-xs text-[var(--nb-secondary)]">
                {enabled
                  ? "Click a length to set its size at the tapered end. Angles stay as designed."
                  : "Most flashings are the same width end to end. Skip this if yours is."}
              </span>
            </span>
          </label>
        </ToolbarGroup>
      }
      bottomLeft={enabled ? <TaperLegend /> : null}
    >
      {(api) => {
        const screen = points.map(api.toScreen)
        const taperScreen = taper ? taper.map(api.toScreen) : null
        const center = centroid(screen)
        const overlay = (
          <>
            {screen.slice(0, -1).map((a, i) => {
              const b = screen[i + 1]
              const n = outwardNormal(a, b, center)
              const mid = midpoint(a, b)
              const left = mid.x + n.x * 22
              const top = mid.y + n.y * 22
              const base = distance(points[i], points[i + 1])
              const tapered = lengths[i]
              const changed = tapered != null && Math.abs(tapered - base) > 0.5
              const label = changed ? `${formatMm(base)} → ${formatMm(tapered)}` : formatMm(base)

              if (enabled && editing === i) {
                return (
                  <TaperInput
                    key={`edit-${i}`}
                    left={left}
                    top={top}
                    base={base}
                    value={tapered ?? base}
                    onCommit={(value) => {
                      onLengthChange(i, Math.abs(value - base) < 0.5 ? null : value)
                      setEditing(null)
                    }}
                    onCancel={() => setEditing(null)}
                  />
                )
              }

              return enabled ? (
                <button
                  key={`label-${i}`}
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => setEditing(i)}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-md border px-1.5 py-0.5 text-xs whitespace-nowrap tabular-nums shadow-sm transition-colors",
                    changed
                      ? "border-[var(--nb-primary)] bg-[var(--nb-primary)] text-white"
                      : "border-black/10 bg-white text-[var(--nb-primary)] hover:border-black/30"
                  )}
                  style={{ left, top }}
                >
                  {label}
                </button>
              ) : (
                <span
                  key={`label-${i}`}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-xs text-[var(--nb-secondary)] tabular-nums"
                  style={{ left, top }}
                >
                  {label}
                </span>
              )
            })}
          </>
        )
        return { svg: <TaperLines base={screen} taper={taperScreen} />, overlay }
      }}
    </Viewport>
  )
}

function TaperInput({
  left,
  top,
  base,
  value,
  onCommit,
  onCancel,
}: {
  left: number
  top: number
  base: number
  value: number
  onCommit: (value: number) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(formatMm(value))
  const commit = () => {
    const next = Number(text)
    if (Number.isFinite(next) && next > 0 && next <= 2000) onCommit(next)
    else onCancel()
  }
  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-end gap-2 rounded-xl border border-black/[0.06] bg-white p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
      style={{ left, top }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-[var(--nb-secondary)]">
          Tapered length <span className="text-[#9CA3AF]">· was {formatMm(base)}</span>
        </span>
        <span className="relative">
          <Input
            type="text"
            inputMode="decimal"
            autoFocus
            value={text}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => setText(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit()
              if (event.key === "Escape") onCancel()
            }}
            className="h-8 w-28 pr-9 tabular-nums"
          />
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-[var(--nb-secondary)]">
            mm
          </span>
        </span>
      </label>
    </div>
  )
}
