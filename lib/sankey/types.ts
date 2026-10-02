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

export interface LaidNode {
  id: string
  name: string
  layer: number
  value: number
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
  nodeColor: "#111111",
  flowColor: "#111111",
  background: "#ffffff",
  labelColor: "#111111",
  showValues: true,
  showLabels: true,
  nodeWidth: 14,
  nodeSpacing: 18,
  minNodeHeight: 16,
  flowOpacity: 0.28,
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
