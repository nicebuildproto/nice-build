import type { StageTone, VizThemeId } from "@/lib/viz/themes"
import { stageSurfaces, vizThemes } from "@/lib/viz/themes"

export interface SankeyRow {
  id: string
  source: string
  target: string
  value: string
}

export type RowIssue = "missing-source" | "missing-target" | "invalid-value" | "negative" | null

export interface ValidFlow {
  id: string
  source: string
  target: string
  value: number
}

export interface StyleSettings {
  theme: VizThemeId
  stage: StageTone
  nodeColor: string
  flowColor: string
  background: string
  labelColor: string
  showValues: boolean
  showLabels: boolean
  nodeWidth: number
  nodeSpacing: number
  minNodeHeight: number
  flowOpacity: number
  labelPosition: "outside" | "inside"
  autoLayout: boolean
  labelSize: number
  valueSize: number
  labelWeight: 400 | 500 | 600
}

export interface NodeOffset {
  x: number
  y: number
}

export type NumberFormat = "value" | "percent" | "both" | "compact" | "hidden"

export interface NodeSettings {
  numberFormat: NumberFormat
  note: string
}

export const defaultNodeSettings: NodeSettings = { numberFormat: "value", note: "" }

export interface LaidNode {
  id: string
  name: string
  layer: number
  value: number
  /** The number as shown in the label, in the node's chosen format. Empty when hidden. */
  numberText: string
  /** The wrapped note, one entry per line. */
  noteLines: string[]
  note: string
  /** Line heights for the label block (title and number line, then note lines). */
  labelLine: number
  noteSize: number
  noteLine: number
  x: number
  y: number
  width: number
  height: number
}

export interface LaidLink {
  id: string
  source: string
  target: string
  value: number
  path: string
}

export interface SankeyLayout {
  nodes: LaidNode[]
  links: LaidLink[]
  width: number
  height: number
}

export const defaultStyle: StyleSettings = {
  theme: "signal",
  stage: "white",
  nodeColor: vizThemes.signal.series[0],
  flowColor: vizThemes.signal.series[1],
  background: stageSurfaces.white.background,
  labelColor: stageSurfaces.white.ink,
  showValues: true,
  showLabels: true,
  nodeWidth: 14,
  nodeSpacing: 18,
  minNodeHeight: 16,
  flowOpacity: 0.75,
  labelPosition: "outside",
  autoLayout: true,
  labelSize: 12,
  valueSize: 11,
  labelWeight: 500,
}

export function newRow(): SankeyRow {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `row-${Math.random().toString(36).slice(2, 9)}`,
    source: "",
    target: "",
    value: "",
  }
}
