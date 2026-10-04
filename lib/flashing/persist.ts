import { createEditor, type EditorState } from "@/lib/flashing/editor"
import type { Point } from "@/lib/flashing/geometry"
import { colourById, type ColourSide, type MaterialId } from "@/lib/flashing/pricing"

export const flashingDraftKey = "nb-flashing-draft"

export type FlashingStage = "intro" | "length" | "template" | "edit" | "order" | "done"

export type FlashingDraft = {
  version: 1
  stage: FlashingStage
  step: number
  reached: number
  pieceLengthMm: number | null
  quantity: number
  templateId: string | null
  points: Point[]
  taperEnabled: boolean
  storedTaper: (number | null)[]
  anchorOverride: number | null
  material: MaterialId
  colourId: string
  side: ColourSide
  showGrid: boolean
  snap: boolean
  showDims: boolean
  orderRef: string | null
}

export function defaultDraft(): FlashingDraft {
  return {
    version: 1,
    stage: "intro",
    step: 0,
    reached: 0,
    pieceLengthMm: null,
    quantity: 1,
    templateId: null,
    points: [],
    taperEnabled: false,
    storedTaper: [],
    anchorOverride: null,
    material: "colour",
    colourId: "monument",
    side: "out",
    showGrid: true,
    snap: true,
    showDims: true,
    orderRef: null,
  }
}

const stages: FlashingStage[] = ["intro", "length", "template", "edit", "order", "done"]

function isPoint(value: unknown): value is Point {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Point).x === "number" &&
    Number.isFinite((value as Point).x) &&
    typeof (value as Point).y === "number" &&
    Number.isFinite((value as Point).y)
  )
}

export function loadDraft(): FlashingDraft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(flashingDraftKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<FlashingDraft>
    if (parsed.version !== 1) return null
    const base = defaultDraft()
    const colourId = typeof parsed.colourId === "string" && colourById(parsed.colourId) ? parsed.colourId : base.colourId
    const stage = stages.includes(parsed.stage as FlashingStage) ? (parsed.stage as FlashingStage) : base.stage
    const step = typeof parsed.step === "number" && parsed.step >= 0 ? Math.min(Math.floor(parsed.step), 4) : base.step
    const pieceLengthMm =
      typeof parsed.pieceLengthMm === "number" && parsed.pieceLengthMm > 0 ? parsed.pieceLengthMm : null
    const points = Array.isArray(parsed.points) ? parsed.points.filter(isPoint) : []
    const material: MaterialId =
      parsed.material === "colour" || parsed.material === "zincalume" || parsed.material === "galvanised"
        ? parsed.material
        : base.material
    const side: ColourSide = parsed.side === "in" || parsed.side === "out" ? parsed.side : base.side
    const next: FlashingDraft = {
      ...base,
      ...parsed,
      version: 1,
      stage,
      step,
      reached: typeof parsed.reached === "number" ? Math.max(0, Math.min(4, Math.floor(parsed.reached))) : base.reached,
      pieceLengthMm,
      quantity: typeof parsed.quantity === "number" && parsed.quantity >= 1 ? Math.min(999, Math.floor(parsed.quantity)) : 1,
      material,
      colourId,
      side,
      storedTaper: Array.isArray(parsed.storedTaper) ? parsed.storedTaper : [],
      points,
    }
    if ((next.stage === "edit" || next.stage === "order" || next.stage === "done") && next.pieceLengthMm === null) {
      next.stage = next.points.length > 0 ? "length" : "intro"
    }
    return next
  } catch {
    return null
  }
}

export function saveDraft(draft: FlashingDraft) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(flashingDraftKey, JSON.stringify(draft))
  } catch {
    /* quota or private mode */
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return
  localStorage.removeItem(flashingDraftKey)
}

export function editorFromDraft(draft: FlashingDraft): EditorState {
  return createEditor(draft.points)
}
