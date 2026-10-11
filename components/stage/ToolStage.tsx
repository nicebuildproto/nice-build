"use client"

import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { StageInsetContext, stageFloat } from "@/components/stage/chrome"
import { StagePanel } from "@/components/stage/StagePanel"
import { StageStats, type StageStat } from "@/components/stage/StageStats"
import { StageToolbar, type StageTool } from "@/components/stage/StageToolbar"
import { stageHeaderOffset } from "@/components/stage/tokens"
import {
  StageZoomContext,
  clampStageZoom,
  useStageLayout,
  type SheetSnap,
  type StagePoint,
} from "@/components/stage/useStageLayout"
import { cn } from "@/lib/utils"
import { Grid3x3, Hand, LocateFixed, Minus, Plus, SlidersHorizontal, Table2 } from "lucide-react"
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"

export type { StageStat, StageTool }

export type StageViewControl = {
  zoom: number
  setZoom: (value: number | ((current: number) => number)) => void
  pan: StagePoint
  setPan: (value: StagePoint | ((current: StagePoint) => StagePoint)) => void
}

const motion = "duration-200 ease-out motion-reduce:transition-none"

export function ToolStage({
  toolId,
  title,
  stats = [],
  left,
  right,
  leftTitle = "Data",
  rightTitle = "Style",
  tools = [],
  actions,
  notice,
  spatial = false,
  view,
  onFit,
  fill = false,
  frame = true,
  surface,
  dataOpen = true,
  guide = true,
  builtinTools = true,
  bleed = false,
  bar = true,
  chromeTop = stageHeaderOffset,
  sheetStyleLabel = "Style",
  dockRight = true,
  toolbarClassName,
  toolbarSurfaceClassName,
  leftGutter = 0,
  panelWidth,
  sheet = true,
  bottomReserve = 0,
  children,
}: {
  toolId: string
  title: string
  stats?: StageStat[]
  left?: ReactNode
  right?: ReactNode
  leftTitle?: string
  rightTitle?: string
  tools?: StageTool[]
  actions?: ReactNode
  notice?: ReactNode
  /** Stage-owned pan and zoom. Plain scroll still moves the page. */
  spatial?: boolean
  /** The tool already applies pan and zoom. The stage drives that view and does not transform the chart. */
  view?: StageViewControl
  onFit?: () => void
  /** Chart fills the safe area. Sankey sizes itself from that box. */
  fill?: boolean
  /** Size the chart svg to the safe area. A free canvas sizes itself. */
  frame?: boolean
  /** White or dusk. Chart colours stay on the theme. */
  surface?: { background: string; dot: string }
  /** Data panel starts open unless the tool asks for it closed. */
  dataOpen?: boolean
  /** Link to the guide under the stage. */
  guide?: boolean
  /** Fit and grid controls. A canvas that owns its own view can turn these off. */
  builtinTools?: boolean
  /** Draw across the whole stage, including behind floating panels. */
  bleed?: boolean
  /** The built-in title row. A tool with its own header can turn this off. */
  bar?: boolean
  /** Top of the floating panels when the built-in title row is off. */
  chromeTop?: number
  sheetStyleLabel?: string
  /** Draw the shared right Stage panel. A tool with its own panel can turn this off. */
  dockRight?: boolean
  /** Extra classes for the shared toolbar. Defaults leave the Data Visualisation toolbar unchanged. */
  toolbarClassName?: string
  /** Replaces the toolbar surface. Omit it to keep the Data Visualisation shadow. */
  toolbarSurfaceClassName?: string
  /** Reserved left space for a tool-owned rail. */
  leftGutter?: number
  /** Right span when the tool draws its own panel. */
  panelWidth?: number
  /** Phone sheet. A tool with its own narrow layout can turn this off. */
  sheet?: boolean
  /** Bottom space reserved by a tool-owned panel. */
  bottomReserve?: number
  children: ReactNode
}) {
  const layout = useStageLayout(toolId, bar ? stageHeaderOffset : chromeTop, {
    dataOpen,
    header: bar,
    hasLeft: left != null,
    leftGutter,
    lockRight: dockRight === false,
    rightWidth: panelWidth,
    hideSheet: sheet === false,
    bottomReserve,
  })
  const headerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const [fitted, setFitted] = useState<{ width: number; height: number } | null>(null)
  const showZoom = spatial || view != null
  const zoom = view?.zoom ?? (spatial ? layout.zoom : 1)
  const pan = view?.pan ?? (spatial ? layout.pan : { x: 0, y: 0 })
  const phone = layout.mode === "phone"
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const setZoomRef = useRef(view?.setZoom ?? layout.setZoom)
  setZoomRef.current = view?.setZoom ?? layout.setZoom

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const measure = () => layout.setHeaderHeight(el.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [layout.setHeaderHeight, layout.mode, stats.length])

  useLayoutEffect(() => {
    const root = chartRef.current
    if (!root || fill) {
      setFitted(null)
      return
    }
    const svg = root.querySelector("svg")
    const box = svg?.viewBox?.baseVal
    if (!svg || !box?.width || !box.height) {
      setFitted(null)
      return
    }
    const boundsW = root.clientWidth
    const boundsH = root.clientHeight
    if (boundsW < 8 || boundsH < 8) return
    const scale = Math.min(boundsW / box.width, boundsH / box.height, 1400 / box.width)
    const next = { width: Math.round(box.width * scale), height: Math.round(box.height * scale) }
    setFitted((current) => (current && current.width === next.width && current.height === next.height ? current : next))
  }, [children, fill, layout.safe.width, layout.safe.height])

  useEffect(() => {
    const el = layout.stageRef.current
    if (!el || !showZoom) return
    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const delta = event.deltaY > 0 ? -0.08 : 0.08
      setZoomRef.current((current) => clampStageZoom(current + delta))
    }
    let startDist = 0
    let startZoom = 1
    function pinchDistance(event: TouchEvent) {
      const [a, b] = [event.touches[0], event.touches[1]]
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    }
    function onTouchStart(event: TouchEvent) {
      if (event.touches.length !== 2) return
      startDist = pinchDistance(event)
      startZoom = zoomRef.current
    }
    function onTouchMove(event: TouchEvent) {
      if (event.touches.length !== 2 || startDist <= 0) return
      event.preventDefault()
      setZoomRef.current(clampStageZoom(startZoom * (pinchDistance(event) / startDist)))
    }
    function onTouchEnd() {
      startDist = 0
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", onTouchEnd)
    el.addEventListener("touchcancel", onTouchEnd)
    return () => {
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
      el.removeEventListener("touchcancel", onTouchEnd)
    }
  }, [layout.stageRef, showZoom])

  function adjustZoom(delta: number) {
    const setZoom = view?.setZoom ?? layout.setZoom
    setZoom((current) => clampStageZoom(current + delta))
  }

  function movePan(next: StagePoint) {
    if (view) view.setPan(next)
    else layout.setPan(next)
  }

  function fit() {
    if (view) {
      view.setZoom(1)
      view.setPan({ x: 0, y: 0 })
    }
    layout.fit()
    onFit?.()
  }

  function onPanDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!layout.panOn) return
    event.preventDefault()
    const startX = event.clientX
    const startY = event.clientY
    const origin = { ...pan }
    function move(next: PointerEvent) {
      movePan({ x: origin.x + next.clientX - startX, y: origin.y + next.clientY - startY })
    }
    function up() {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  const toolbarTools: StageTool[] = [
    ...tools,
    ...(builtinTools && showZoom
      ? [
          { id: "zoom-out", label: "Zoom out", icon: <Minus />, onClick: () => adjustZoom(-0.1) },
          { id: "zoom-in", label: "Zoom in", icon: <Plus />, onClick: () => adjustZoom(0.1) },
          {
            id: "pan",
            label: "Pan",
            icon: <Hand />,
            pressed: layout.panOn,
            onClick: () => layout.setPanOn((on) => !on),
          },
        ]
      : []),
    ...(builtinTools
      ? [
          { id: "fit", label: "Fit", icon: <LocateFixed />, onClick: fit },
          {
            id: "grid",
            label: layout.grid ? "Hide grid" : "Show grid",
            icon: <Grid3x3 />,
            pressed: layout.grid,
            onClick: () => layout.setGrid((on) => !on),
          },
        ]
      : []),
  ]

  const dockPad = phone ? 0 : layout.rightSpan + 60

  const sheetTab = left != null ? layout.sheetTab : "style"

  return (
    <StageZoomContext.Provider value={zoom}>
      <StageInsetContext.Provider value={bleed ? layout.safe : { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }}>
      <TooltipProvider delay={300}>
        <div
          ref={layout.stageRef}
          className={cn(
            "relative h-dvh w-full max-w-full min-h-[640px] overflow-visible"
          )}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: surface?.background ?? "var(--muted)",
              backgroundImage: layout.grid
                ? `radial-gradient(${surface?.dot ?? "color-mix(in oklch, var(--foreground) 18%, transparent)"} 1px, transparent 1px)`
                : undefined,
              backgroundSize: "18px 18px",
            }}
          />

          <div
            ref={chartRef}
            className={cn("absolute z-0 overflow-hidden", !bleed && "transition-[top,right,bottom,left]", motion)}
            style={
              bleed
                ? { top: 0, right: 0, bottom: 0, left: 0 }
                : {
                    top: layout.safe.top,
                    right: layout.safe.right,
                    bottom: phone ? `calc(${layout.sheetHeight}px + env(safe-area-inset-bottom))` : layout.safe.bottom,
                    left: layout.safe.left,
                  }
            }
          >
            <div
              className="flex h-full w-full items-center justify-center"
              style={
                spatial && !view
                  ? {
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transition: layout.panOn ? "none" : "transform 200ms ease",
                    }
                  : undefined
              }
            >
              {!frame ? (
                <div className="h-full w-full">{children}</div>
              ) : fill ? (
                <div className="h-full w-full max-w-[1400px] [&_svg]:!h-full [&_svg]:!max-h-none [&_svg]:!w-full">{children}</div>
              ) : (
                <div
                  className={cn("flex max-w-[1400px] items-center justify-center", !fitted && "h-full w-full")}
                  style={fitted ? { width: fitted.width, height: fitted.height, maxWidth: "100%", maxHeight: "100%" } : undefined}
                >
                  <div className="h-full w-full [&_svg]:!h-full [&_svg]:!max-h-none [&_svg]:!w-full">{children}</div>
                </div>
              )}
            </div>
            {layout.panOn ? (
              <div className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing" onPointerDown={onPanDown} />
            ) : null}
          </div>

          <div className="pointer-events-none absolute inset-0 z-20">
            {bar ? (
            <div
              ref={headerRef}
              className={cn("pointer-events-none absolute right-4 left-4 flex items-start justify-between gap-3 transition-[padding]", motion)}
              style={{ top: stageHeaderOffset, paddingRight: dockPad }}
            >
              <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
                <h1 className={cn(stageFloat, "flex h-8 shrink-0 items-center rounded-full px-3 text-[15px] font-semibold tracking-[-0.02em] text-foreground")}>
                  {title}
                </h1>
                <StageStats stats={stats} />
              </div>
              {actions ? (
                <div className={cn(stageFloat, "pointer-events-auto flex shrink-0 items-center gap-1 rounded-xl p-1")}>
                  {actions}
                </div>
              ) : null}
            </div>
            ) : null}

            {left && !phone ? (
              <StagePanel
                id={`${toolId}-data`}
                title={leftTitle}
                icon={<Table2 />}
                open={layout.leftOpen}
                onToggle={layout.toggleLeft}
                side="left"
                width={layout.leftWidth}
                top={layout.safe.top}
                bottom={16}
              >
                {notice}
                {left}
              </StagePanel>
            ) : null}

            {right && !phone && dockRight ? (
              <StagePanel
                id={`${toolId}-style`}
                title={rightTitle}
                icon={<SlidersHorizontal />}
                open={layout.rightOpen}
                onToggle={layout.toggleRight}
                side="right"
                width={layout.rightWidth}
                top={bar ? stageHeaderOffset : chromeTop}
                bottom={16}
              >
                {right}
              </StagePanel>
            ) : null}

            <div
              className={cn("absolute z-30 -translate-y-1/2 transition-[right,top]", motion)}
              style={
                phone
                  ? {
                      right: 12,
                      top: `calc(${layout.safe.top}px + (100% - ${layout.safe.top}px - ${layout.safe.bottom}px) / 2)`,
                    }
                  : { right: 16 + layout.rightSpan + 8, top: "50%" }
              }
            >
              <StageToolbar
                tools={toolbarTools}
                className={toolbarClassName}
                surfaceClassName={toolbarSurfaceClassName}
              />
            </div>

            {guide && layout.showHow ? (
              <div
                className="pointer-events-none absolute z-30 hidden justify-center xl:flex"
                style={{ left: layout.safe.left, right: layout.safe.right, bottom: 8 }}
              >
                <a
                  href="#how-it-works"
                  className="pointer-events-auto rounded-full px-3 py-1 text-[12px] text-[var(--nb-secondary)] outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  How it works ↓
                </a>
              </div>
            ) : null}
          </div>

          {phone && sheet ? (
            <StageSheet
              height={layout.sheetHeight}
              snap={layout.sheet}
              tab={sheetTab}
              onSnap={layout.setSheet}
              onTab={(tab) => {
                layout.setSheetTab(tab)
                if (layout.sheet === "peek") layout.setSheet("half")
              }}
              data={
                <>
                  {notice}
                  {left}
                </>
              }
              style={right}
              styleLabel={sheetStyleLabel}
              showData={left != null}
            />
          ) : null}
        </div>
      </TooltipProvider>
      </StageInsetContext.Provider>
    </StageZoomContext.Provider>
  )
}

function StageSheet({
  height,
  snap,
  tab,
  onSnap,
  onTab,
  data,
  style,
  styleLabel,
  showData,
}: {
  height: number
  snap: SheetSnap
  tab: "data" | "style"
  onSnap: (snap: SheetSnap) => void
  onTab: (tab: "data" | "style") => void
  data?: ReactNode
  style?: ReactNode
  styleLabel: string
  showData: boolean
}) {
  function cycle(direction: number) {
    const order: SheetSnap[] = ["peek", "half", "full"]
    const index = order.indexOf(snap)
    onSnap(order[Math.min(order.length - 1, Math.max(0, index + direction))])
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    const startY = event.clientY
    function up(next: PointerEvent) {
      const dy = next.clientY - startY
      if (dy > 28) cycle(-1)
      else if (dy < -28) cycle(1)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointerup", up)
  }

  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-2xl transition-[height] lg:hidden",
        stageFloat,
        motion
      )}
      style={{ height: `calc(${height}px + env(safe-area-inset-bottom))`, paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 shrink-0 items-center gap-2 px-3">
        <button
          type="button"
          className="flex h-11 w-8 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={snap === "full" ? "Shrink panel" : "Expand panel"}
          onClick={() => cycle(snap === "full" ? -2 : 1)}
          onPointerDown={onPointerDown}
        >
          <span className="h-1 w-8 rounded-full bg-muted-foreground/40" />
        </button>
        <div className="flex min-w-0 flex-1 gap-1" role="tablist" aria-label="Chart panels">
          {showData ? (
            <SheetTab label="Data" selected={tab === "data"} controls="stage-sheet-data" onClick={() => onTab("data")} />
          ) : null}
          <SheetTab label={styleLabel} selected={tab === "style" || !showData} controls="stage-sheet-style" onClick={() => onTab("style")} />
        </div>
      </div>
      {snap === "peek" ? null : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <div id="stage-sheet-data" role="tabpanel" hidden={tab !== "data"} className="flex flex-col gap-3">
            {data}
          </div>
          <div id="stage-sheet-style" role="tabpanel" hidden={tab !== "style"} className="flex flex-col gap-3">
            {style}
          </div>
        </div>
      )}
    </div>
  )
}

function SheetTab({
  label,
  selected,
  controls,
  onClick,
}: {
  label: string
  selected: boolean
  controls: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      size="default"
      variant={selected ? "secondary" : "ghost"}
      role="tab"
      aria-selected={selected}
      aria-controls={controls}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}
