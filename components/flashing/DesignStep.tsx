"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  centroid,
  distance,
  foldAngleAt,
  formatMm,
  girth,
  midpoint,
  normalOf,
  segmentAngle,
  snapPoint,
  type Point,
} from "@/lib/flashing/geometry"
import { isEndpoint, originIndex, type EditorAction, type EditorState } from "@/lib/flashing/editor"
import { templates } from "@/lib/flashing/templates"
import { cn } from "@/lib/utils"
import { LayoutTemplate, Redo2, SlidersHorizontal, Trash2, Undo2, X } from "lucide-react"
import { useEffect, useRef, useState, type Dispatch } from "react"
import { GirthReadout } from "./GirthReadout"
import { IconButton, ToolbarGroup } from "./IconButton"
import { ProfileIcon } from "./ProfileShape"
import { isTypingTarget } from "./hooks"
import { Viewport, type ViewportApi } from "./Viewport"

function outwardNormal(a: Point, b: Point, center: Point): Point {
  const n = normalOf(a, b)
  const mid = midpoint(a, b)
  const toward = (mid.x - center.x) * n.x + (mid.y - center.y) * n.y
  return toward < 0 ? { x: -n.x, y: -n.y } : n
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function DesignStep({
  editor,
  dispatch,
  snap,
  onSnapChange,
  showDims,
  onShowDimsChange,
  showGrid,
  onToggleGrid,
  onLoadTemplate,
  fitKey,
}: {
  editor: EditorState
  dispatch: Dispatch<EditorAction>
  snap: boolean
  onSnapChange: (value: boolean) => void
  showDims: boolean
  onShowDimsChange: (value: boolean) => void
  showGrid: boolean
  onToggleGrid: () => void
  onLoadTemplate: (id: string | null) => void
  fitKey: string
}) {
  const points = editor.present
  const selection = editor.selection
  const origin = originIndex(editor)
  const [hover, setHover] = useState<Point | null>(null)
  const [dragging, setDragging] = useState(false)
  const [touched, setTouched] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTab, setPanelTab] = useState<PanelTab>("options")
  const drag = useRef<{ index: number; id: number; x: number; y: number; started: boolean } | null>(null)

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

  const handleBackgroundClick = (world: Point) => {
    if (!canExtend) {
      dispatch({ type: "select", selection: null })
      return
    }
    const next = snapPoint(world, snap)
    if (origin !== null && distance(next, points[origin]) < 1) return
    setTouched(true)
    dispatch({ type: "addPoint", point: next })
  }

  const hint =
    points.length === 0
      ? null
      : selection?.kind === "segment"
        ? "Edit the length or angle, or press Delete to remove this segment."
        : canExtend
          ? "Drag points to adjust the profile · Click the highlighted end to extend"
          : "Press Delete to remove this point, or Esc to deselect."

  return (
    <div className="relative h-full">
      <Viewport
        fitPoints={points}
        fitKey={fitKey}
        showGrid={showGrid}
        onToggleGrid={onToggleGrid}
        onBackgroundClick={handleBackgroundClick}
        onHover={setHover}
        cursor={canExtend ? "crosshair" : "default"}
        topLeft={
          <>
            <ToolbarGroup>
              <IconButton
                label="Undo"
                disabled={editor.past.length === 0}
                onClick={() => dispatch({ type: "undo" })}
              >
                <Undo2 />
              </IconButton>
              <IconButton
                label="Redo"
                disabled={editor.future.length === 0}
                onClick={() => dispatch({ type: "redo" })}
              >
                <Redo2 />
              </IconButton>
            </ToolbarGroup>
            <ToolbarGroup className="flex-col items-start gap-0 px-3 py-1.5">
              <span className="text-[11px] leading-tight text-[var(--nb-secondary)]">Profile girth</span>
              <GirthReadout girthMm={girth(points)} className="text-sm leading-tight" />
            </ToolbarGroup>
          </>
        }
        bottomLeft={
          hint ? (
            <p
              className={cn(
                "max-w-[22rem] text-xs text-[var(--nb-secondary)] transition-opacity duration-500 motion-reduce:transition-none",
                touched && canExtend && selection?.kind !== "segment" && "opacity-40 motion-reduce:opacity-70"
              )}
            >
              {hint}
            </p>
          ) : null
        }
      >
        {(api) => renderCanvas(api)}
      </Viewport>

      <OptionsPanel
        open={panelOpen}
        tab={panelTab}
        onOpen={(tab) => {
          setPanelTab(tab)
          setPanelOpen(true)
        }}
        onClose={() => setPanelOpen(false)}
        snap={snap}
        onSnapChange={onSnapChange}
        showDims={showDims}
        onShowDimsChange={onShowDimsChange}
        onLoadTemplate={(id) => {
          onLoadTemplate(id)
          setPanelOpen(false)
        }}
      />
    </div>
  )

  function renderCanvas(api: ViewportApi) {
    const screen = points.map(api.toScreen)
    const center = centroid(screen)
    const interactive = !api.panning
    const showGhost = hover && !dragging && interactive && canExtend
    const ghost = showGhost ? api.toScreen(snapPoint(hover, snap)) : null
    const ghostFrom = ghost && origin !== null ? screen[origin] : null
    const ghostLength =
      showGhost && origin !== null ? distance(points[origin], snapPoint(hover, snap)) : 0

    const svg = (
      <g>
        {screen.slice(0, -1).map((a, i) => {
          const b = screen[i + 1]
          const selected = selection?.kind === "segment" && selection.index === i
          return (
            <g key={`seg-${i}`}>
              {selected ? (
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(17,17,17,0.1)" strokeWidth={12} strokeLinecap="round" />
              ) : null}
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--nb-primary)"
                strokeWidth={selected ? 2.75 : 2}
                strokeLinecap="round"
              />
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="transparent"
                strokeWidth={16}
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
              if (selection?.kind === "segment" && selection.index === i) return null
              const n = outwardNormal(a, b, center)
              const mid = midpoint(a, b)
              return (
                <text
                  key={`dim-${i}`}
                  x={mid.x + n.x * 14}
                  y={mid.y + n.y * 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none fill-[var(--nb-primary)] text-[12px] tabular-nums"
                  stroke="white"
                  strokeWidth={4}
                  paintOrder="stroke"
                >
                  {formatMm(distance(points[i], points[i + 1]))}
                </text>
              )
            })
          : null}

        {showDims
          ? screen.slice(1, -1).map((vertex, k) => {
              const i = k + 1
              const angle = foldAngleAt(points, i)
              if (angle > 179.5) return null
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
              return (
                <text
                  key={`ang-${i}`}
                  x={vertex.x + bx * 20}
                  y={vertex.y + by * 20}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none fill-[#6B7280] text-[11px] tabular-nums"
                >
                  {Math.round(angle)}°
                </text>
              )
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
            <circle cx={ghost.x} cy={ghost.y} r={4} fill="white" stroke="var(--nb-secondary)" strokeWidth={1.25} />
            {ghostFrom && ghostLength > 0 ? (
              <text
                x={ghost.x + 10}
                y={ghost.y - 10}
                className="fill-[var(--nb-secondary)] text-[11px] tabular-nums"
                stroke="white"
                strokeWidth={4}
                paintOrder="stroke"
              >
                {formatMm(ghostLength)} mm
              </text>
            ) : null}
          </g>
        ) : null}

        {screen.map((point, index) => {
          const selected = selection?.kind === "point" && selection.index === index
          const isOrigin = canExtend && origin === index
          return (
            <g key={`pt-${index}`}>
              {isOrigin ? (
                <circle cx={point.x} cy={point.y} r={12} fill="rgba(17,17,17,0.06)" stroke="rgba(17,17,17,0.35)" strokeWidth={1.25} className="pointer-events-none" />
              ) : null}
              {selected ? (
                <circle cx={point.x} cy={point.y} r={10} fill="none" stroke="var(--nb-primary)" strokeWidth={1.5} className="pointer-events-none" />
              ) : null}
              <circle
                cx={point.x}
                cy={point.y}
                r={selected ? 6.5 : 5}
                fill={selected ? "var(--nb-primary)" : "white"}
                stroke="var(--nb-primary)"
                strokeWidth={1.75}
                className="pointer-events-none"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={13}
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
                    setDragging(true)
                    setTouched(true)
                    dispatch({ type: "beginDrag" })
                  }
                  dispatch({
                    type: "dragPoint",
                    index: active.index,
                    point: snapPoint(api.clientToWorld(event.clientX, event.clientY), snap),
                  })
                }}
                onPointerUp={() => {
                  drag.current = null
                  setDragging(false)
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
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-full bg-white/90 px-4 py-2 text-sm text-[var(--nb-secondary)]">
            Click anywhere to place the first point.
          </p>
        </div>
      )
    } else if (points.length === 1 && !dragging) {
      const p = screen[0]
      overlay = (
        <p
          className="pointer-events-none absolute -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs text-[var(--nb-secondary)]"
          style={{ left: p.x, top: p.y + 18 }}
        >
          Click again to draw the first segment.
        </p>
      )
    } else if (selection?.kind === "segment" && selection.index < points.length - 1 && !dragging) {
      const i = selection.index
      const a = screen[i]
      const b = screen[i + 1]
      const n = outwardNormal(a, b, center)
      const mid = midpoint(a, b)
      const length = distance(points[i], points[i + 1])
      const angle = segmentAngle(points, i)
      const offset = 28 + Math.abs(n.x) * 130 + Math.abs(n.y) * 40
      overlay = (
        <SegmentEditor
          key={`${i}:${Math.round(length * 10)}:${Math.round(angle * 10)}`}
          left={clamp(mid.x + n.x * offset, 150, api.size.w - 150)}
          top={clamp(mid.y + n.y * offset, 90, api.size.h - 60)}
          length={length}
          angle={angle}
          isFirst={i === 0}
          onLength={(lengthMm) => dispatch({ type: "setLength", index: i, lengthMm })}
          onAngle={(angleDeg) => dispatch({ type: "setAngle", index: i, angleDeg })}
          onDelete={() => dispatch({ type: "deleteSelection" })}
        />
      )
    } else if (selection?.kind === "point" && selection.index < points.length && !dragging) {
      const p = screen[selection.index]
      const extending = canExtend && points.length > 1
      overlay = (
        <div
          className="absolute flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-full border border-black/[0.06] bg-white py-0.5 pr-0.5 pl-3 shadow-sm"
          style={{ left: clamp(p.x, 90, api.size.w - 90), top: Math.max(p.y - 18, 44) }}
        >
          <span className="text-xs text-[var(--nb-secondary)]">
            {extending ? "Extending from here" : "Point"}
          </span>
          <IconButton label="Delete point" onClick={() => dispatch({ type: "deleteSelection" })} side="top">
            <Trash2 />
          </IconButton>
        </div>
      )
    }

    return { svg, overlay }
  }
}

function SegmentEditor({
  left,
  top,
  length,
  angle,
  isFirst,
  onLength,
  onAngle,
  onDelete,
}: {
  left: number
  top: number
  length: number
  angle: number
  isFirst: boolean
  onLength: (value: number) => void
  onAngle: (value: number) => void
  onDelete: () => void
}) {
  const [lengthText, setLengthText] = useState(formatMm(length))
  const [angleText, setAngleText] = useState(String(Math.round(angle)))

  const commitLength = () => {
    const value = Number(lengthText)
    if (Number.isFinite(value) && value > 0 && value <= 2000) {
      if (Math.abs(value - length) > 0.01) onLength(value)
    } else {
      setLengthText(formatMm(length))
    }
  }

  const commitAngle = () => {
    const value = Number(angleText)
    const [min, max] = isFirst ? [-180, 180] : [0, 180]
    if (Number.isFinite(value) && value >= min && value <= max) {
      if (Math.abs(value - angle) > 0.01) onAngle(value)
    } else {
      setAngleText(String(Math.round(angle)))
    }
  }

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-end gap-2 rounded-xl border border-black/[0.06] bg-white p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
      style={{ left, top }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <InlineField
        label="Length"
        suffix="mm"
        value={lengthText}
        onChange={setLengthText}
        onCommit={commitLength}
        onCancel={() => setLengthText(formatMm(length))}
        autoFocus
      />
      <InlineField
        label={isFirst ? "Angle from level" : "Fold angle"}
        suffix="°"
        value={angleText}
        onChange={setAngleText}
        onCommit={commitAngle}
        onCancel={() => setAngleText(String(Math.round(angle)))}
      />
      <IconButton label="Delete segment" onClick={onDelete} side="top" className="mb-0.5">
        <Trash2 />
      </IconButton>
    </div>
  )
}

function InlineField({
  label,
  suffix,
  value,
  onChange,
  onCommit,
  onCancel,
  autoFocus,
}: {
  label: string
  suffix: string
  value: string
  onChange: (value: string) => void
  onCommit: () => void
  onCancel: () => void
  autoFocus?: boolean
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-[var(--nb-secondary)]">{label}</span>
      <span className="relative">
        <Input
          type="text"
          inputMode="decimal"
          value={value}
          autoFocus={autoFocus}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onCommit()
              event.currentTarget.blur()
            } else if (event.key === "Escape") {
              event.stopPropagation()
              onCancel()
              event.currentTarget.blur()
            }
          }}
          className="h-8 w-24 pr-9 tabular-nums"
        />
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-[var(--nb-secondary)]">
          {suffix}
        </span>
      </span>
    </label>
  )
}

type PanelTab = "options" | "templates"

function OptionsPanel({
  open,
  tab,
  onOpen,
  onClose,
  snap,
  onSnapChange,
  showDims,
  onShowDimsChange,
  onLoadTemplate,
}: {
  open: boolean
  tab: PanelTab
  onOpen: (tab: PanelTab) => void
  onClose: () => void
  snap: boolean
  onSnapChange: (value: boolean) => void
  showDims: boolean
  onShowDimsChange: (value: boolean) => void
  onLoadTemplate: (id: string | null) => void
}) {
  return (
    <>
      <div
        className={cn(
          "absolute top-1/2 right-3 -translate-y-1/2 transition-opacity duration-200",
          open && "pointer-events-none opacity-0"
        )}
      >
        <ToolbarGroup className="flex-col">
          <IconButton label="Canvas settings" side="left" onClick={() => onOpen("options")}>
            <SlidersHorizontal />
          </IconButton>
          <IconButton label="Start from a template" side="left" onClick={() => onOpen("templates")}>
            <LayoutTemplate />
          </IconButton>
        </ToolbarGroup>
      </div>

      <aside
        data-viewport-ignore
        inert={!open}
        className={cn(
          "absolute top-16 right-3 bottom-3 flex w-72 flex-col rounded-2xl border border-black/[0.06] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out",
          open ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-4 opacity-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
          <div className="flex gap-1">
            {(["options", "templates"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onOpen(key)}
                className={cn(
                  "rounded-md px-2 py-1 text-sm transition-colors",
                  tab === key
                    ? "bg-[var(--nb-accent)] text-[var(--nb-primary)]"
                    : "text-[var(--nb-secondary)] hover:text-[var(--nb-primary)]"
                )}
              >
                {key === "options" ? "Options" : "Templates"}
              </button>
            ))}
          </div>
          <IconButton label="Close" side="left" onClick={onClose}>
            <X />
          </IconButton>
        </div>

        {tab === "templates" ? (
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            <p className="px-2 pt-1 pb-2 text-xs text-[var(--nb-secondary)]">
              Replaces the current shape. You can undo this.
            </p>
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onLoadTemplate(template.id)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--nb-accent)]"
              >
                <ProfileIcon points={template.points} className="h-8 w-12 shrink-0 text-[var(--nb-primary)]" />
                <span className="text-sm text-[var(--nb-primary)]">{template.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => onLoadTemplate(null)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-[var(--nb-secondary)] transition-colors hover:bg-[var(--nb-accent)] hover:text-[var(--nb-primary)]"
            >
              <span className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md border border-dashed border-black/15">
                +
              </span>
              Blank canvas
            </button>
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <SettingRow
              label="Snap to 5 mm"
              description="Points land on a 5 mm grid as you place and drag them."
              checked={snap}
              onChange={onSnapChange}
            />
            <SettingRow
              label="Show dimensions"
              description="Lengths and fold angles on the canvas."
              checked={showDims}
              onChange={onShowDimsChange}
            />
            <div className="border-t border-black/[0.06] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLoadTemplate(null)}
                className="w-full"
              >
                Clear the canvas
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

function SettingRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm text-[var(--nb-primary)]">{label}</span>
        <span className="block text-xs text-[var(--nb-secondary)]">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
    </label>
  )
}
