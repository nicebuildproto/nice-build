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
import { useEffect, useMemo, useReducer, useState, type ReactNode } from "react"
import { AlignStep } from "./AlignStep"
import { DesignStep } from "./DesignStep"
import { useDebouncedValue } from "./hooks"
import { IntroStep } from "./IntroStep"
import { MaterialStep } from "./MaterialStep"
import { ConfirmationStep, OrderStep } from "./OrderStep"
import { editSteps, LengthStep, StepIndicator, TemplateStep } from "./Onboarding"
import { PriceBar } from "./PriceBar"
import { ReviewStep } from "./ReviewStep"
import { TaperStep } from "./TaperStep"

const reviewIndex = editSteps.findIndex((step) => step.id === "review")
const materialIndex = editSteps.findIndex((step) => step.id === "material")
const designIndex = editSteps.findIndex((step) => step.id === "design")

export function FlashingDesigner({
  chrome,
}: {
  chrome?: (slots: { startOver: ReactNode }) => ReactNode
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
  const [toast, setToast] = useState<string | null>(null)
  const [orderRef, setOrderRef] = useState<string | null>(null)
  const [returnToReview, setReturnToReview] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

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

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2600)
  }

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
    showToast(`Added ${quantity} × ${drawingInfo.itemCode} to cart`)
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
    setToast(null)
    dispatch({ type: "reset", points: [] })
    setFitCount((count) => count + 1)
  }

  const hasWork =
    pieceLengthMm !== null || points.length > 0 || stage === "order" || stage === "done" || stage === "edit"

  const continueLabel =
    currentStep === "material"
      ? "Continue to review"
      : currentStep === "taper" && !taperEnabled
        ? "Skip"
        : "Continue"

  const showConfigureChrome = stage === "edit" && currentStep !== "review"
  const showStepper = stage === "edit"

  if (!hydrated) {
    return <main className="min-h-[100dvh] flex-1 bg-background" />
  }

  return (
    <TooltipProvider delay={300}>
      <main className="flex min-h-[100dvh] flex-1 flex-col lg:h-[100dvh]">
        <header className="shrink-0 border-b border-border text-sm">
          {chrome ? (
            chrome({
              startOver:
                stage !== "intro" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 px-2 text-[var(--nb-secondary)]"
                    onClick={() => (hasWork ? setConfirmReset(true) : resetAll())}
                  >
                    Start over
                  </Button>
                ) : null,
            })
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
                    onClick={() => (hasWork ? setConfirmReset(true) : resetAll())}
                  >
                    Start over
                  </Button>
                ) : null}
                <HeaderActions />
              </div>
            </div>
          )}
          {showConfigureChrome && pieceLengthMm !== null ? (
            <div className="border-t border-black/[0.04] px-4 py-3 sm:px-6">
              <PriceBar
                pieceLengthMm={pieceLengthMm}
                onPieceLengthChange={setPieceLengthMm}
                quantity={quantity}
                onQuantityChange={setQuantity}
                girthMm={liveGirth}
                folds={foldCount(points)}
                materialSummary={materialSummary}
                price={price}
                pending={pricePending}
              />
            </div>
          ) : null}
        </header>

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

        {stage === "edit" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            {showStepper ? (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <StepIndicator current={step} reached={reached} onSelect={goTo} />
                {currentStep !== "review" ? (
                  <div className="flex items-center gap-2 sm:gap-3">
                    {blocked ? (
                      <span className={tooLong ? "text-xs text-red-600" : "text-xs text-[var(--nb-secondary)]"}>
                        {blocked}
                      </span>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10"
                      onClick={() => (step === 0 ? setStage("template") : goTo(step - 1))}
                    >
                      Back
                    </Button>
                    <Button type="button" className="h-10" disabled={blocked !== null} onClick={() => goTo(step + 1)}>
                      {continueLabel}
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" className="h-10" onClick={() => goTo(materialIndex)}>
                    Back
                  </Button>
                )}
              </div>
            ) : null}

            {currentStep === "review" ? (
              <ReviewStep
                points={points}
                taper={tapered}
                taperLengths={taperLengths}
                info={drawingInfo}
                profileName={profileName}
                pieceLengthMm={pieceLengthMm ?? 0}
                quantity={quantity}
                girthMm={price.girthMm}
                materialLabel={materialLabel}
                colourLabel={colourLabel}
                price={price}
                pending={pricePending}
                onEdit={(target) => {
                  if (target === "length") {
                    setReturnToReview(true)
                    setStage("length")
                    return
                  }
                  goTo(target === "material" ? materialIndex : designIndex)
                }}
                onRequestQuote={requestQuote}
                onAddToCart={addToCart}
                onOrderNow={() => setStage("order")}
              />
            ) : (
              <div className="relative mx-4 mb-4 min-h-[min(70dvh,560px)] flex-1 overflow-hidden rounded-2xl border border-black/[0.08] bg-white sm:mx-6">
                <div className="absolute inset-0">
                  {currentStep === "design" ? (
                    <DesignStep
                      editor={editor}
                      dispatch={dispatch}
                      snap={snap}
                      onSnapChange={setSnap}
                      showDims={showDims}
                      onShowDimsChange={setShowDims}
                      showGrid={showGrid}
                      onToggleGrid={() => setShowGrid((value) => !value)}
                      onLoadTemplate={(id) => loadTemplate(id, true)}
                      fitKey={`design-${fitCount}`}
                    />
                  ) : null}

                  {currentStep === "taper" ? (
                    <TaperStep
                      points={points}
                      enabled={taperEnabled}
                      onEnabledChange={setTaperEnabled}
                      lengths={taperLengths}
                      onLengthChange={(index, value) => {
                        const next = [...taperLengths]
                        next[index] = value
                        setStoredTaper(next)
                      }}
                      anchor={anchor}
                      showGrid={showGrid}
                      onToggleGrid={() => setShowGrid((value) => !value)}
                    />
                  ) : null}

                  {currentStep === "align" ? (
                    <AlignStep
                      points={points}
                      taperEnabled={taperEnabled}
                      lengths={taperLengths}
                      anchor={anchor}
                      isOverride={anchorOverride !== null}
                      onAnchorChange={setAnchorOverride}
                      showGrid={showGrid}
                      onToggleGrid={() => setShowGrid((value) => !value)}
                    />
                  ) : null}

                  {currentStep === "material" ? (
                    <MaterialStep
                      points={points}
                      material={material}
                      onMaterialChange={setMaterial}
                      colourId={colourId}
                      onColourChange={setColourId}
                      side={side}
                      onSideChange={setSide}
                    />
                  ) : null}
                </div>
              </div>
            )}
          </div>
        ) : null}

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

        <div
          role="status"
          className={
            "pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--nb-primary)] px-4 py-2 text-sm text-white shadow-lg transition-all duration-200 motion-reduce:transition-none " +
            (toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")
          }
        >
          {toast}
        </div>
      </main>
    </TooltipProvider>
  )
}
