"use client"

import { BrandLink } from "@/components/BrandLink"
import { HeaderActions } from "@/components/site/HeaderActions"
import { Button } from "@/components/ui/button"
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
  calculatePrice,
  colourById,
  defaultRateConfig,
  itemCode,
  materialById,
  type ColourSide,
  type MaterialId,
} from "@/lib/flashing/pricing"
import { templateById } from "@/lib/flashing/templates"
import { useMemo, useReducer, useState } from "react"
import { AlignStep } from "./AlignStep"
import { DesignStep } from "./DesignStep"
import { useDebouncedValue } from "./hooks"
import { MaterialStep } from "./MaterialStep"
import { editSteps, LengthStep, StepIndicator, TemplateStep } from "./Onboarding"
import { PriceBar } from "./PriceBar"
import { TaperStep } from "./TaperStep"
import { TechnicalDrawing } from "./TechnicalDrawing"

type Stage = "length" | "template" | "edit"

export function FlashingDesigner() {
  const [stage, setStage] = useState<Stage>("length")
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
  const [colourId, setColourId] = useState("slate")
  const [side, setSide] = useState<ColourSide>("out")
  const [toast, setToast] = useState<string | null>(null)

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
  const materialSummary = colour
    ? `${colour.label} · ${side === "out" ? "Colour facing out" : "Colour facing in"}`
    : materialById(material).label

  const loadTemplate = (id: string | null, undoable: boolean) => {
    const points = templateById(id)?.points ?? []
    dispatch(undoable ? { type: "replace", points } : { type: "reset", points })
    setTemplateId(id)
    setStoredTaper([])
    setAnchorOverride(null)
    setFitCount((count) => count + 1)
  }

  const goTo = (index: number) => {
    setStep(index)
    setReached((value) => Math.max(value, index))
  }

  const currentStep = editSteps[step].id
  const tooLong = liveGirth > MAX_GIRTH_MM
  const blocked =
    currentStep === "design" && (points.length < 2 || tooLong)
      ? points.length < 2
        ? "Draw at least one segment to continue."
        : `Keep the total length of metal to ${MAX_GIRTH_MM} mm or less.`
      : null

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast((current) => (current === message ? null : current)), 2600)
  }

  const order = () => {
    const tapered = taperEnabled ? taperedPoints(points, taperLengths, anchor) : null
    return {
      itemCode: itemCode({
        templateCode: templateById(templateId)?.code ?? "CUS",
        girthMm: price.girthMm,
        folds: foldCount(points),
        tapered: taperEnabled,
        material,
        colourId,
        side,
      }),
      tapered,
    }
  }

  return (
    <TooltipProvider delay={300}>
      <main className="flex min-h-[100dvh] flex-1 flex-col lg:h-[100dvh]">
        <header className="shrink-0 border-b border-border text-sm">
          <div className="flex h-14 items-center gap-2 px-5 sm:px-6">
            <BrandLink logoClassName="h-6" />
            <span className="text-[var(--nb-secondary)]/40">/</span>
            <span className="min-w-0 truncate font-medium">Flashing Designer</span>
            {stage !== "edit" ? (
              <span className="ml-3 hidden text-[var(--nb-secondary)] lg:inline">
                Draw a profile, choose a material, see the price.
              </span>
            ) : null}
            <div className="ml-auto shrink-0">
              <HeaderActions />
            </div>
          </div>
          {stage === "edit" && pieceLengthMm !== null ? (
            <div className="border-t border-black/[0.04] px-6 py-2">
              <PriceBar
                review={currentStep === "review"}
                pieceLengthMm={pieceLengthMm}
                onPieceLengthChange={setPieceLengthMm}
                quantity={quantity}
                onQuantityChange={setQuantity}
                girthMm={liveGirth}
                folds={foldCount(points)}
                materialSummary={materialSummary}
                price={price}
                pending={pricePending}
                onAddToCart={() => {
                  const { itemCode } = order()
                  console.log("Add to cart", { itemCode, quantity, pieceLengthMm, total: price.total })
                  showToast(`Added ${quantity} × ${itemCode} to cart`)
                }}
                onRequestQuote={() => {
                  const { itemCode } = order()
                  console.log("Request quote", { itemCode, quantity, pieceLengthMm, total: price.total })
                  showToast("Quote request noted")
                }}
              />
            </div>
          ) : null}
        </header>

        {stage === "length" ? (
          <LengthStep
            initial={pieceLengthMm}
            initialQuantity={quantity}
            onSubmit={(value, nextQuantity) => {
              setPieceLengthMm(value)
              setQuantity(nextQuantity)
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
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
              <StepIndicator current={step} reached={reached} onSelect={goTo} />
              <div className="flex items-center gap-3">
                {blocked ? (
                  <span className={tooLong ? "text-xs text-red-600" : "text-xs text-[var(--nb-secondary)]"}>
                    {blocked}
                  </span>
                ) : null}
                <Button
                  variant="ghost"
                  onClick={() => (step === 0 ? setStage("template") : goTo(step - 1))}
                >
                  Back
                </Button>
                {currentStep !== "review" ? (
                  <Button disabled={blocked !== null} onClick={() => goTo(step + 1)}>
                    {currentStep === "taper" && !taperEnabled ? "Skip" : "Continue"}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="relative mx-6 min-h-[480px] flex-1 overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
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

              {currentStep === "review" ? (
                <div className="flex h-full items-center justify-center p-4 lg:p-8">
                  <TechnicalDrawing
                    points={points}
                    taper={order().tapered}
                    taperLengths={taperLengths}
                    info={{
                      itemCode: order().itemCode,
                      profile: templateById(templateId)?.name ?? "Custom profile",
                      material: materialById(material).label,
                      colour: colour
                        ? `${colour.label} · facing ${side === "out" ? "out" : "in"}`
                        : "Uncoated",
                      pieceLength: `${pieceLengthMm ?? 0} mm`,
                      quantity: String(quantity),
                      girth: `${Math.round(price.girthMm)} mm`,
                      folds: `${foldCount(points)}${taperEnabled ? " · tapered" : ""}`,
                    }}
                  />
                </div>
              ) : null}
              </div>
            </div>

          </div>
        ) : null}

        <div
          role="status"
          className={
            "pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--nb-primary)] px-4 py-2 text-sm text-white shadow-lg transition-all duration-200 " +
            (toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")
          }
        >
          {toast}
        </div>
      </main>
    </TooltipProvider>
  )
}
