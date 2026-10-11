"use client"

import { Input } from "@/components/ui/input"
import { centroid, distance, formatMm, midpoint, normalOf, taperedPoints, type Point } from "@/lib/flashing/geometry"
import { cn } from "@/lib/utils"
import { useState, type RefObject } from "react"
import { flashingFloat } from "./chrome"
import { toPath } from "./ProfileShape"
import { Viewport, type ViewportControls, type ViewportInset } from "./Viewport"

export function outwardNormal(a: Point, b: Point, center: Point): Point {
  const n = normalOf(a, b)
  const mid = midpoint(a, b)
  const toward = (mid.x - center.x) * n.x + (mid.y - center.y) * n.y
  return toward < 0 ? { x: -n.x, y: -n.y } : n
}

export function TaperLegend() {
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <svg width="22" height="6" aria-hidden>
          <line x1="0" y1="3" x2="22" y2="3" stroke="var(--nb-secondary)" strokeWidth="1.75" />
        </svg>
        Square end
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="22" height="6" aria-hidden>
          <line x1="0" y1="3" x2="22" y2="3" stroke="var(--nb-primary)" strokeWidth="2" strokeDasharray="5 3" />
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
              stroke="var(--nb-secondary)"
              strokeOpacity={0.45}
              strokeWidth={1}
              strokeDasharray="2 3"
            />
          ))
        : null}
      <path
        d={toPath(base)}
        fill="none"
        stroke={taper ? "var(--nb-secondary)" : "var(--nb-primary)"}
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
  lengths,
  onLengthChange,
  anchor,
  showGrid,
  controlsRef,
  onPanModeChange,
  fitInset,
}: {
  points: Point[]
  enabled: boolean
  lengths: (number | null)[]
  onLengthChange: (index: number, value: number | null) => void
  anchor: number
  showGrid: boolean
  controlsRef?: RefObject<ViewportControls | null>
  onPanModeChange?: (on: boolean) => void
  fitInset?: ViewportInset
}) {
  const [editing, setEditing] = useState<number | null>(null)
  const taper = enabled ? taperedPoints(points, lengths, anchor) : null

  return (
    <Viewport
      fitPoints={taper ? [...points, ...taper] : points}
      fitKey={enabled ? "taper-on" : "taper-off"}
      showGrid={showGrid}
      controlsRef={controlsRef}
      onPanModeChange={onPanModeChange}
      fitInset={fitInset}
      onBackgroundClick={() => setEditing(null)}
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
              const left = mid.x + n.x * 28
              const top = mid.y + n.y * 28
              const base = distance(points[i], points[i + 1])
              const tapered = lengths[i]
              const changed = tapered != null && Math.abs(tapered - base) > 0.5
              const label = changed ? `${formatMm(base)} → ${formatMm(tapered)}` : formatMm(base)

              if (enabled && editing === i) {
                return (
                  <TaperInput
                    key={`edit-${i}`}
                    left={Math.min(Math.max(left, 110), api.size.w - 110)}
                    top={Math.min(Math.max(top, 70), api.size.h - 70)}
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
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-md border px-2 text-xs whitespace-nowrap tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    api.coarse ? "min-h-11 min-w-11" : "min-h-7",
                    changed
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-foreground/30"
                  )}
                  style={{ left, top }}
                >
                  {label}
                </button>
              ) : (
                <span
                  key={`label-${i}`}
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card/90 px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums"
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
      className={cn(flashingFloat, "absolute flex -translate-x-1/2 -translate-y-1/2 items-end gap-2 rounded-xl p-3")}
      style={{ left, top }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          Tapered length · was {formatMm(base)}
        </span>
        <span className="relative">
          <Input
            type="text"
            inputMode="decimal"
            enterKeyHint="done"
            autoFocus
            value={text}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => setText(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit()
              if (event.key === "Escape") onCancel()
            }}
            className="h-10 w-32 pr-10 text-base tabular-nums md:text-sm"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
            mm
          </span>
        </span>
      </label>
    </div>
  )
}
