"use client"

import {
  centroid,
  distance,
  foldAngleAt,
  formatMm,
  liveExtendAngle,
  midpoint,
  normalOf,
  segmentAngle,
  snapPoint,
  type Point,
} from "@/lib/flashing/geometry"
import { isEndpoint, originIndex, type EditorAction, type EditorState } from "@/lib/flashing/editor"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState, type Dispatch, type RefObject } from "react"
import { isTypingTarget } from "./hooks"
import { Viewport, type ViewportApi, type ViewportControls, type ViewportInset } from "./Viewport"

function outwardNormal(a: Point, b: Point, center: Point): Point {
  const n = normalOf(a, b)
  const mid = midpoint(a, b)
  const toward = (mid.x - center.x) * n.x + (mid.y - center.y) * n.y
  return toward < 0 ? { x: -n.x, y: -n.y } : n
}

const CHIP_H = 20

/** A 12px label on a soft chip so grid lines never run through the number. Constant size on screen. */
function Chip({
  x,
  y,
  text,
  strong = false,
  hit = 0,
  onSelect,
}: {
  x: number
  y: number
  text: string
  strong?: boolean
  /** Minimum tap target (px) when the label is tappable. */
  hit?: number
  onSelect?: () => void
}) {
  const width = text.length * 7.2 + 12
  return (
    <g>
      <rect
        x={x - width / 2}
        y={y - CHIP_H / 2}
        width={width}
        height={CHIP_H}
        rx={6}
        fill="var(--background)"
        fillOpacity={0.92}
        stroke="var(--border)"
        className="pointer-events-none"
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className={cn(
          "pointer-events-none text-xs tabular-nums",
          strong ? "fill-[var(--nb-primary)] font-medium" : "fill-[var(--nb-secondary)]"
        )}
      >
        {text}
      </text>
      {onSelect ? (
        <rect
          x={x - Math.max(width, hit) / 2}
          y={y - Math.max(CHIP_H, hit) / 2}
          width={Math.max(width, hit)}
          height={Math.max(CHIP_H, hit)}
          fill="transparent"
          style={{ cursor: "pointer" }}
          onPointerDown={(event) => {
            event.stopPropagation()
            onSelect()
          }}
        />
      ) : null}
    </g>
  )
}

function AngleMark({
  vertex,
  armA,
  armB,
  degrees,
}: {
  vertex: Point
  armA: Point
  armB: Point
  degrees: number
}) {
  const la = Math.hypot(armA.x - vertex.x, armA.y - vertex.y) || 1
  const lb = Math.hypot(armB.x - vertex.x, armB.y - vertex.y) || 1
  const ua = { x: (armA.x - vertex.x) / la, y: (armA.y - vertex.y) / la }
  const ub = { x: (armB.x - vertex.x) / lb, y: (armB.y - vertex.y) / lb }
  const r = 22
  const start = { x: vertex.x + ua.x * r, y: vertex.y + ua.y * r }
  const end = { x: vertex.x + ub.x * r, y: vertex.y + ub.y * r }
  const sweep = ua.x * ub.y - ua.y * ub.x > 0 ? 1 : 0
  let bx = ua.x + ub.x
  let by = ua.y + ub.y
  const bl = Math.hypot(bx, by)
  if (bl < 1e-6) {
    bx = -ub.y
    by = ub.x
  } else {
    bx /= bl
    by /= bl
  }
  return (
    <g className="pointer-events-none">
      <path
        d={`M${start.x} ${start.y} A ${r} ${r} 0 0 ${sweep} ${end.x} ${end.y}`}
        fill="none"
        stroke="var(--nb-secondary)"
        strokeWidth={1.25}
      />
      <Chip x={vertex.x + bx * 44} y={vertex.y + by * 44} text={`${Math.round(degrees)}°`} strong />
    </g>
  )
}

export function DesignStep({
  editor,
  dispatch,
  snap,
  showDims,
  showGrid,
  fitKey,
  compact,
  onEdited,
  controlsRef,
  onPanModeChange,
  fitInset,
}: {
  editor: EditorState
  dispatch: Dispatch<EditorAction>
  snap: boolean
  showDims: boolean
  showGrid: boolean
  fitKey: string
  /** Small screens: angle labels only for the selected point. */
  compact: boolean
  /** Called on the first successful drag or extend. */
  onEdited?: () => void
  controlsRef?: RefObject<ViewportControls | null>
  onPanModeChange?: (on: boolean) => void
  fitInset?: ViewportInset
}) {
  const points = editor.present
  const selection = editor.selection
  const origin = originIndex(editor)
  const [hover, setHover] = useState<Point | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const dragging = dragIndex !== null
  const drag = useRef<{ index: number; id: number; x: number; y: number; started: boolean } | null>(null)
  const queued = useRef<{ index: number; point: Point } | null>(null)
  const frame = useRef(0)
  const hoverFrame = useRef(0)
  const hoverQueued = useRef<Point | null>(null)

  const canExtend =
    !selection || (selection.kind === "point" && isEndpoint(points, selection.index) !== null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      const mod = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()
      if (mod && key === "z") {
        event.preventDefault()
        dispatch({ type: event.shiftKey ? "redo" : "undo" })
      } else if (mod && key === "y") {
        event.preventDefault()
        dispatch({ type: "redo" })
      } else if ((event.key === "Delete" || event.key === "Backspace") && selection) {
        event.preventDefault()
        dispatch({ type: "deleteSelection" })
      } else if (event.key === "Escape") {
        dispatch({ type: "select", selection: null })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [dispatch, selection])

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current)
      cancelAnimationFrame(hoverFrame.current)
    },
    []
  )

  const handleBackgroundClick = (world: Point) => {
    if (!canExtend) {
      dispatch({ type: "select", selection: null })
      return
    }
    const next = snapPoint(world, snap)
    if (origin !== null && distance(next, points[origin]) < 1) return
    onEdited?.()
    dispatch({ type: "addPoint", point: next })
  }

  const flushDrag = () => {
    cancelAnimationFrame(frame.current)
    frame.current = 0
    const next = queued.current
    queued.current = null
    if (next) dispatch({ type: "dragPoint", index: next.index, point: next.point })
  }

  const queueHover = (world: Point | null) => {
    hoverQueued.current = world
    if (hoverFrame.current) return
    hoverFrame.current = requestAnimationFrame(() => {
      hoverFrame.current = 0
      setHover(hoverQueued.current)
    })
  }

  return (
    <Viewport
      fitPoints={points}
      fitKey={fitKey}
      showGrid={showGrid}
      onBackgroundClick={handleBackgroundClick}
      onHover={queueHover}
      cursor={canExtend ? "crosshair" : "default"}
      controlsRef={controlsRef}
      onPanModeChange={onPanModeChange}
      fitInset={fitInset}
    >
      {(api) => renderCanvas(api)}
    </Viewport>
  )

  function renderCanvas(api: ViewportApi) {
    const screen = points.map(api.toScreen)
    const center = centroid(screen)
    const interactive = !api.panning
    const showGhost = hover && !dragging && interactive && canExtend && !api.coarse
    const ghost = showGhost ? api.toScreen(snapPoint(hover, snap)) : null
    const ghostFrom = ghost && origin !== null ? screen[origin] : null
    const ghostLength =
      showGhost && origin !== null ? distance(points[origin], snapPoint(hover, snap)) : 0
    const liveAngle =
      showGhost && origin !== null ? liveExtendAngle(points, origin, snapPoint(hover, snap)) : null
    const liveArm =
      origin === 0 && points.length >= 2
        ? screen[1]
        : origin !== null && origin === points.length - 1 && points.length >= 2
          ? screen[origin - 1]
          : origin !== null && points.length === 1
            ? { x: screen[origin].x + 40, y: screen[origin].y }
            : null
    const pointRadius = api.coarse ? 24 : 16
    const segmentHit = api.coarse ? 32 : 20
    const tapTarget = api.coarse ? 44 : 0

    const selectedPoint = selection?.kind === "point" ? selection.index : null
    const angleVisible = (i: number) =>
      !compact ||
      selectedPoint === i ||
      (selection?.kind === "segment" && (selection.index === i || selection.index + 1 === i))

    const svg = (
      <g>
        {screen.slice(0, -1).map((a, i) => {
          const b = screen[i + 1]
          const selected = selection?.kind === "segment" && selection.index === i
          return (
            <g key={`seg-${i}`}>
              {selected ? (
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--nb-primary)" strokeOpacity={0.12} strokeWidth={12} strokeLinecap="round" />
              ) : null}
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--nb-primary)"
                strokeWidth={selected ? 3 : 2}
                strokeLinecap="round"
              />
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="transparent"
                strokeWidth={segmentHit}
                style={{ cursor: "pointer", pointerEvents: interactive ? "stroke" : "none" }}
                onPointerDown={(event) => {
                  event.stopPropagation()
                  dispatch({ type: "select", selection: { kind: "segment", index: i } })
                }}
              />
            </g>
          )
        })}

        {showDims
          ? screen.slice(0, -1).map((a, i) => {
              const b = screen[i + 1]
              const n = outwardNormal(a, b, center)
              const mid = midpoint(a, b)
              return (
                <Chip
                  key={`dim-${i}`}
                  x={mid.x + n.x * 22}
                  y={mid.y + n.y * 22}
                  text={formatMm(distance(points[i], points[i + 1]))}
                  strong={selection?.kind === "segment" && selection.index === i}
                  hit={tapTarget}
                  onSelect={() => dispatch({ type: "select", selection: { kind: "segment", index: i } })}
                />
              )
            })
          : null}

        {showDims
          ? screen.slice(1, -1).map((vertex, k) => {
              const i = k + 1
              const angle = foldAngleAt(points, i)
              if (angle > 179.5 || !angleVisible(i)) return null
              const a = screen[i - 1]
              const c = screen[i + 1]
              const ua = { x: a.x - vertex.x, y: a.y - vertex.y }
              const uc = { x: c.x - vertex.x, y: c.y - vertex.y }
              const la = Math.hypot(ua.x, ua.y) || 1
              const lc = Math.hypot(uc.x, uc.y) || 1
              let bx = ua.x / la + uc.x / lc
              let by = ua.y / la + uc.y / lc
              const bl = Math.hypot(bx, by)
              if (bl < 1e-6) {
                bx = -uc.y / lc
                by = uc.x / lc
              } else {
                bx /= bl
                by /= bl
              }
              return <Chip key={`ang-${i}`} x={vertex.x + bx * 30} y={vertex.y + by * 30} text={`${Math.round(angle)}°`} />
            })
          : null}

        {ghost ? (
          <g className="pointer-events-none">
            {ghostFrom ? (
              <line
                x1={ghostFrom.x}
                y1={ghostFrom.y}
                x2={ghost.x}
                y2={ghost.y}
                stroke="var(--nb-secondary)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            ) : null}
            <circle cx={ghost.x} cy={ghost.y} r={4} fill="var(--background)" stroke="var(--nb-secondary)" strokeWidth={1.25} />
            {ghostFrom && ghostLength > 0 ? (
              <Chip x={ghost.x + 36} y={ghost.y - 18} text={`${formatMm(ghostLength)} mm`} strong />
            ) : null}
            {ghostFrom && liveAngle !== null && liveArm && origin !== null ? (
              <AngleMark vertex={ghostFrom} armA={liveArm} armB={ghost} degrees={liveAngle} />
            ) : null}
          </g>
        ) : null}

        {screen.map((point, index) => {
          const selected = selectedPoint === index
          const isOrigin = canExtend && origin === index
          return (
            <g key={`pt-${index}`}>
              {isOrigin ? (
                <circle cx={point.x} cy={point.y} r={12} fill="var(--nb-primary)" fillOpacity={0.06} stroke="var(--nb-primary)" strokeOpacity={0.35} strokeWidth={1.25} className="pointer-events-none" />
              ) : null}
              {selected ? (
                <circle cx={point.x} cy={point.y} r={10} fill="none" stroke="var(--nb-primary)" strokeWidth={1.5} className="pointer-events-none" />
              ) : null}
              <circle
                cx={point.x}
                cy={point.y}
                r={selected ? 6.5 : 5}
                fill={selected ? "var(--nb-primary)" : "var(--background)"}
                stroke="var(--nb-primary)"
                strokeWidth={1.75}
                className="pointer-events-none"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={pointRadius}
                fill="transparent"
                style={{ cursor: dragging ? "grabbing" : "grab", pointerEvents: interactive ? "all" : "none" }}
                onPointerDown={(event) => {
                  event.stopPropagation()
                  event.currentTarget.setPointerCapture(event.pointerId)
                  dispatch({ type: "select", selection: { kind: "point", index } })
                  drag.current = { index, id: event.pointerId, x: event.clientX, y: event.clientY, started: false }
                }}
                onPointerMove={(event) => {
                  const active = drag.current
                  if (!active || active.id !== event.pointerId) return
                  if (!active.started) {
                    if (Math.hypot(event.clientX - active.x, event.clientY - active.y) < 3) return
                    active.started = true
                    setDragIndex(active.index)
                    onEdited?.()
                    dispatch({ type: "beginDrag" })
                  }
                  queued.current = {
                    index: active.index,
                    point: snapPoint(api.clientToWorld(event.clientX, event.clientY), snap),
                  }
                  if (!frame.current) {
                    frame.current = requestAnimationFrame(() => {
                      frame.current = 0
                      flushDrag()
                    })
                  }
                }}
                onPointerUp={() => {
                  flushDrag()
                  drag.current = null
                  setDragIndex(null)
                }}
                onPointerCancel={() => {
                  flushDrag()
                  drag.current = null
                  setDragIndex(null)
                }}
              />
            </g>
          )
        })}
      </g>
    )

    let overlay = null
    if (points.length === 0) {
      overlay = (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <p className="rounded-full border border-border bg-card px-4 py-2 text-center text-sm text-muted-foreground">
            {api.coarse ? "Tap" : "Click"} anywhere to place the first point.
          </p>
        </div>
      )
    } else if (points.length === 1 && !dragging) {
      const p = screen[0]
      overlay = (
        <p
          className="pointer-events-none absolute -translate-x-1/2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
          style={{ left: p.x, top: p.y + 22 }}
        >
          {api.coarse ? "Tap" : "Click"} again to draw the first segment.
        </p>
      )
    } else if (dragIndex !== null && api.coarse && dragIndex < points.length) {
      // Live readout, held clear of the finger.
      const i = dragIndex
      const p = screen[i]
      const from = i > 0 ? i - 1 : 0
      const length = distance(points[from], points[from + 1])
      const angle = i > 0 && i < points.length - 1 ? foldAngleAt(points, i) : segmentAngle(points, from)
      overlay = (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium tabular-nums shadow-[0_6px_16px_-8px_rgba(24,24,27,0.3)]"
          style={{ left: Math.min(Math.max(p.x, 80), api.size.w - 80), top: Math.max(p.y - 56, 24) }}
        >
          {formatMm(length)} mm · {Math.round(angle)}°
        </div>
      )
    }

    return { svg, overlay }
  }
}
