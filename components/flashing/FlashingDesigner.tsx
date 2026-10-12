"use client"

import { BrandLink } from "@/components/BrandLink"
import { HeaderActions } from "@/components/site/HeaderActions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { createEditor, editorReducer } from "@/lib/flashing/editor"
import {
  foldCount,
  girth,
  inferAnchor,
  MAX_GIRTH_MM,
  taperedGirth,
  taperedPoints,
} from "@/lib/flashing/geometry"
import {
  clearDraft,
  defaultDraft,
  loadDraft,
  saveDraft,
  type FlashingStage,
} from "@/lib/flashing/persist"
import {
  calculatePrice,
  colourById,
  defaultRateConfig,
  itemCode,
  materialById,
  type ColourSide,
  type MaterialId,
} from "@/lib/flashing/pricing"
import { templateById } from "@/lib/flashing/templates"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react"
import { useDebouncedValue } from "./hooks"
import { IntroStep } from "./IntroStep"
import { materialShort } from "./labels"
import type { FlashingModel } from "./model"
import { ConfirmationStep, OrderStep } from "./OrderStep"
import { editSteps, LengthStep, TemplateStep } from "./Onboarding"
import { FlashingWorkspace } from "./Workspace"

const reviewIndex = editSteps.findIndex((step) => step.id === "review")
const materialIndex = editSteps.findIndex((step) => step.id === "material")
const designIndex = editSteps.findIndex((step) => step.id === "design")

export function FlashingDesigner({
  chrome,
  mark,
  actions,
}: {
  chrome?: (slots: { startOver: ReactNode }) => ReactNode
  mark?: ReactNode
  actions?: ReactNode
} = {}) {
  const [hydrated, setHydrated] = useState(false)
  const [stage, setStage] = useState<FlashingStage>("intro")
  const [step, setStep] = useState(0)
  const [reached, setReached] = useState(0)

  const [pieceLengthMm, setPieceLengthMm] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [editor, dispatch] = useReducer(editorReducer, undefined, () => createEditor())
  const [fitCount, setFitCount] = useState(0)

  const [showGrid, setShowGrid] = useState(true)
  const [snap, setSnap] = useState(true)
  const [showDims, setShowDims] = useState(true)

  const [taperEnabled, setTaperEnabled] = useState(false)
  const [storedTaper, setStoredTaper] = useState<(number | null)[]>([])
  const [anchorOverride, setAnchorOverride] = useState<number | null>(null)

  const [material, setMaterial] = useState<MaterialId>("colour")
  const [colourId, setColourId] = useState("monument")
  const [side, setSide] = useState<ColourSide>("out")
  const [toast, setToast] = useState<{ message: string; action?: { label: string; onClick: () => void } } | null>(null)
  const [orderRef, setOrderRef] = useState<string | null>(null)
  const [returnToReview, setReturnToReview] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [cartAdded, setCartAdded] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  const points = editor.present
  const segmentCount = Math.max(0, points.length - 1)
  const taperLengths =
    storedTaper.length === segmentCount ? storedTaper : Array<number | null>(segmentCount).fill(null)
  const anchor =
    anchorOverride !== null && anchorOverride < points.length
      ? anchorOverride
      : inferAnchor(points, taperLengths)
  const liveGirth = taperEnabled ? Math.max(girth(points), taperedGirth(points, taperLengths)) : girth(points)

  const [pricedPoints, pricePending] = useDebouncedValue(points, 500)
  const price = useMemo(
    () =>
      calculatePrice(
        { points: pricedPoints, taper: { enabled: taperEnabled, lengths: taperLengths } },
        material,
        { colourId, side },
        quantity,
        pieceLengthMm ?? 0,
        defaultRateConfig
      ),
    [pricedPoints, taperEnabled, taperLengths, material, colourId, side, quantity, pieceLengthMm]
  )

  const colour = material === "colour" ? colourById(colourId) : null
  const materialLabel = materialById(material).label
  const colourLabel = colour
    ? `${colour.label} · ${side === "out" ? "Colour facing out" : "Colour facing in"}`
    : "Uncoated"
  const materialSummary = colour ? `${colour.label} · ${side === "out" ? "Colour facing out" : "Colour facing in"}` : materialLabel
  const profileName = templateById(templateId)?.name ?? "Custom profile"

  useEffect(() => {
    let cancelled = false
    const frame = requestAnimationFrame(() => {
      if (cancelled) return
      const draft = loadDraft()
      if (draft) {
        setStage(draft.stage)
        setStep(draft.step)
        setReached(draft.reached)
        setPieceLengthMm(draft.pieceLengthMm)
        setQuantity(draft.quantity)
        setTemplateId(draft.templateId)
        setTaperEnabled(draft.taperEnabled)
        setStoredTaper(draft.storedTaper)
        setAnchorOverride(draft.anchorOverride)
        setMaterial(draft.material)
        setColourId(draft.colourId)
        setSide(draft.side)
        setShowGrid(draft.showGrid)
        setSnap(draft.snap)
        setShowDims(draft.showDims)
        setOrderRef(draft.orderRef)
        dispatch({ type: "reset", points: draft.points })
        setFitCount((count) => count + 1)
      }
      setHydrated(true)
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveDraft({
      version: 1,
      stage,
      step,
      reached,
      pieceLengthMm,
      quantity,
      templateId,
      points,
      taperEnabled,
      storedTaper,
      anchorOverride,
      material,
      colourId,
      side,
      showGrid,
      snap,
      showDims,
      orderRef,
    })
  }, [
    hydrated,
    stage,
    step,
    reached,
    pieceLengthMm,
    quantity,
    templateId,
    points,
    taperEnabled,
    storedTaper,
    anchorOverride,
    material,
    colourId,
    side,
    showGrid,
    snap,
    showDims,
    orderRef,
  ])

  const loadTemplate = (id: string | null, undoable: boolean) => {
    const nextPoints = templateById(id)?.points ?? []
    dispatch(undoable ? { type: "replace", points: nextPoints } : { type: "reset", points: nextPoints })
    setTemplateId(id)
    setStoredTaper([])
    setAnchorOverride(null)
    setFitCount((count) => count + 1)
  }

  const goTo = (index: number) => {
    setStep(index)
    setReached((value) => Math.max(value, index))
  }

  const currentStep = editSteps[step]?.id ?? "design"
  const tooLong = liveGirth > MAX_GIRTH_MM
  const blocked =
    currentStep === "design" && (points.length < 2 || tooLong)
      ? points.length < 2
        ? "Draw at least one segment to continue."
        : `Keep the profile girth to ${MAX_GIRTH_MM} mm or less.`
      : null

  const showToast = (message: string, action?: { label: string; onClick: () => void }) => setToast({ message, action })
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), toast.action ? 7000 : 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const tapered = taperEnabled ? taperedPoints(points, taperLengths, anchor) : null
  const drawingInfo = {
    itemCode: itemCode({
      templateCode: templateById(templateId)?.code ?? "CUS",
      girthMm: price.girthMm,
      folds: foldCount(points),
      tapered: taperEnabled,
      material,
      colourId,
      side,
    }),
    profile: profileName,
    material: materialLabel,
    colour: colour ? `${colour.label} · facing ${side === "out" ? "out" : "in"}` : "Uncoated",
    pieceLength: `${pieceLengthMm ?? 0} mm`,
    quantity: String(quantity),
    girth: `${Math.round(price.girthMm)} mm`,
    folds: `${foldCount(points)}${taperEnabled ? " · tapered" : ""}`,
  }

  const addToCart = () => {
    console.log("Add to cart", { itemCode: drawingInfo.itemCode, quantity, pieceLengthMm, total: price.total })
    setCartAdded(true)
  }

  const startNewDesign = () => {
    setCartAdded(false)
    setTemplateId(null)
    setTaperEnabled(false)
    setStoredTaper([])
    setAnchorOverride(null)
    setReturnToReview(false)
    setToast(null)
    dispatch({ type: "reset", points: [] })
    setFitCount((count) => count + 1)
    setStage("template")
    setStep(0)
    setReached(0)
  }

  const requestQuote = () => {
    console.log("Request quote", { itemCode: drawingInfo.itemCode, quantity, pieceLengthMm, total: price.total })
    showToast("Quote request noted")
  }

  const resetAll = () => {
    const next = defaultDraft()
    clearDraft()
    setStage(next.stage)
    setStep(next.step)
    setReached(next.reached)
    setPieceLengthMm(next.pieceLengthMm)
    setQuantity(next.quantity)
    setTemplateId(next.templateId)
    setTaperEnabled(next.taperEnabled)
    setStoredTaper(next.storedTaper)
    setAnchorOverride(next.anchorOverride)
    setMaterial(next.material)
    setColourId(next.colourId)
    setSide(next.side)
    setShowGrid(next.showGrid)
    setSnap(next.snap)
    setShowDims(next.showDims)
    setOrderRef(null)
    setReturnToReview(false)
    setConfirmReset(false)
    setCartAdded(false)
    setToast(null)
    dispatch({ type: "reset", points: [] })
    setFitCount((count) => count + 1)
  }

  const clearCanvas = () => {
    const previous = { templateId, storedTaper, anchorOverride }
    loadTemplate(null, true)
    showToast("Canvas cleared", {
      label: "Undo",
      onClick: () => {
        dispatch({ type: "undo" })
        setTemplateId(previous.templateId)
        setStoredTaper(previous.storedTaper)
        setAnchorOverride(previous.anchorOverride)
        setFitCount((count) => count + 1)
        setToast(null)
      },
    })
  }

  const hasWork =
    pieceLengthMm !== null || points.length > 0 || stage === "order" || stage === "done" || stage === "edit"

  const continueLabel =
    currentStep === "material"
      ? "Continue to review"
      : currentStep === "taper" && !taperEnabled
        ? "Skip"
        : "Continue"

  const canvas = stage === "edit" && pieceLengthMm !== null
  // Opening the dialog is deferred a tick: on touch the dialog's outside-press listener fires on click, and would
  // otherwise receive the same click that opened it (and close it straight away).
  const requestStartOver = () => {
    if (!hasWork) {
      resetAll()
      return
    }
    window.setTimeout(() => setConfirmReset(true), 0)
  }

  const startOver =
    stage !== "intro" ? (
      <Button
        type="button"
        variant="ghost"
        className="h-9 px-2.5 text-muted-foreground"
        onClick={requestStartOver}
      >
        Start over
      </Button>
    ) : null
  const canvasLogo = mark ?? <BrandLink logoClassName="h-7" />
  const canvasActions_ = actions === undefined ? <HeaderActions variant="stage" /> : actions

  const model: FlashingModel | null =
    canvas && pieceLengthMm !== null
      ? {
          logo: canvasLogo,
          actions: canvasActions_,
          startOver,
          step,
          reached,
          currentStep,
          goTo,
          onBack: () => (step === 0 ? setStage("template") : goTo(step - 1)),
          onContinue: () => goTo(step + 1),
          blocked,
          continueLabel,
          stepSummaries: [
            `${foldCount(points)} ${foldCount(points) === 1 ? "fold" : "folds"}, ${Math.round(liveGirth)} mm`,
            taperEnabled ? "Tapered" : "No taper",
            !taperEnabled ? "Not needed" : anchorOverride !== null ? "Set by you" : "Automatic",
            materialShort({ material, colourId, side }),
            "Check and order",
          ],
          editor,
          dispatch,
          points,
          templateId,
          profileName,
          snap,
          onSnapChange: setSnap,
          showDims,
          onShowDimsChange: setShowDims,
          showGrid,
          onToggleGrid: () => setShowGrid((value) => !value),
          canUndo: editor.past.length > 0,
          canRedo: editor.future.length > 0,
          onUndo: () => dispatch({ type: "undo" }),
          onRedo: () => dispatch({ type: "redo" }),
          canRotate: points.length >= 2,
          onRotate: (degrees) => {
            dispatch({ type: "rotate", degrees })
            setFitCount((count) => count + 1)
          },
          onClear: clearCanvas,
          onLoadTemplate: (id) => loadTemplate(id, true),
          fitKey: `design-${fitCount}`,
          taperEnabled,
          onTaperEnabled: setTaperEnabled,
          taperLengths,
          onTaperLength: (index, value) => {
            const next = [...taperLengths]
            next[index] = value
            setStoredTaper(next)
          },
          anchor,
          anchorIsOverride: anchorOverride !== null,
          onAnchorChange: setAnchorOverride,
          material,
          onMaterialChange: setMaterial,
          colourId,
          onColourChange: setColourId,
          side,
          onSideChange: setSide,
          pieceLengthMm,
          onPieceLengthChange: setPieceLengthMm,
          quantity,
          onQuantityChange: setQuantity,
          girthMm: liveGirth,
          folds: foldCount(points),
          price,
          pending: pricePending,
          materialLabel,
          materialSummary,
          review: {
            info: drawingInfo,
            tapered,
            colourLabel,
            onEdit: (target) => {
              if (target === "length") {
                setReturnToReview(true)
                setStage("length")
                return
              }
              goTo(target === "material" ? materialIndex : designIndex)
            },
            onRequestQuote: requestQuote,
            onAddToCart: addToCart,
            onOrderNow: () => {
              window.scrollTo({ top: 0, left: 0, behavior: "auto" })
              setStage("order")
            },
          },
        }
      : null

  if (!hydrated) {
    return <main className="min-h-[100dvh] flex-1 bg-background" />
  }

  return (
    <TooltipProvider delay={300}>
      <main
        ref={mainRef}
        className={cn(
          "flex flex-1 flex-col",
          canvas
            ? "h-dvh flex-none overflow-hidden"
            : stage === "order" || stage === "done"
              ? "min-h-[100dvh]"
              : "min-h-[100dvh] lg:h-[100dvh] lg:flex-none lg:overflow-hidden"
        )}
        style={{ overflowAnchor: "none" }}
      >
        {!canvas ? (
        <header className="sticky top-0 z-20 shrink-0 border-b border-border bg-background text-sm">
          {chrome ? (
            chrome({ startOver })
          ) : (
            <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
              <BrandLink logoClassName="h-6" />
              <span className="text-[var(--nb-secondary)]/40">/</span>
              <span className="min-w-0 truncate font-medium">Flashing Designer</span>
              <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
                {stage !== "intro" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 px-2 text-[var(--nb-secondary)]"
                    onClick={requestStartOver}
                  >
                    Start over
                  </Button>
                ) : null}
                <HeaderActions />
              </div>
            </div>
          )}
        </header>
        ) : null}

        {stage === "intro" ? <IntroStep onStart={() => setStage("length")} /> : null}

        {stage === "length" ? (
          <LengthStep
            initial={pieceLengthMm}
            initialQuantity={quantity}
            submitLabel={returnToReview ? "Save and review" : "Continue"}
            onBack={() => {
              if (returnToReview) {
                setReturnToReview(false)
                setStage("edit")
                goTo(reviewIndex)
                return
              }
              setStage("intro")
            }}
            onSubmit={(value, nextQuantity) => {
              setPieceLengthMm(value)
              setQuantity(nextQuantity)
              if (returnToReview) {
                setReturnToReview(false)
                setStage("edit")
                goTo(reviewIndex)
                return
              }
              setStage("template")
            }}
          />
        ) : null}

        {stage === "template" ? (
          <TemplateStep
            onBack={() => setStage("length")}
            onChoose={(id) => {
              loadTemplate(id, false)
              setStage("edit")
              setStep(0)
              setReached(0)
            }}
          />
        ) : null}

        {model ? <FlashingWorkspace m={model} /> : null}

        {stage === "order" && pieceLengthMm !== null ? (
          <OrderStep
            points={points}
            taper={tapered}
            taperLengths={taperLengths}
            info={drawingInfo}
            profileName={profileName}
            pieceLengthMm={pieceLengthMm}
            quantity={quantity}
            materialSummary={materialSummary}
            price={price}
            onBack={() => {
              setStage("edit")
              goTo(reviewIndex)
            }}
            onPlace={() => {
              setOrderRef(`NB-${10482 + (Date.now() % 8000)}`)
              setStage("done")
            }}
          />
        ) : null}

        {stage === "done" ? (
          <ConfirmationStep
            orderRef={orderRef ?? "NB-10482"}
            points={points}
            taper={tapered}
            taperLengths={taperLengths}
            info={drawingInfo}
            onBack={() => {
              setStage("edit")
              goTo(reviewIndex)
            }}
          />
        ) : null}

        <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start over?</DialogTitle>
              <DialogDescription>
                This clears the current flashing design, including the profile, dimensions and finish.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={resetAll}>
                Start over
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={cartAdded} onOpenChange={setCartAdded}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Added to your order</DialogTitle>
              <DialogDescription>
                {quantity} × {drawingInfo.itemCode} is in the order. Start a new design if you want to add
                another flashing.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setCartAdded(false)}>
                Stay on review
              </Button>
              <Button type="button" onClick={startNewDesign}>
                Start a new design
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div
          role="status"
          className={cn(
            "fixed left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl bg-foreground py-1.5 pr-1.5 pl-4 text-sm text-background shadow-lg transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none top-[calc(env(safe-area-inset-top)+6.5rem)]",
            toast ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
          )}
        >
          <span>{toast?.message}</span>
          {toast?.action ? (
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3 text-background underline underline-offset-4 hover:bg-background/15 hover:text-background"
              onClick={toast.action.onClick}
            >
              {toast.action.label}
            </Button>
          ) : null}
        </div>
      </main>
    </TooltipProvider>
  )
}
