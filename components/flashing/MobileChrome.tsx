"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowLeft, ChevronDown, Info, LayoutTemplate, LocateFixed, Redo2, SlidersHorizontal, Trash2, Undo2 } from "lucide-react"
import { distance, segmentAngle } from "@/lib/flashing/geometry"
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { BottomSheet, type SheetSnap } from "./BottomSheet"
import { flashingLabel, layer } from "./chrome"
import { GirthStat } from "./DesktopChrome"
import { useElementSize, useMediaQuery } from "./hooks"
import { materialShort } from "./labels"
import { MaterialControls } from "./MaterialStep"
import type { FlashingModel } from "./model"
import { NumberField } from "./NumberField"
import { editSteps } from "./Onboarding"
import { AlignPanel, ClearButton, OptionsSection, PanelSection, ReviewRows, TaperPanel, TemplatesSection, stepMeta } from "./Panels"
import { PIECE_LENGTH_MAX, PIECE_LENGTH_MIN } from "./PriceBar"
import { eachLabel, PriceValue } from "./Price"
import { StepList } from "./StepList"
import { downloadDrawing } from "./TechnicalDrawing"
import type { ViewportControls } from "./Viewport"

export type MobileInset = { top: number; bottom: number }

type UserSheetId = "templates" | "options" | "details"
type SheetState<T> = { key: T; step: number; snap: SheetSnap } | null

const safeLeft = "max(1rem, env(safe-area-inset-left))"
const safeRight = "max(1rem, env(safe-area-inset-right))"

/**
 * The touch layout (below 1024px): top bar with progress, context strip, canvas, contextual dock or
 * sheet, and an action bar that is always in the thumb zone. Reports the free area so the drawing
 * re-fits above whatever is open.
 */
export function MobileChrome({
  m,
  controlsRef,
  onInsetChange,
}: {
  m: FlashingModel
  controlsRef: RefObject<ViewportControls | null>
  panOn: boolean
  onInsetChange: (inset: MobileInset) => void
}) {
  const short = useMediaQuery("(max-height: 639px)")
  const landscape = useMediaQuery("(max-height: 499px)")
  const rootRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const actionRef = useRef<HTMLDivElement>(null)
  const stage = useElementSize(rootRef)
  const top = useElementSize(topRef)
  const bottom = useElementSize(bottomRef)
  const action = useElementSize(actionRef)

  const [stepsOpen, setStepsOpen] = useState(false)
  const [userSheet, setUserSheet] = useState<SheetState<UserSheetId>>(null)
  const [controlsSheet, setControlsSheet] = useState<{ step: number; snap: SheetSnap } | null>(null)
  const [userVisible, setUserVisible] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(0)

  const review = m.currentStep === "review"
  const hasControls = m.currentStep === "taper" || m.currentStep === "align" || m.currentStep === "material"
  // A sheet belongs to the step it was opened on.
  const user = userSheet && userSheet.step === m.step ? userSheet : null
  const controlsOpen = hasControls && !user
  const controlsSnap: SheetSnap = controlsSheet && controlsSheet.step === m.step ? controlsSheet.snap : "half"

  const sheetVisible = user ? userVisible : controlsOpen ? controlsVisible : 0
  const barH = landscape ? 40 : 56
  const reviewTop = Math.max(top.h + 8, Math.round(stage.h * 0.38))

  useEffect(() => {
    if (stage.h === 0 || top.h === 0) return
    onInsetChange({
      top: top.h + 8,
      bottom: review ? Math.max(0, stage.h - reviewTop) : (sheetVisible > 0 ? action.h + sheetVisible : bottom.h) + 8,
    })
  }, [onInsetChange, stage.h, top.h, bottom.h, action.h, sheetVisible, review, reviewTop])

  const onUserVisible = useCallback((h: number) => setUserVisible(h), [])
  const onControlsVisible = useCallback((h: number) => setControlsVisible(h), [])

  const openUser = (key: UserSheetId) => setUserSheet({ key, step: m.step, snap: "half" })
  const closeUser = () => setUserSheet(null)
  const available = Math.max(160, stage.h - top.h - action.h)
  const cap = landscape ? 0.7 : 0.9

  const title = stepMeta[m.currentStep].title
  const each = eachLabel(m.price, m.quantity)

  // Close the step list on outside taps and Escape. Dialogs are left alone.
  useEffect(() => {
    if (!stepsOpen) return
    const onDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement
      if (target.closest("[data-mobile-popover]") || target.closest('[role="dialog"], [data-slot="dialog-overlay"]')) return
      setStepsOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setStepsOpen(false)
      }
    }
    document.addEventListener("pointerdown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [stepsOpen])

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0">
      {/* Top chrome */}
      <div
        ref={topRef}
        className={cn("pointer-events-auto absolute inset-x-0 top-0 border-b border-border bg-card", layer.chrome)}
        style={{ paddingTop: "env(safe-area-inset-top)", paddingLeft: safeLeft, paddingRight: safeRight }}
      >
        <div className="flex items-center gap-1" style={{ height: barH }}>
          <div className="flex shrink-0 items-center [&_img]:h-6 [&_img]:w-auto [&_img]:max-w-[72px] [&_img]:object-contain min-[400px]:[&_img]:max-w-24">
            {m.logo}
          </div>
          <button
            type="button"
            aria-expanded={stepsOpen}
            aria-haspopup="dialog"
            data-mobile-popover
            onClick={() => {
                      setStepsOpen((value) => !value)
            }}
            className="flex h-11 min-w-0 flex-1 items-center gap-1 rounded-lg px-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
          >
            {landscape ? (
              <span className="min-w-0 truncate text-base font-semibold">
                {title} <span className="text-xs font-normal text-muted-foreground tabular-nums">· {m.step + 1} of {editSteps.length}</span>
              </span>
            ) : (
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-base leading-5 font-semibold">{title}</span>
                <span className="text-xs leading-4 text-muted-foreground tabular-nums">
                  {m.step + 1} of {editSteps.length}
                </span>
              </span>
            )}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
          {short ? (
            <button
              type="button"
              aria-label="Details"
              onClick={() => openUser("details")}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
            >
              <Info className="size-5" aria-hidden />
            </button>
          ) : null}
          <div className="flex shrink-0 items-center [&_button]:h-11 [&_button]:px-2 [&_button]:text-sm">
            {m.startOver}
            {m.actions}
          </div>
        </div>

        <ol className="flex gap-1 pb-0.5" aria-label="Steps">
          {editSteps.map((item, index) => {
            const available = index <= m.reached
            const current = index === m.step
            return (
              <li key={item.id} className="flex-1">
                <button
                  type="button"
                  disabled={!available}
                  aria-label={`${index + 1}. ${item.label}`}
                  aria-current={current ? "step" : undefined}
                  onClick={() => m.goTo(index)}
                  className="group flex h-3 w-full items-center outline-none disabled:cursor-default"
                >
                  <span
                    className={cn(
                      "h-1 w-full rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-ring",
                      current ? "bg-primary" : available ? "bg-primary/45" : "bg-border"
                    )}
                  />
                </button>
              </li>
            )
          })}
        </ol>

        {short ? null : (
          <button
            type="button"
            onClick={() => openUser("details")}
            aria-label="Open details"
            className="flex h-8 w-full items-center gap-3 overflow-x-auto text-xs whitespace-nowrap text-muted-foreground outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="shrink-0 font-medium text-foreground">{m.profileName}</span>
            <span className="shrink-0 tabular-nums">
              {m.pieceLengthMm.toLocaleString("en-AU")} mm × {m.quantity}
            </span>
            <span className="shrink-0">
              Girth <GirthStat girthMm={m.girthMm} />
            </span>
            <span className="shrink-0 tabular-nums">
              {m.folds} {m.folds === 1 ? "fold" : "folds"}
            </span>
          </button>
        )}

        {stepsOpen ? (
          <div
            data-mobile-popover
            className={cn("absolute inset-x-2 top-full mt-1 rounded-xl border border-border bg-card p-2 shadow-lg", layer.popover)}
          >
            <StepList m={m} size="lg" onPick={() => setStepsOpen(false)} />
          </div>
        ) : null}
      </div>

      {/* Review: the order list below the drawing */}
      {review ? (
        <div
          className={cn("pointer-events-auto absolute inset-x-0 overflow-y-auto overscroll-contain border-t border-border bg-card", layer.overlay)}
          style={{ top: reviewTop, bottom: bottom.h, paddingLeft: safeLeft, paddingRight: safeRight }}
        >
          <h2 className={cn(flashingLabel, "pt-4")}>Check your order</h2>
          <ReviewRows m={m} />
          <div className="py-3">
            <Button type="button" variant="outline" className="h-12 w-full" onClick={() => downloadDrawing()}>
              Download drawing
            </Button>
          </div>
        </div>
      ) : null}

      {/* Bottom stack: reason, dock or review buttons, action bar */}
      <div
        ref={bottomRef}
        className={cn("pointer-events-auto absolute inset-x-0 bottom-0 border-t border-border bg-card", layer.chrome)}
      >
        {m.blocked && !user ? (
          <p
            role="status"
            className="px-4 pt-2 text-xs text-muted-foreground"
            style={{ paddingLeft: safeLeft, paddingRight: safeRight }}
          >
            {m.blocked}
          </p>
        ) : null}

        {m.currentStep === "design" && !user ? <Dock m={m} controlsRef={controlsRef} onOpen={openUser} /> : null}

        {review ? (
          <div className="grid grid-cols-2 gap-2 pt-2" style={{ paddingLeft: safeLeft, paddingRight: safeRight }}>
            <Button type="button" variant="outline" className="h-12 px-2 text-base" onClick={m.review.onRequestQuote}>
              Request a quote
            </Button>
            <Button type="button" variant="outline" className="h-12 px-2 text-base" onClick={m.review.onAddToCart}>
              Add to cart
            </Button>
          </div>
        ) : null}

        <div ref={actionRef} style={{ paddingBottom: "env(safe-area-inset-bottom)", paddingLeft: safeLeft, paddingRight: safeRight }}>
          <div className="flex items-center gap-3" style={{ height: landscape ? 52 : 72 }}>
            <Button
              type="button"
              variant="outline"
              aria-label="Back"
              className="size-12 shrink-0 rounded-xl"
              onClick={m.onBack}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="min-w-0 shrink-0">
              <p className="truncate text-xs leading-4 text-muted-foreground">
                Estimated total
                {each ? <span className="hidden tabular-nums min-[400px]:inline"> · {each}</span> : null}
              </p>
              <PriceValue price={m.price} pending={m.pending} className="text-2xl leading-7" />
            </div>
            <Button
              type="button"
              className="h-12 min-w-0 flex-1 rounded-xl text-base"
              disabled={m.blocked !== null}
              onClick={review ? m.review.onOrderNow : m.onContinue}
            >
              <span className="truncate">{review ? "Order now" : m.continueLabel}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Sheets */}
      <BottomSheet
        open={user?.key === "templates"}
        snap={user?.snap ?? "half"}
        onSnapChange={(snap) => setUserSheet((current) => (current ? { ...current, snap } : current))}
        onClose={closeUser}
        peekable={false}
        title="Templates"
        bottom={action.h}
        available={available}
        cap={cap}
        onVisibleChange={user?.key === "templates" ? onUserVisible : noop}
      >
        <TemplatesSection m={m} onPicked={closeUser} />
      </BottomSheet>
      <BottomSheet
        open={user?.key === "options"}
        snap={user?.snap ?? "half"}
        onSnapChange={(snap) => setUserSheet((current) => (current ? { ...current, snap } : current))}
        onClose={closeUser}
        peekable={false}
        title="Options"
        bottom={action.h}
        available={available}
        cap={cap}
        onVisibleChange={user?.key === "options" ? onUserVisible : noop}
      >
        <div className="divide-y divide-border">
          <OptionsSection m={m} size="lg" />
          <ClearButton m={m} size="lg" />
        </div>
      </BottomSheet>
      <BottomSheet
        open={user?.key === "details"}
        snap={user?.snap ?? "half"}
        onSnapChange={(snap) => setUserSheet((current) => (current ? { ...current, snap } : current))}
        onClose={closeUser}
        peekable={false}
        title="Details"
        bottom={action.h}
        available={available}
        cap={cap}
        onVisibleChange={user?.key === "details" ? onUserVisible : noop}
      >
        <DetailsBody m={m} />
      </BottomSheet>
      <BottomSheet
        open={controlsOpen}
        snap={controlsSnap}
        onSnapChange={(snap) => setControlsSheet({ step: m.step, snap })}
        onClose={() => setControlsSheet({ step: m.step, snap: "peek" })}
        peekable
        title={title}
        subtitle={m.stepSummaries[m.step]}
        bottom={action.h}
        available={available}
        cap={cap}
        onVisibleChange={controlsOpen ? onControlsVisible : noop}
      >
        <div className="divide-y divide-border">
          {m.currentStep === "taper" ? <TaperPanel m={m} /> : null}
          {m.currentStep === "align" ? <AlignPanel m={m} /> : null}
          {m.currentStep === "material" ? (
            <PanelSection>
              <MaterialControls
                variant="sheet"
                points={m.points}
                material={m.material}
                onMaterialChange={m.onMaterialChange}
                colourId={m.colourId}
                onColourChange={m.onColourChange}
                side={m.side}
                onSideChange={m.onSideChange}
              />
            </PanelSection>
          ) : null}
        </div>
      </BottomSheet>
    </div>
  )
}

function noop() {}

function DetailsBody({ m }: { m: FlashingModel }) {
  return (
    <div className="flex flex-col gap-5 py-2">
      <NumberField
        label="Piece length"
        size="lg"
        unit="mm"
        min={PIECE_LENGTH_MIN}
        max={PIECE_LENGTH_MAX}
        value={m.pieceLengthMm}
        onCommit={m.onPieceLengthChange}
      />
      <NumberField label="Quantity" size="lg" min={1} max={999} value={m.quantity} onCommit={m.onQuantityChange} />
      <dl className="divide-y divide-border rounded-xl border border-border px-3">
        <Row label="Girth" value={<GirthStat girthMm={m.girthMm} />} />
        <Row label="Folds" value={m.folds} />
        <Row label="Material" value={materialShort(m)} />
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{value}</dd>
    </div>
  )
}

const chip =
  "inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted disabled:pointer-events-none disabled:opacity-50"

/** Design-step dock: chips when nothing is selected, a contextual editor when a line or point is. */
function Dock({
  m,
  controlsRef,
  onOpen,
}: {
  m: FlashingModel
  controlsRef: RefObject<ViewportControls | null>
  onOpen: (id: UserSheetId) => void
}) {
  const selection = m.editor.selection
  const { points, dispatch } = m
  const pad = { paddingLeft: safeLeft, paddingRight: safeRight }

  if (selection?.kind === "segment" && selection.index < points.length - 1) {
    const i = selection.index
    const first = i === 0
    return (
      <div className="flex flex-wrap items-end gap-2 py-2" style={pad}>
        <NumberField
          className="min-w-40 flex-1"
          label="Length (mm)"
          labelClassName="text-xs"
          size="lg"
          decimals={1}
          min={1}
          max={2000}
          value={distance(points[i], points[i + 1])}
          onCommit={(lengthMm) => dispatch({ type: "setLength", index: i, lengthMm })}
        />
        <NumberField
          className="min-w-40 flex-1"
          label={first ? "Angle from level (°)" : "Fold angle (°)"}
          labelClassName="text-xs"
          size="lg"
          min={first ? -180 : 0}
          max={180}
          value={segmentAngle(points, i)}
          onCommit={(angleDeg) => dispatch({ type: "setAngle", index: i, angleDeg })}
        />
        <div className="flex w-full gap-2 min-[560px]:w-auto">
          <Button type="button" variant="destructive" className="h-11 flex-1 px-4" onClick={() => dispatch({ type: "deleteSelection" })}>
            <Trash2 /> Delete
          </Button>
          <Button type="button" variant="outline" className="h-11 flex-1 px-5" onClick={() => dispatch({ type: "select", selection: null })}>
            Done
          </Button>
        </div>
      </div>
    )
  }

  if (selection?.kind === "point" && selection.index < points.length) {
    return (
      <div className="flex h-14 items-center gap-2" style={pad}>
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">Drag the point to move it, or tap the canvas to extend.</p>
        <Button type="button" variant="destructive" className="h-11 shrink-0 px-4" onClick={() => dispatch({ type: "deleteSelection" })}>
          <Trash2 /> Delete
        </Button>
        <Button type="button" variant="outline" className="h-11 shrink-0 px-4" onClick={() => dispatch({ type: "select", selection: null })}>
          Done
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-14 items-center gap-2 overflow-x-auto [scrollbar-width:none]" style={pad} role="toolbar" aria-label="Drawing tools">
      <button type="button" className={chip} onClick={() => onOpen("templates")}>
        <LayoutTemplate className="size-4 max-[399px]:hidden" aria-hidden /> Templates
      </button>
      <button type="button" className={chip} onClick={() => onOpen("options")}>
        <SlidersHorizontal className="size-4 max-[399px]:hidden" aria-hidden /> Options
      </button>
      <button type="button" aria-label="Undo" className={cn(chip, "w-10 px-0")} disabled={!m.canUndo} onClick={m.onUndo}>
        <Undo2 className="size-5" aria-hidden />
      </button>
      <button type="button" aria-label="Redo" className={cn(chip, "w-10 px-0")} disabled={!m.canRedo} onClick={m.onRedo}>
        <Redo2 className="size-5" aria-hidden />
      </button>
      <button type="button" aria-label="Fit to screen" className={cn(chip, "w-10 px-0")} onClick={() => controlsRef.current?.fit()}>
        <LocateFixed className="size-5" aria-hidden />
      </button>
    </div>
  )
}
