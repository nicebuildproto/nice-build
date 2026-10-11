export type VizThemeId = "ink" | "harbor" | "grove" | "signal" | "citrus" | "bloom" | "volt"

export type StageTone = "white" | "dusk"

export type VizTheme = {
  id: VizThemeId
  label: string
  background: string
  ink: string
  muted: string
  grid: string
  dot: string
  axis: string
  border: string
  series: string[]
  accent: string
  selected: string
  hover: string
}

export type StageSurface = {
  background: string
  ink: string
  muted: string
  grid: string
  dot: string
  axis: string
  border: string
}

/** Stage colour is independent of the chart palette. Only these two surfaces exist. */
export const stageSurfaces: Record<StageTone, StageSurface> = {
  white: {
    background: "#FFFFFF",
    ink: "#18181B",
    muted: "#71717A",
    grid: "#E4E4E7",
    dot: "#D4D4D8",
    axis: "#A1A1AA",
    border: "#E4E4E7",
  },
  dusk: {
    background: "#171A20",
    ink: "#F4F4F5",
    muted: "#A1A1AA",
    grid: "#2C313A",
    dot: "#3C424E",
    axis: "#71717A",
    border: "#323844",
  },
}

const paper = stageSurfaces.white

function theme(
  id: VizThemeId,
  label: string,
  series: string[],
  accent: string
): VizTheme {
  return {
    id,
    label,
    ...paper,
    series,
    accent,
    selected: paper.ink,
    hover: series[0],
  }
}

export const vizThemes: Record<VizThemeId, VizTheme> = {
  ink: theme("ink", "Ink", ["#3C4A5E", "#C46A4A", "#3E7A66", "#C6A15A", "#6E6288", "#5E727C", "#A34B4B", "#4A6FA5", "#8A7340", "#2F6F62", "#8C5A6B", "#6B7A45", "#7A5C38", "#5C5A7A", "#3F7A8C", "#C47A6A"], "#C46A4A"),
  harbor: theme("harbor", "Harbor", ["#2B6CB0", "#2A9D8F", "#E0A100", "#C46B4A", "#6B8CAE", "#6B8F71", "#1D4E89", "#E07A5F", "#0F766E", "#C4A35A", "#3D5A80", "#D97706", "#14B8A6", "#7C6A9A", "#2563EB", "#A16207"], "#2B6CB0"),
  grove: theme("grove", "Grove", ["#1F7A5C", "#E08A2B", "#6B8F3C", "#C46B4A", "#7D9470", "#3D6B5A", "#B45309", "#4D7C0F", "#0F766E", "#CA8A04", "#65A30D", "#9A3412", "#3F6212", "#D97706", "#115E59", "#A16207"], "#1F7A5C"),
  signal: theme("signal", "Signal", ["#2563EB", "#7C3AED", "#F43F5E", "#0F766E", "#F59E0B", "#4F46E5", "#06B6D4", "#84CC16", "#EC4899", "#EA580C", "#6366F1", "#14B8A6", "#E11D48", "#0EA5E9", "#A855F7", "#EAB308"], "#2563EB"),
  citrus: theme("citrus", "Citrus", ["#EA580C", "#CA8A04", "#059669", "#E11D48", "#0284C7", "#7C3AED", "#F97316", "#65A30D", "#DB2777", "#0891B2", "#D97706", "#4F46E5", "#DC2626", "#16A34A", "#C026D3", "#F59E0B"], "#EA580C"),
  bloom: theme("bloom", "Bloom", ["#DB2777", "#7C3AED", "#2563EB", "#F43F5E", "#0891B2", "#A21CAF", "#F472B6", "#6366F1", "#0EA5E9", "#BE123C", "#8B5CF6", "#0D9488", "#E879F9", "#1D4ED8", "#FB7185", "#6D28D9"], "#DB2777"),
  volt: theme("volt", "Volt", ["#65A30D", "#06B6D4", "#F97316", "#E11D48", "#8B5CF6", "#EAB308", "#22C55E", "#0284C7", "#EA580C", "#DB2777", "#A3E635", "#F43F5E", "#14B8A6", "#7C3AED", "#FACC15", "#84CC16"], "#65A30D"),
}

const legacyThemes: Record<string, VizThemeId> = {
  default: "ink",
  mono: "ink",
  soft: "grove",
  contrast: "harbor",
  dusk: "ink",
}

export function themeById(id: string): VizTheme {
  if (id in vizThemes) return vizThemes[id as VizThemeId]
  return vizThemes[legacyThemes[id] ?? "ink"]
}

export function seriesColor(theme: VizTheme, index: number): string {
  return theme.series[index % theme.series.length]
}

export function stageById(id: string): StageTone {
  return id === "dusk" ? "dusk" : "white"
}
