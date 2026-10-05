export type GridAlign = "start" | "center" | "end" | "stretch"
export type GridJustify = "start" | "center" | "end" | "stretch" | "space-between"

export type GridConfig = {
  columns: number
  rows: number
  columnGap: number
  rowGap: number
  justifyItems: GridAlign
  alignItems: GridAlign
  justifyContent: GridJustify
  alignContent: GridJustify
  templateColumns: string
  templateRows: string
  areas: string
  useAreas: boolean
}

export const defaultGrid: GridConfig = {
  columns: 3,
  rows: 2,
  columnGap: 16,
  rowGap: 16,
  justifyItems: "stretch",
  alignItems: "stretch",
  justifyContent: "start",
  alignContent: "start",
  templateColumns: "",
  templateRows: "",
  areas: "",
  useAreas: false,
}

export const gridPresets: { id: string; label: string; config: Partial<GridConfig> }[] = [
  { id: "cards", label: "Card grid", config: { columns: 3, rows: 2, columnGap: 16, rowGap: 16, useAreas: false, templateColumns: "repeat(3, minmax(0, 1fr))" } },
  { id: "sidebar", label: "Sidebar", config: { columns: 2, rows: 1, columnGap: 24, rowGap: 0, templateColumns: "240px minmax(0, 1fr)", useAreas: false } },
  { id: "holy", label: "Holy grail", config: { columns: 3, rows: 3, columnGap: 16, rowGap: 12, useAreas: true, templateColumns: "180px minmax(0, 1fr) 180px", templateRows: "auto 1fr auto", areas: `"header header header"\n"nav main aside"\n"footer footer footer"` } },
  { id: "twelve", label: "12 columns", config: { columns: 12, rows: 1, columnGap: 12, rowGap: 12, templateColumns: "repeat(12, minmax(0, 1fr))", useAreas: false } },
]

export function gridCss(config: GridConfig) {
  const columns = config.templateColumns.trim() || `repeat(${config.columns}, minmax(0, 1fr))`
  const rows = config.templateRows.trim() || `repeat(${config.rows}, minmax(80px, auto))`
  const lines = [
    "display: grid;",
    `grid-template-columns: ${columns};`,
    `grid-template-rows: ${rows};`,
    `gap: ${config.rowGap}px ${config.columnGap}px;`,
    `justify-items: ${config.justifyItems};`,
    `align-items: ${config.alignItems};`,
    `justify-content: ${config.justifyContent};`,
    `align-content: ${config.alignContent};`,
  ]
  if (config.useAreas && config.areas.trim()) {
    const quoted = config.areas
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" ")
    lines.splice(3, 0, `grid-template-areas: ${quoted};`)
  }
  return `.grid {\n  ${lines.join("\n  ")}\n}`
}

export function cellCount(config: GridConfig) {
  return Math.max(1, config.columns * config.rows)
}
