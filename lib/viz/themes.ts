export type VizThemeId = "default" | "mono" | "soft" | "contrast"

export type VizTheme = {
  id: VizThemeId
  label: string
  background: string
  ink: string
  muted: string
  grid: string
  series: string[]
}

export const vizThemes: Record<VizThemeId, VizTheme> = {
  default: {
    id: "default",
    label: "Default",
    background: "#ffffff",
    ink: "#111111",
    muted: "#6B7280",
    grid: "#E5E7EB",
    series: ["#111111", "#3F3F46", "#52525B", "#71717A", "#A1A1AA", "#27272A"],
  },
  mono: {
    id: "mono",
    label: "Monochrome",
    background: "#ffffff",
    ink: "#18181B",
    muted: "#71717A",
    grid: "#E4E4E7",
    series: ["#18181B", "#3F3F46", "#71717A", "#A1A1AA", "#D4D4D8", "#52525B"],
  },
  soft: {
    id: "soft",
    label: "Soft",
    background: "#F7F7F5",
    ink: "#1F2937",
    muted: "#6B7280",
    grid: "#E7E5E4",
    series: ["#1F2937", "#57534E", "#78716C", "#44403C", "#A8A29E", "#292524"],
  },
  contrast: {
    id: "contrast",
    label: "High Contrast",
    background: "#ffffff",
    ink: "#000000",
    muted: "#111111",
    grid: "#111111",
    series: ["#000000", "#111111", "#262626", "#404040", "#525252", "#171717"],
  },
}

export function seriesColor(theme: VizTheme, index: number): string {
  return theme.series[index % theme.series.length]
}
