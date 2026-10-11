"use client"

import { Button } from "@/components/ui/button"
import { GIRTH_WARNING_MM, MAX_GIRTH_MM } from "@/lib/flashing/geometry"
import { cn } from "@/lib/utils"
import { Popover } from "@base-ui/react/popover"
import {
  ChevronDown,
  Grid3x3,
  Hand,
  LocateFixed,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Redo2,
  Undo2,
  X,
} from "lucide-react"
import { useEffect, useRef, useState, type RefObject } from "react"
import { flashingFloat, flashingInk, flashingLabel, layer, RAIL_WIDTH, SIDEBAR_RAIL } from "./chrome"
import { IconButton } from "./IconButton"
import { materialShort } from "./labels"
import type { FlashingModel } from "./model"
import { NumberField } from "./NumberField"
import { editSteps } from "./Onboarding"
import { stepMeta, StepControls } from "./Panels"
import { PIECE_LENGTH_MAX, PIECE_LENGTH_MIN } from "./PriceBar"
import { eachLabel, PriceValue } from "./Price"
import { StepList } from "./StepList"
import type { ViewportControls } from "./Viewport"

export function girthTone(girthMm: number) {
  if (girthMm > MAX_GIRTH_MM) return "text-red-700"
  if (girthMm >= GIRTH_WARNING_MM) return "text-amber-700"
  return "text-foreground"
}

/** "386 / 1200 mm", amber from 90% of the limit and red once exceeded. */
export function GirthStat({ girthMm, className }: { girthMm: number; className?: string }) {
  return (
    <span
      className={cn("tabular-nums transition-colors", girthTone(girthMm), className)}
      title="The flat width of metal before folding, sometimes called girth."
    >
      {Math.round(girthMm)} / {MAX_GIRTH_MM} mm
      {girthMm > MAX_GIRTH_MM ? <span className="sr-only"> (over the limit)</span> : null}
    </span>
  )
}

function useScrollShadows(ref: RefObject<HTMLElement | null>, deps: unknown[]) {
  const [shadow, setShadow] = useState({ top: false, bottom: false })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const top = el.scrollTop > 2
      const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2
      setShadow((current) => (current.top === top && current.bottom === bottom ? current : { top, bottom }))
    }
    read()
    el.addEventListener("scroll", read, { passive: true })
    const observer = new ResizeObserver(read)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => {
      el.removeEventListener("scroll", read)
      observer.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return shadow
}

/** Full-height side nav. Flat, square, one 1px border. Collapses to a 56px rail of step buttons. */
export function DesktopSidebar({
  m,
  width,
  collapsed,
  onToggle,
}: {
  m: FlashingModel
  width: number
  collapsed: boolean
  onToggle: () => void
}) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const shadow = useScrollShadows(bodyRef, [collapsed, m.currentStep])
  const meta = stepMeta[m.currentStep]

  if (collapsed) {
    return (
      <aside
        aria-label="Editing"
        className={cn("relative flex h-full shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-3", layer.chrome)}
        style={{ width: SIDEBAR_RAIL }}
      >
        <IconButton label="Expand sidebar" side="right" onClick={onToggle}>
          <PanelLeftOpen />
        </IconButton>
        <div className="my-2 h-px w-6 bg-border" aria-hidden />
        <nav aria-label="Steps" className="flex flex-col items-center gap-1">
          {editSteps.map((item, index) => {
            const current = index === m.step
            const available = index <= m.reached
            return (
              <IconButton
                key={item.id}
                label={`${index + 1}. ${item.label}`}
                side="right"
                disabled={!available}
                active={current}
                onClick={() => m.goTo(index)}
                className={cn("text-sm tabular-nums", current && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")}
              >
                {index + 1}
              </IconButton>
            )
          })}
        </nav>
      </aside>
    )
  }

  return (
    <aside
      aria-label="Editing"
      className={cn("relative flex h-full shrink-0 flex-col border-r border-border bg-card", layer.chrome)}
      style={{ width }}
    >
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border pr-2 pl-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex shrink-0 items-center">{m.logo}</div>
          <span className="h-5 w-px shrink-0 bg-border" aria-hidden />
          <span className="min-w-0 truncate text-sm font-medium">Flashing Designer</span>
        </div>
        <IconButton label="Collapse sidebar" side="right" onClick={onToggle}>
          <PanelLeftClose />
        </IconButton>
      </div>

      <header className="shrink-0 border-b border-border px-4 py-4">
        <p className={flashingLabel}>
          Step {m.step + 1} of {editSteps.length}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">{meta.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{meta.hint}</p>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-10 h-3 bg-gradient-to-b from-foreground/10 to-transparent opacity-0 transition-opacity duration-200 motion-reduce:transition-none",
            shadow.top && "opacity-100"
          )}
        />
        <div ref={bodyRef} className="h-full overflow-y-auto overscroll-contain px-4 [scrollbar-gutter:stable]">
          <div className="divide-y divide-border [&>section]:py-4 [&>section:first-child]:pt-4">
            <StepControls m={m} />
          </div>
        </div>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-3 bg-gradient-to-t from-foreground/10 to-transparent opacity-0 transition-opacity duration-200 motion-reduce:transition-none",
            shadow.bottom && "opacity-100"
          )}
        />
      </div>
    </aside>
  )
}

function Cell({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col justify-center gap-0.5", className)}>
      <span className="text-xs leading-4 text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

/** Floating header strip over the stage: title, spec, price, Start over and Contact. */
export function DesktopHeader({
  m,
  compact,
  headerRef,
}: {
  m: FlashingModel
  compact: boolean
  headerRef: RefObject<HTMLDivElement | null>
}) {
  const each = eachLabel(m.price, m.quantity)
  return (
    <div ref={headerRef} className={cn("pointer-events-none absolute inset-x-0 top-0 p-4", layer.chrome)}>
      <header
        className={cn(flashingFloat, "pointer-events-auto flex h-16 items-center gap-3 rounded-xl px-3")}
        aria-label="Order details"
      >
        <span className="inline-flex h-9 max-w-44 min-w-0 shrink items-center rounded-lg bg-muted px-3 text-sm font-medium">
          <span className="truncate">{m.profileName}</span>
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Cell label="Length" className="shrink-0">
            <NumberField
              label="Piece length"
              hideLabel
              live
              floatError
              steppers={false}
              unit="mm"
              min={PIECE_LENGTH_MIN}
              max={PIECE_LENGTH_MAX}
              value={m.pieceLengthMm}
              onCommit={m.onPieceLengthChange}
              inputClassName="h-9 w-[6.5rem]"
            />
          </Cell>
          <Cell label="Quantity" className="shrink-0">
            <NumberField
              label="Quantity"
              hideLabel
              live
              floatError
              steppers={false}
              min={1}
              max={999}
              value={m.quantity}
              onCommit={m.onQuantityChange}
              inputClassName="h-9 w-16"
            />
          </Cell>
          {compact ? (
            <DetailsPopover m={m} />
          ) : (
            <>
              <span className="h-8 w-px shrink-0 bg-border" aria-hidden />
              <Cell label="Girth" className="shrink-0">
                <GirthStat girthMm={m.girthMm} className="text-sm font-medium whitespace-nowrap" />
              </Cell>
              <Cell label="Folds" className="shrink-0">
                <span className="text-sm font-medium tabular-nums">{m.folds}</span>
              </Cell>
              <Cell label="Material" className="min-w-0">
                <span className="truncate text-sm font-medium" title={m.materialSummary}>
                  {materialShort(m)}
                </span>
              </Cell>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="h-8 w-px bg-border" aria-hidden />
          <div className="flex min-w-0 flex-col items-end">
            <span className="text-xs leading-4 text-muted-foreground">
              Estimated total{each ? <span className="tabular-nums"> · {each}</span> : null}
            </span>
            <PriceValue price={m.price} pending={m.pending} className="text-2xl leading-8" />
          </div>
          <span className="h-8 w-px bg-border" aria-hidden />
          <div className="flex items-center gap-1">
            {m.startOver}
            {m.actions}
          </div>
        </div>
      </header>
    </div>
  )
}

function DetailsPopover({ m }: { m: FlashingModel }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button type="button" variant="outline" className="h-9 shrink-0 gap-1 px-3">
            Details <ChevronDown className="size-4" aria-hidden />
          </Button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={8} className={layer.popover}>
          <Popover.Popup
            style={flashingInk}
            className="w-64 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none"
          >
            <dl className="divide-y divide-border">
              <DetailRow label="Girth" value={<GirthStat girthMm={m.girthMm} />} />
              <DetailRow label="Folds" value={m.folds} />
              <DetailRow label="Material" value={materialShort(m)} />
            </dl>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}

/** Right rail: vertical stepper with Back and Continue, plus the order card on review. */
export function DesktopRail({ m, top }: { m: FlashingModel; top: number }) {
  const review = m.currentStep === "review"
  const each = eachLabel(m.price, m.quantity)
  return (
    <aside
      aria-label="Progress and actions"
      className={cn("pointer-events-none absolute right-4 flex flex-col gap-3", layer.chrome)}
      style={{ top, width: RAIL_WIDTH }}
    >
      <div className={cn(flashingFloat, "pointer-events-auto flex flex-col gap-3 rounded-xl p-3")}>
        <StepList m={m} />
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="h-11 px-4" onClick={m.onBack}>
              Back
            </Button>
            {review ? null : (
              <Button type="button" className="h-11 flex-1 text-sm" disabled={m.blocked !== null} onClick={m.onContinue}>
                {m.continueLabel}
              </Button>
            )}
          </div>
          {m.blocked ? (
            <p className="text-xs text-muted-foreground" role="status">
              {m.blocked}
            </p>
          ) : null}
        </div>
      </div>

      {review ? (
        <div className={cn(flashingFloat, "pointer-events-auto flex flex-col gap-3 rounded-xl p-4")}>
          <div>
            <p className="text-xs text-muted-foreground">Estimated total</p>
            <PriceValue price={m.price} pending={m.pending} className="text-3xl leading-10" />
            {each ? <p className="text-xs text-muted-foreground tabular-nums">{each}</p> : null}
          </div>
          <Button type="button" className="h-11 w-full" onClick={m.review.onOrderNow}>
            Order now
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="h-10 px-2" onClick={m.review.onRequestQuote}>
              Request a quote
            </Button>
            <Button type="button" variant="outline" className="h-10 px-2" onClick={m.review.onAddToCart}>
              Add to cart
            </Button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

/** Bottom-centre canvas tools. Rotate lives in the sidebar. */
export function CanvasTools({
  m,
  controlsRef,
  panOn,
}: {
  m: FlashingModel
  controlsRef: RefObject<ViewportControls | null>
  panOn: boolean
}) {
  const design = m.currentStep === "design"
  const mod = isMac() ? "⌘" : "Ctrl+"
  return (
    <div
      role="toolbar"
      aria-label="Canvas tools"
      className={cn(
        flashingFloat,
        "pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-xl p-1",
        layer.chrome
      )}
    >
      {design ? (
        <>
          <IconButton label="Undo" shortcut={`${mod}Z`} side="top" disabled={!m.canUndo} onClick={m.onUndo}>
            <Undo2 />
          </IconButton>
          <IconButton label="Redo" shortcut={`${mod}⇧Z`} side="top" disabled={!m.canRedo} onClick={m.onRedo}>
            <Redo2 />
          </IconButton>
          <Divider />
        </>
      ) : null}
      <IconButton label="Zoom out" shortcut="−" side="top" onClick={() => controlsRef.current?.zoomBy(1 / 1.25)}>
        <Minus />
      </IconButton>
      <IconButton label="Zoom in" shortcut="+" side="top" onClick={() => controlsRef.current?.zoomBy(1.25)}>
        <Plus />
      </IconButton>
      <IconButton label="Fit to screen" shortcut="0" side="top" onClick={() => controlsRef.current?.fit()}>
        <LocateFixed />
      </IconButton>
      <Divider />
      <IconButton label="Pan" shortcut="H" side="top" active={panOn} onClick={() => controlsRef.current?.togglePan()}>
        <Hand />
      </IconButton>
      <IconButton label={m.showGrid ? "Hide grid" : "Show grid"} shortcut="G" side="top" active={m.showGrid} onClick={m.onToggleGrid}>
        <Grid3x3 />
      </IconButton>
    </div>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden />
}

/** One-line hint, bottom-left. Dismissible; it also goes away after the first drag or extend. */
export function HintCard({ onDismiss, raised }: { onDismiss: () => void; raised: boolean }) {
  return (
    <div
      role="note"
      className={cn(
        flashingFloat,
        "pointer-events-auto absolute left-4 flex h-11 max-w-[min(26rem,calc(100%-2rem))] items-center gap-1 rounded-xl pr-1 pl-3 text-sm text-muted-foreground",
        raised ? "bottom-[4.75rem]" : "bottom-4",
        layer.chrome
      )}
    >
      <span className="truncate">Drag points to reshape · click an end to extend</span>
      <IconButton label="Dismiss hint" side="top" onClick={onDismiss}>
        <X />
      </IconButton>
    </div>
  )
}
