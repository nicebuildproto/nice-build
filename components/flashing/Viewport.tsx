"use client"

import { boundsOf, type Point } from "@/lib/flashing/geometry"
import { Grid3x3, Hand, Maximize, Minus, Plus } from "lucide-react"
import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { IconButton, ToolbarGroup } from "./IconButton"
import { isTypingTarget } from "./hooks"

export type View = { scale: number; x: number; y: number }
type Size = { w: number; h: number }

export interface ViewportApi {
  size: Size
  scale: number
  panning: boolean
  toScreen: (point: Point) => Point
  clientToWorld: (clientX: number, clientY: number) => Point
}

const MIN_SCALE = 0.3
const MAX_SCALE = 12
const GRID_STEPS_MM = [5, 10, 20, 25, 50, 100, 200, 500]

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

function fitView(points: Point[], size: Size): View {
  const bounds = boundsOf(points)
  if (!bounds) return { scale: 2.5, x: size.w / 2, y: size.h / 2 }
  const padding = Math.min(96, Math.max(48, Math.min(size.w, size.h) * 0.14))
  const w = Math.max(bounds.maxX - bounds.minX, 60)
  const h = Math.max(bounds.maxY - bounds.minY, 60)
  const scale = clampScale(
    Math.min((size.w - padding * 2) / w, (size.h - padding * 2) / h, 6)
  )
  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2
  return { scale, x: size.w / 2 - cx * scale, y: size.h / 2 - cy * scale }
}

function zoomView(view: View, factor: number, sx: number, sy: number): View {
  const scale = clampScale(view.scale * factor)
  const ratio = scale / view.scale
  return { scale, x: sx - (sx - view.x) * ratio, y: sy - (sy - view.y) * ratio }
}

export function Viewport({
  fitPoints,
  fitKey,
  showGrid,
  onToggleGrid,
  onBackgroundClick,
  onHover,
  cursor = "default",
  topLeft,
  bottomLeft,
  children,
}: {
  fitPoints: Point[]
  fitKey: string
  showGrid: boolean
  onToggleGrid: () => void
  onBackgroundClick?: (world: Point) => void
  onHover?: (world: Point | null) => void
  cursor?: string
  topLeft?: ReactNode
  bottomLeft?: ReactNode
  children: (api: ViewportApi) => { svg: ReactNode; overlay?: ReactNode }
}) {
  const patternId = useId().replace(/:/g, "")
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null)
  const latestFitPoints = useRef(fitPoints)
  const gesture = useRef<{
    id: number
    startX: number
    startY: number
    lastX: number
    lastY: number
    moved: boolean
    clickable: boolean
  } | null>(null)

  const [size, setSize] = useState<Size | null>(null)
  const [view, setView] = useState<View | null>(null)
  const [fittedKey, setFittedKey] = useState(fitKey)
  const [panMode, setPanMode] = useState(false)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [grabbing, setGrabbing] = useState(false)

  if (fitKey !== fittedKey) {
    setFittedKey(fitKey)
    if (size) setView(fitView(fitPoints, size))
  }

  useEffect(() => {
    latestFitPoints.current = fitPoints
  })

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    let fitted = false
    const observer = new ResizeObserver(([entry]) => {
      const next = { w: entry.contentRect.width, h: entry.contentRect.height }
      if (next.w < 1 || next.h < 1) return
      setSize(next)
      if (!fitted) {
        fitted = true
        setView(fitView(latestFitPoints.current, next))
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      if ((event.target as HTMLElement).closest("[data-viewport-ignore]")) return
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      const sx = event.clientX - rect.left
      const sy = event.clientY - rect.top
      if (event.ctrlKey || event.metaKey) {
        const factor = Math.exp(-event.deltaY * 0.01)
        setView((current) => current && zoomView(current, factor, sx, sy))
      } else {
        setView((current) => current && { ...current, x: current.x - event.deltaX, y: current.y - event.deltaY })
      }
    }
    element.addEventListener("wheel", onWheel, { passive: false })
    return () => element.removeEventListener("wheel", onWheel)
  }, [])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isTypingTarget(event.target)) return
      event.preventDefault()
      setSpaceHeld(true)
    }
    const up = (event: KeyboardEvent) => {
      if (event.code === "Space") setSpaceHeld(false)
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  const panning = panMode || spaceHeld

  const clientToWorld = (clientX: number, clientY: number): Point => {
    const rect = svgElement?.getBoundingClientRect()
    if (!rect || !view) return { x: 0, y: 0 }
    return {
      x: (clientX - rect.left - view.x) / view.scale,
      y: (clientY - rect.top - view.y) / view.scale,
    }
  }

  const zoomBy = (factor: number) => {
    if (!size) return
    setView((current) => current && zoomView(current, factor, size.w / 2, size.h / 2))
  }

  const api: ViewportApi | null =
    view && size
      ? {
          size,
          scale: view.scale,
          panning,
          toScreen: (point) => ({ x: point.x * view.scale + view.x, y: point.y * view.scale + view.y }),
          clientToWorld,
        }
      : null

  const content = api ? children(api) : null
  const minorMm = view ? (GRID_STEPS_MM.find((step) => step * view.scale >= 22) ?? 500) : 10
  const minorPx = view ? minorMm * view.scale : 25
  const majorPx = minorPx * 5

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden bg-white select-none"
    >
      {view && size ? (
        <svg
          ref={setSvgElement}
          width={size.w}
          height={size.h}
          className="absolute inset-0"
          style={{ cursor: panning ? (grabbing ? "grabbing" : "grab") : cursor }}
          onPointerDown={(event) => {
            if (event.button === 2) return
            event.currentTarget.setPointerCapture(event.pointerId)
            gesture.current = {
              id: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              lastX: event.clientX,
              lastY: event.clientY,
              moved: false,
              clickable: !panning && event.button === 0,
            }
          }}
          onPointerMove={(event) => {
            const active = gesture.current
            if (active && active.id === event.pointerId) {
              if (!active.moved && Math.hypot(event.clientX - active.startX, event.clientY - active.startY) > 4) {
                active.moved = true
                setGrabbing(true)
              }
              if (active.moved) {
                const dx = event.clientX - active.lastX
                const dy = event.clientY - active.lastY
                setView((current) => current && { ...current, x: current.x + dx, y: current.y + dy })
              }
              active.lastX = event.clientX
              active.lastY = event.clientY
              return
            }
            onHover?.(panning ? null : clientToWorld(event.clientX, event.clientY))
          }}
          onPointerUp={(event) => {
            const active = gesture.current
            if (!active || active.id !== event.pointerId) return
            gesture.current = null
            setGrabbing(false)
            if (active.clickable && !active.moved) {
              onBackgroundClick?.(clientToWorld(event.clientX, event.clientY))
            }
          }}
          onPointerLeave={() => onHover?.(null)}
        >
          <defs>
            <pattern
              id={`${patternId}-minor`}
              width={minorPx}
              height={minorPx}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${view.x} ${view.y})`}
            >
              <path d={`M ${minorPx} 0 L 0 0 0 ${minorPx}`} fill="none" stroke="rgba(17,17,17,0.05)" strokeWidth={1} />
            </pattern>
            <pattern
              id={`${patternId}-major`}
              width={majorPx}
              height={majorPx}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${view.x} ${view.y})`}
            >
              <path d={`M ${majorPx} 0 L 0 0 0 ${majorPx}`} fill="none" stroke="rgba(17,17,17,0.08)" strokeWidth={1} />
            </pattern>
          </defs>
          {showGrid ? (
            <>
              <rect width={size.w} height={size.h} fill={`url(#${patternId}-minor)`} />
              <rect width={size.w} height={size.h} fill={`url(#${patternId}-major)`} />
            </>
          ) : null}
          {content?.svg}
        </svg>
      ) : null}

      {content?.overlay}

      {topLeft ? <div className="absolute top-3 left-3 flex items-start gap-2">{topLeft}</div> : null}

      <div className="absolute top-3 right-3">
        <ToolbarGroup>
          <IconButton label={showGrid ? "Hide grid" : "Show grid"} active={showGrid} onClick={onToggleGrid}>
            <Grid3x3 />
          </IconButton>
          <IconButton label="Pan (or hold Space)" active={panMode} onClick={() => setPanMode((value) => !value)}>
            <Hand />
          </IconButton>
          <span className="mx-0.5 h-4 w-px bg-black/[0.08]" />
          <IconButton label="Zoom out" onClick={() => zoomBy(1 / 1.25)}>
            <Minus />
          </IconButton>
          <IconButton label="Zoom in" onClick={() => zoomBy(1.25)}>
            <Plus />
          </IconButton>
          <IconButton label="Fit to screen" onClick={() => size && setView(fitView(fitPoints, size))}>
            <Maximize />
          </IconButton>
        </ToolbarGroup>
      </div>

      {bottomLeft ? (
        <div className="pointer-events-none absolute bottom-3 left-3 text-xs text-[var(--nb-secondary)]">
          {bottomLeft}
        </div>
      ) : null}
    </div>
  )
}
