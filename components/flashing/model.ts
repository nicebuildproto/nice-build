import type { EditorAction, EditorState } from "@/lib/flashing/editor"
import type { Point } from "@/lib/flashing/geometry"
import type { ColourSide, MaterialId, PriceResult } from "@/lib/flashing/pricing"
import type { Dispatch, ReactNode } from "react"
import type { EditStepId } from "./Onboarding"
import type { DrawingInfo } from "./TechnicalDrawing"

export type ReviewTarget = "length" | "design" | "material"

/** Everything the editing workspace needs. Built once in FlashingDesigner; state and logic stay there. */
export interface FlashingModel {
  logo: ReactNode
  actions: ReactNode
  startOver: ReactNode

  // Navigation
  step: number
  reached: number
  currentStep: EditStepId
  goTo: (index: number) => void
  onBack: () => void
  onContinue: () => void
  blocked: string | null
  continueLabel: string
  stepSummaries: string[]

  // Profile
  editor: EditorState
  dispatch: Dispatch<EditorAction>
  points: Point[]
  templateId: string | null
  profileName: string
  snap: boolean
  onSnapChange: (value: boolean) => void
  showDims: boolean
  onShowDimsChange: (value: boolean) => void
  showGrid: boolean
  onToggleGrid: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  canRotate: boolean
  onRotate: (degrees: number) => void
  onClear: () => void
  onLoadTemplate: (id: string | null) => void
  fitKey: string

  // Taper and align
  taperEnabled: boolean
  onTaperEnabled: (value: boolean) => void
  taperLengths: (number | null)[]
  onTaperLength: (index: number, value: number | null) => void
  anchor: number
  anchorIsOverride: boolean
  onAnchorChange: (index: number | null) => void

  // Material
  material: MaterialId
  onMaterialChange: (value: MaterialId) => void
  colourId: string
  onColourChange: (value: string) => void
  side: ColourSide
  onSideChange: (value: ColourSide) => void

  // Spec and price
  pieceLengthMm: number
  onPieceLengthChange: (value: number) => void
  quantity: number
  onQuantityChange: (value: number) => void
  girthMm: number
  folds: number
  price: PriceResult
  pending: boolean
  materialLabel: string
  materialSummary: string

  // Review
  review: {
    info: DrawingInfo
    tapered: Point[] | null
    colourLabel: string
    onEdit: (target: ReviewTarget) => void
    onRequestQuote: () => void
    onAddToCart: () => void
    onOrderNow: () => void
  }
}
