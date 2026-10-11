import { stageById, stageSurfaces, themeById, type StageTone, type VizTheme, type VizThemeId } from "./themes"

export type LegendPosition = "bottom" | "right" | "none"
export type LabelWeight = 400 | 500 | 600

export type VizStyle = {
  theme: VizThemeId
  stage: StageTone
  showValues: boolean
  showLabels: boolean
  showPercent: boolean
  showGrid: boolean
  showLegend: boolean
  legend: LegendPosition
  labelSize: number
  valueSize: number
  labelWeight: LabelWeight
  padding: number
}

export const defaultVizStyle: VizStyle = {
  theme: "ink",
  stage: "white",
  showValues: true,
  showLabels: true,
  showPercent: true,
  showGrid: true,
  showLegend: true,
  legend: "bottom",
  labelSize: 12,
  valueSize: 11,
  labelWeight: 500,
  padding: 24,
}

export function resolveTheme(style: VizStyle): VizTheme {
  const theme = themeById(style.theme)
  const stage = stageSurfaces[stageById(style.stage)]
  return {
    ...theme,
    background: stage.background,
    ink: stage.ink,
    muted: stage.muted,
    grid: stage.grid,
    dot: stage.dot,
    axis: stage.axis,
    border: stage.border,
    selected: stage.ink,
  }
}

export type VizMeta = {
  title: string
  subtitle: string
  source: string
}

export const emptyMeta: VizMeta = { title: "", subtitle: "", source: "" }
