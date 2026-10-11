"use client"

import { cn } from "@/lib/utils"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlignStep } from "./AlignStep"
import { flashingInk, layer, RAIL_WIDTH, SIDEBAR_NARROW, SIDEBAR_WIDE, STAGE_INSET } from "./chrome"
import { CanvasTools, DesktopHeader, DesktopRail, DesktopSidebar, HintCard } from "./DesktopChrome"
import { DesignStep } from "./DesignStep"
import { isTypingTarget, useElementSize, useMediaQuery, useStoredFlag } from "./hooks"
import { MaterialPreview } from "./MaterialStep"
import { MobileChrome, type MobileInset } from "./MobileChrome"
import type { FlashingModel } from "./model"
import { TaperStep } from "./TaperStep"
import { TechnicalDrawing } from "./TechnicalDrawing"
import type { ViewportControls, ViewportInset } from "./Viewport"

const SMALL_STAGE = 1000
const DEFAULT_MOBILE_INSET: MobileInset = { top: 112, bottom: 200 }

/**
 * The editing workspace. One stage column holds a single full-bleed canvas layer; the chrome around
 * it (sidebar, header, rail, tools, or the touch layout) is swapped by media query. The canvas sits
 * at a fixed position in the tree, so a resize or rotation across 1024px never remounts the drawing.
 */
export function FlashingWorkspace({ m }: { m: FlashingModel }) {
  const desktop = useMediaQuery("(min-width: 1024px)")
  const wide = useMediaQuery("(min-width: 1280px)")
  const [collapsed, setCollapsed] = useStoredFlag("nb-flashing-sidebar-collapsed", false)
  const [hintDismissed, setHintDismissed] = useStoredFlag("nb-flashing-hint-dismissed", false, "session")
  const [panOn, setPanOn] = useState(false)
  const [mobileInset, setMobileInset] = useState<MobileInset>(DEFAULT_MOBILE_INSET)
  const stageRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<ViewportControls | null>(null)
  const stage = useElementSize(stageRef)
  const header = useElementSize(headerRef)

  const drawing = m.currentStep === "design" || m.currentStep === "taper" || m.currentStep === "align"
  const onPanModeChange = useCallback((on: boolean) => setPanOn(on), [])
  const onInsetChange = useCallback(
    (next: MobileInset) =>
      setMobileInset((current) => (current.top === next.top && current.bottom === next.bottom ? current : next)),
    []
  )

  // Fit area: padding equals the header at the top, the rail on the right, and 24px elsewhere.
  const headerH = header.h || 80
  const inset: ViewportInset = useMemo(
    () =>
      desktop
        ? {
            top: headerH,
            right: RAIL_WIDTH + STAGE_INSET * 2,
            bottom: drawing ? 88 : 24,
            left: 24,
          }
        : { top: mobileInset.top, right: 16, bottom: mobileInset.bottom, left: 16 },
    [desktop, headerH, drawing, mobileInset.top, mobileInset.bottom]
  )

  // Collapsing the sidebar changes the stage width: fit again.
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    controlsRef.current?.fit()
  }, [collapsed])

  // Keep the stage from pulling to refresh or rubber-banding.
  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.overscrollBehavior
    root.style.overscrollBehavior = "none"
    return () => {
      root.style.overscrollBehavior = previous
    }
  }, [])

  useEffect(() => {
    if (!desktop || !drawing) return
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
      const controls = controlsRef.current
      if (!controls) return
      if (event.key === "+" || event.key === "=") controls.zoomBy(1.25)
      else if (event.key === "-" || event.key === "_") controls.zoomBy(1 / 1.25)
      else if (event.key === "0") controls.fit()
      else if (event.key.toLowerCase() === "g") m.onToggleGrid()
      else if (event.key.toLowerCase() === "h") controls.togglePan()
      else return
      event.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [desktop, drawing, m])

  const sidebarWidth = wide ? SIDEBAR_WIDE : SIDEBAR_NARROW
  const compactHeader = stage.w > 0 && stage.w < SMALL_STAGE
  const showHint = desktop && m.currentStep === "design" && m.points.length > 0 && !hintDismissed

  const padding = {
    paddingTop: inset.top,
    paddingRight: inset.right,
    paddingBottom: inset.bottom,
    paddingLeft: inset.left,
  }

  return (
    <div
      className="relative flex h-full min-h-0 flex-1 touch-manipulation overflow-hidden overscroll-none bg-background text-foreground"
      style={flashingInk}
    >
      {desktop ? (
        <DesktopSidebar m={m} width={sidebarWidth} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      ) : null}

      <div ref={stageRef} className="relative min-w-0 flex-1 overflow-hidden">
        {/* One full-bleed canvas layer: the grid lives inside it, under every floating element. */}
        <div className={cn("absolute inset-0", layer.canvas)}>
          {m.currentStep === "design" ? (
            <DesignStep
              editor={m.editor}
              dispatch={m.dispatch}
              snap={m.snap}
              showDims={m.showDims}
              showGrid={m.showGrid}
              fitKey={m.fitKey}
              compact={!desktop}
              onEdited={() => setHintDismissed(true)}
              controlsRef={controlsRef}
              onPanModeChange={onPanModeChange}
              fitInset={inset}
            />
          ) : null}
          {m.currentStep === "taper" ? (
            <TaperStep
              points={m.points}
              enabled={m.taperEnabled}
              lengths={m.taperLengths}
              onLengthChange={m.onTaperLength}
              anchor={m.anchor}
              showGrid={m.showGrid}
              controlsRef={controlsRef}
              onPanModeChange={onPanModeChange}
              fitInset={inset}
            />
          ) : null}
          {m.currentStep === "align" ? (
            <AlignStep
              points={m.points}
              taperEnabled={m.taperEnabled}
              lengths={m.taperLengths}
              anchor={m.anchor}
              onAnchorChange={m.onAnchorChange}
              showGrid={m.showGrid}
              controlsRef={controlsRef}
              onPanModeChange={onPanModeChange}
              fitInset={inset}
            />
          ) : null}
          {m.currentStep === "material" ? (
            <div className="absolute inset-0" style={padding}>
              <MaterialPreview points={m.points} material={m.material} colourId={m.colourId} side={m.side} />
            </div>
          ) : null}
          {m.currentStep === "review" ? (
            <div className="absolute inset-0 flex items-center justify-center" style={padding}>
              <div className="flex h-full w-full max-w-5xl items-center justify-center">
                <TechnicalDrawing
                  points={m.points}
                  taper={m.review.tapered}
                  taperLengths={m.taperLengths}
                  info={m.review.info}
                />
              </div>
            </div>
          ) : null}
        </div>

        {desktop ? (
          <>
            <DesktopHeader m={m} compact={compactHeader} headerRef={headerRef} />
            <DesktopRail m={m} top={headerH - 4} />
            {drawing ? <CanvasTools m={m} controlsRef={controlsRef} panOn={panOn} /> : null}
            {showHint ? <HintCard raised={stage.w < 1240} onDismiss={() => setHintDismissed(true)} /> : null}
          </>
        ) : (
          <MobileChrome m={m} controlsRef={controlsRef} panOn={panOn} onInsetChange={onInsetChange} />
        )}
      </div>
    </div>
  )
}
