import type { LaidNode, NodeSettings, NumberFormat, ValidFlow } from "@/lib/sankey/types"

export function formatValue(value: number): string {
  if (value >= 1000) {
    return Number(value.toFixed(1)).toLocaleString("en-AU", { maximumFractionDigits: 1 })
  }
  return Number(value.toFixed(2)).toLocaleString("en-AU", { maximumFractionDigits: 2 })
}

/** 1.2k, 3.4M, 5B. Below 1,000 it falls back to the normal value format. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs < 1000) return formatValue(value)
  const units = [
    { size: 1e9, suffix: "B" },
    { size: 1e6, suffix: "M" },
    { size: 1e3, suffix: "k" },
  ]
  for (let i = 0; i < units.length; i++) {
    const unit = units[i]
    if (abs < unit.size) continue
    const scaled = Number((value / unit.size).toFixed(1))
    // 999,950 rounds to 1000k; show it as 1M instead.
    if (Math.abs(scaled) >= 1000 && i > 0) return `${Number((value / units[i - 1].size).toFixed(1))}${units[i - 1].suffix}`
    return `${scaled}${unit.suffix}`
  }
  return formatValue(value)
}

/** Whole numbers when exact (40%), otherwise one decimal (12.5%). A zero total shows "-". */
export function formatPercent(value: number, total: number): string {
  if (!(total > 0) || !Number.isFinite(value)) return "-"
  const percent = (value / total) * 100
  if (Math.abs(percent - Math.round(percent)) < 1e-9) return `${Math.round(percent)}%`
  const rounded = Number(percent.toFixed(1))
  return `${rounded}%`
}

/**
 * The total used for percentages: the sum of every node with no incoming link.
 * If there are none (a loop), the largest node value.
 */
export function sankeyTotal(flows: ValidFlow[], nodes: Pick<LaidNode, "id" | "value">[]): number {
  const hasIncoming = new Set(flows.map((flow) => flow.target))
  const sources = nodes.filter((node) => !hasIncoming.has(node.id))
  if (sources.length > 0) return sources.reduce((sum, node) => sum + node.value, 0)
  return nodes.reduce((max, node) => Math.max(max, node.value), 0)
}

export function formatNodeNumber(value: number, total: number, format: NumberFormat): string {
  switch (format) {
    case "percent":
      return formatPercent(value, total)
    case "both":
      return `${formatValue(value)} (${formatPercent(value, total)})`
    case "compact":
      return formatCompact(value)
    case "hidden":
      return ""
    default:
      return formatValue(value)
  }
}

export function settingsFor(settings: Record<string, NodeSettings> | undefined, name: string): NodeSettings {
  const found = settings?.[name]
  return { numberFormat: found?.numberFormat ?? "value", note: found?.note ?? "" }
}
