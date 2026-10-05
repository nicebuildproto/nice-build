export type WaterfallKind = "relative" | "total"

export type WaterfallInput = {
  label: string
  value: number
  kind: WaterfallKind
}

export type WaterfallBar = WaterfallInput & {
  start: number
  end: number
  display: number
}

export function layoutWaterfall(rows: WaterfallInput[]): WaterfallBar[] {
  let running = 0
  return rows.map((row) => {
    if (row.kind === "total") {
      const bar = { ...row, start: 0, end: row.value, display: row.value }
      running = row.value
      return bar
    }
    const start = running
    const end = running + row.value
    running = end
    return { ...row, start, end, display: row.value }
  })
}
