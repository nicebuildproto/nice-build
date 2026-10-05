import { parseNumber } from "./parse"
import type { FunnelStage } from "./examples"

export type FunnelComputed = {
  id: string
  label: string
  value: number
  ofTop: number
  ofPrev: number
  drop: number
  increased: boolean
}

export function computeFunnel(stages: FunnelStage[]): FunnelComputed[] {
  const parsed = stages.map((stage) => ({
    id: stage.id,
    label: stage.label.trim() || "Stage",
    value: parseNumber(stage.value) ?? NaN,
  }))
  const top = parsed[0]?.value ?? 0
  return parsed.map((stage, index) => {
    const previous = index === 0 ? stage.value : parsed[index - 1].value
    const ofTop = top > 0 && Number.isFinite(stage.value) ? (stage.value / top) * 100 : 0
    const ofPrev = previous > 0 && Number.isFinite(stage.value) ? (stage.value / previous) * 100 : 0
    const increased = index > 0 && Number.isFinite(stage.value) && Number.isFinite(previous) && stage.value > previous
    return {
      ...stage,
      ofTop,
      ofPrev,
      drop: index === 0 ? 0 : 100 - ofPrev,
      increased,
    }
  })
}
