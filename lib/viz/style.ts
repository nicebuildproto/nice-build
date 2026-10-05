import { vizThemes, type VizTheme, type VizThemeId } from "./themes"

export type LegendPosition = "bottom" | "right" | "none"
export type LabelWeight = 400 | 500 | 600

export type VizStyle = {
  theme: VizThemeId
  background: string
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
  theme: "default",
  background: "#ffffff",
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
  const theme = vizThemes[style.theme]
  return { ...theme, background: style.background || theme.background }
}

export type VizMeta = {
  title: string
  subtitle: string
  source: string
}

export const emptyMeta: VizMeta = { title: "", subtitle: "", source: "" }
