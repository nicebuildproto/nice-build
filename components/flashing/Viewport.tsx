"use client"

import { boundsOf, type Point } from "@/lib/flashing/geometry"
import { useEffect, useId, useRef, useState, type RefObject, type ReactNode } from "react"
import { isTypingTarget, useMediaQuery } from "./hooks"

export type View = { scale: number; x: number; y: number }
type Size = { w: number; h: number }

export interface ViewportApi {
  size: Size
  scale: number
  panning: boolean
  /** Touch input: bigger hit areas, no hover affordances. */
  coarse: boolean
  toScreen: (point: Point) => Point
  clientToWorld: (clientX: number, clientY: number) => Point
}

export type ViewportControls = {
  zoomBy: (factor: number) => void
  fit: () => void
  togglePan: () => void
}

export type ViewportInset = { top: number; right: number; bottom: number; left: number }

const zeroInset: ViewportInset = { top: 0, right: 0, bottom: 0, left: 0 }

const MIN_SCALE = 0.3
const MAX_SCALE = 12
/** Fitting never zooms past this, so a tiny profile is not blown up absurdly. */
const MAX_FIT_SCALE = 4
const GRID_STEPS_MM = [5, 10, 20, 25, 50, 100, 200, 500]
const DOUBLE_TAP_MS = 300

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

function fitView(points: Point[], size: Size, inset: ViewportInset = zeroInset): View {
  const viewW = Math.max(80, size.w - inset.left - inset.right)
  const viewH = Math.max(80, size.h - inset.top - inset.bottom)
  const bounds = boundsOf(points)
  const cxScreen = inset.left + viewW / 2
  const cyScreen = inset.top + viewH / 2
  if (!bounds) return { scale: 2.5, x: cxScreen, y: cyScreen }
  const padding = Math.min(48, Math.max(16, Math.min(viewW, viewH) * 0.06))
  const w = Math.max(bounds.maxX - bounds.minX, 60)
  const h = Math.max(bounds.maxY - bounds.minY, 60)
  const scale = clampScale(Math.min((viewW - padding * 2) / w, (viewH - padding * 2) / h, MAX_FIT_SCALE))
  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2
  return { scale, x: cxScreen - cx * scale, y: cyScreen - cy * scale }
}

function zoomView(view: View, factor: number, sx: number, sy: number): View {
  const scale = clampScale(view.scale * factor)
  const ratio = scale / view.scale
  return { scale, x: sx - (sx - view.x) * ratio, y: sy - (sy - view.y) * ratio }
}

/**
 * The drawing surface. One full-bleed layer: the grid is drawn inside it and scales with zoom,
 * so nothing under floating chrome is ever clipped. Gestures: wheel and drag pan, pinch zooms,
 * double-tap fits. The fit follows `fitInset` until the user pans or zooms by hand.
 */
export function Viewport({
  fitPoints,
  fitKey,
  showGrid,
  onBackgroundClick,
  onHover,
  cursor = "default",
  controlsRef,
  onPanModeChange,
  fitInset,
  children,
}: {
  fitPoints: Point[]
  fitKey: string
  showGrid: boolean
  onBackgroundClick?: (world: Point) => void
  onHover?: (world: Point | null) => void
  cursor?: string
  controlsRef?: RefObject<ViewportControls | null>
  onPanModeChange?: (on: boolean) => void
  /** Keep the fitted profile inside this visible region of the full stage. */
  fitInset?: ViewportInset
  children: (api: ViewportApi) => { svg: ReactNode; overlay?: ReactNode }
}) {
  const patternId = useId().replace(/:/g, "")
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgElement, setSvgElement] = useState<SVGSVGElement | null>(null)
  const latestFitPoints = useRef(fitPoints)
  const coarse = useMediaQuery("(pointer: coarse)")
  const gesture = useRef<{
    id: number
    startX: number
    startY: number
    lastX: number
    lastY: number
    moved: boolean
    clickable: boolean
  } | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null)
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null)
  const pendingTap = useRef<number | null>(null)

  const [size, setSize] = useState<Size | null>(null)
  const [view, setView] = useState<View | null>(null)
  const [fittedKey, setFittedKey] = useState(fitKey)
  const [panMode, setPanMode] = useState(false)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [grabbing, setGrabbing] = useState(false)
  const inset = fitInset ?? zeroInset
  const insetRef = useRef(inset)
  const previousInset = useRef(inset)
  const autoFit = useRef(true)

  useEffect(() => {
    insetRef.current = inset
  })

  if (fitKey !== fittedKey) {
    setFittedKey(fitKey)
    if (size) setView(fitView(fitPoints, size, inset))
  }

  useEffect(() => {
    autoFit.current = true
  }, [fitKey])

  useEffect(() => {
    latestFitPoints.current = fitPoints
  })

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    let fitted = false
    let frame = 0
    const read = () => {
      const w = Math.round(element.clientWidth)
      const h = Math.round(element.clientHeight)
      if (w < 1 || h < 1) return
      setSize((current) => (current && current.w === w && current.h === h ? current : { w, h }))
      if (!fitted) {
        fitted = true
        setView(fitView(latestFitPoints.current, { w, h }, insetRef.current))
      }
    }
    read()
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(read)
    })
    observer.observe(element)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
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
      autoFit.current = false
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

  useEffect(() => {
    onPanModeChange?.(panning)
  }, [onPanModeChange, panning])

  const fitNow = () => {
    const element = containerRef.current
    if (!element) return
    const next = { w: element.clientWidth, h: element.clientHeight }
    if (next.w < 1 || next.h < 1) return
    autoFit.current = true
    setView(fitView(latestFitPoints.current, next, insetRef.current))
    setPanMode(false)
  }

  useEffect(() => {
    if (!controlsRef) return
    controlsRef.current = {
      zoomBy(factor) {
        const element = containerRef.current
        if (!element) return
        const rect = element.getBoundingClientRect()
        const free = insetRef.current
        autoFit.current = false
        setView(
          (current) =>
            current &&
            zoomView(
              current,
              factor,
              free.left + (rect.width - free.left - free.right) / 2,
              free.top + (rect.height - free.top - free.bottom) / 2
            )
        )
      },
      fit: fitNow,
      togglePan() {
        setPanMode((value) => !value)
      },
    }
    return () => {
      controlsRef.current = null
    }
    // fitNow only touches refs and stable setters.
  }, [controlsRef])

  // Re-fit when the free area changes, but never while a finger or mouse is down.
  // After a manual pan or zoom, keep the drawing centred in the free area instead.
  useEffect(() => {
    if (!size) return
    if (pointers.current.size > 0 || gesture.current) return
    const previous = previousInset.current
    previousInset.current = inset
    if (autoFit.current) {
      setView(fitView(latestFitPoints.current, size, inset))
      return
    }
    const dx = (inset.left - previous.left - (inset.right - previous.right)) / 2
    const dy = (inset.top - previous.top - (inset.bottom - previous.bottom)) / 2
    if (dx !== 0 || dy !== 0) setView((current) => current && { ...current, x: current.x + dx, y: current.y + dy })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, inset.top, inset.right, inset.bottom, inset.left])

  useEffect(
    () => () => {
      if (pendingTap.current !== null) window.clearTimeout(pendingTap.current)
    },
    []
  )

  const clientToWorld = (clientX: number, clientY: number): Point => {
    const rect = svgElement?.getBoundingClientRect()
    if (!rect || !view) return { x: 0, y: 0 }
    return {
      x: (clientX - rect.left - view.x) / view.scale,
      y: (clientY - rect.top - view.y) / view.scale,
    }
  }

  const local = (event: { clientX: number; clientY: number }) => {
    const rect = containerRef.current?.getBoundingClientRect()
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) }
  }

  const pinchMetrics = () => {
    const [a, b] = [...pointers.current.values()]
    return { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }
  }

  const api: ViewportApi | null =
    view && size
      ? {
          size,
          scale: view.scale,
          panning,
          coarse,
          toScreen: (point) => ({ x: point.x * view.scale + view.x, y: point.y * view.scale + view.y }),
          clientToWorld,
        }
      : null

  const content = api ? children(api) : null
  const minorMm = view ? (GRID_STEPS_MM.find((step) => step * view.scale >= 22) ?? 500) : 10
  const minorPx = view ? minorMm * view.scale : 25
  const majorPx = minorPx * 5
  // Minor lines fade as they approach the density where the grid steps up.
  const minorFade = Math.min(1, Math.max(0, (minorPx - 22) / 14))

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none overflow-hidden bg-background overscroll-none select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
      onPointerDownCapture={(event) => {
        if ((event.target as HTMLElement).closest("[data-viewport-ignore]")) return
        pointers.current.set(event.pointerId, local(event))
        if (pointers.current.size === 2) {
          // A second finger turns the gesture into pinch-zoom and pan. Keep it away from point handles.
          pinch.current = pinchMetrics()
          gesture.current = null
          lastTap.current = null
          if (pendingTap.current !== null) window.clearTimeout(pendingTap.current)
          pendingTap.current = null
          autoFit.current = false
          setGrabbing(false)
          event.stopPropagation()
        }
      }}
      onPointerMoveCapture={(event) => {
        if (!pointers.current.has(event.pointerId)) return
        pointers.current.set(event.pointerId, local(event))
        const start = pinch.current
        if (start && pointers.current.size >= 2) {
          const next = pinchMetrics()
          // Zoom about the previous midpoint, then follow the midpoint as the fingers travel.
          setView((current) => {
            if (!current) return current
            const zoomed = zoomView(current, next.dist / start.dist, start.cx, start.cy)
            return { ...zoomed, x: zoomed.x + next.cx - start.cx, y: zoomed.y + next.cy - start.cy }
          })
          pinch.current = next
          event.stopPropagation()
        }
      }}
      onPointerUpCapture={(event) => {
        pointers.current.delete(event.pointerId)
        if (pinch.current && pointers.current.size < 2) {
          pinch.current = null
          gesture.current = null
        }
      }}
      onPointerCancelCapture={(event) => {
        pointers.current.delete(event.pointerId)
        if (pinch.current && pointers.current.size < 2) pinch.current = null
        gesture.current = null
      }}
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
              if (!active.moved && Math.hypot(event.clientX - active.startX, event.clientY - active.startY) > (event.pointerType === "touch" ? 8 : 4)) {
                active.moved = true
                setGrabbing(true)
              }
              if (active.moved) {
                autoFit.current = false
                const dx = event.clientX - active.lastX
                const dy = event.clientY - active.lastY
                setView((current) => current && { ...current, x: current.x + dx, y: current.y + dy })
              }
              active.lastX = event.clientX
              active.lastY = event.clientY
              return
            }
            if (event.pointerType === "mouse") onHover?.(panning ? null : clientToWorld(event.clientX, event.clientY))
          }}
          onPointerUp={(event) => {
            const active = gesture.current
            if (!active || active.id !== event.pointerId) return
            gesture.current = null
            setGrabbing(false)
            if (!active.clickable || active.moved) return
            if (event.pointerType !== "touch") {
              onBackgroundClick?.(clientToWorld(event.clientX, event.clientY))
              return
            }
            // Touch: a second tap close behind the first fits the drawing instead of adding a point.
            const previous = lastTap.current
            if (
              previous &&
              event.timeStamp - previous.t < DOUBLE_TAP_MS &&
              Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 32
            ) {
              if (pendingTap.current !== null) window.clearTimeout(pendingTap.current)
              pendingTap.current = null
              lastTap.current = null
              fitNow()
              return
            }
            lastTap.current = { t: event.timeStamp, x: event.clientX, y: event.clientY }
            const world = clientToWorld(event.clientX, event.clientY)
            pendingTap.current = window.setTimeout(() => {
              pendingTap.current = null
              onBackgroundClick?.(world)
            }, DOUBLE_TAP_MS - 40)
          }}
          onPointerCancel={() => {
            gesture.current = null
            setGrabbing(false)
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
              <path
                d={`M ${minorPx} 0 L 0 0 0 ${minorPx}`}
                fill="none"
                stroke="var(--nb-primary)"
                strokeOpacity={0.03 + 0.05 * minorFade}
                strokeWidth={1}
              />
            </pattern>
            <pattern
              id={`${patternId}-major`}
              width={majorPx}
              height={majorPx}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${view.x} ${view.y})`}
            >
              <path
                d={`M ${majorPx} 0 L 0 0 0 ${majorPx}`}
                fill="none"
                stroke="var(--nb-primary)"
                strokeOpacity={0.14}
                strokeWidth={1}
              />
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
    </div>
  )
}
