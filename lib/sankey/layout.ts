import type { LaidLink, LaidNode, NodeOffset, SankeyLayout, StyleSettings, ValidFlow } from "@/lib/sankey/types"

const PAD_X = 88
const PAD_Y = 28

function uniqueNames(flows: ValidFlow[]): string[] {
  const names: string[] = []
  for (const flow of flows) {
    if (!names.includes(flow.source)) names.push(flow.source)
    if (!names.includes(flow.target)) names.push(flow.target)
  }
  return names
}

function assignLayers(flows: ValidFlow[], names: string[]): Map<string, number> {
  const incoming = new Map<string, string[]>()
  for (const name of names) incoming.set(name, [])
  for (const flow of flows) {
    incoming.get(flow.target)?.push(flow.source)
  }

  const layer = new Map<string, number>()
  for (let pass = 0; pass < names.length + 2; pass++) {
    let changed = false
    for (const name of names) {
      const preds = incoming.get(name) ?? []
      const next =
        preds.length === 0
          ? 0
          : Math.max(
              0,
              ...preds.map((pred) => (layer.has(pred) ? (layer.get(pred) ?? 0) + 1 : 0))
            )
      if (layer.get(name) !== next) {
        layer.set(name, next)
        changed = true
      }
    }
    if (!changed) break
  }

  for (const name of names) {
    if (!layer.has(name)) layer.set(name, 0)
  }

  return layer
}

function ribbonPath(x0: number, y0: number, x1: number, y1: number, width: number): string {
  const dy = width / 2
  const c = Math.max(24, (x1 - x0) * 0.48)
  const top = `M ${x0} ${y0 - dy} C ${x0 + c} ${y0 - dy}, ${x1 - c} ${y1 - dy}, ${x1} ${y1 - dy}`
  const bot = `L ${x1} ${y1 + dy} C ${x1 - c} ${y1 + dy}, ${x0 + c} ${y0 + dy}, ${x0} ${y0 + dy} Z`
  return `${top} ${bot}`
}

export function layoutSankey(
  flows: ValidFlow[],
  style: StyleSettings,
  offsets: Record<string, NodeOffset>,
  frame: { width: number; height: number }
): SankeyLayout {
  const width = Math.max(320, frame.width)
  const height = Math.max(220, frame.height)
  const names = uniqueNames(flows)

  if (names.length === 0) {
    return { nodes: [], links: [], width, height }
  }

  const layers = assignLayers(flows, names)
  const maxLayer = Math.max(...[...layers.values()])
  const columns = maxLayer + 1
  const innerWidth = width - PAD_X * 2 - style.nodeWidth
  const columnGap = columns > 1 ? innerWidth / maxLayer : 0

  const incoming = new Map<string, number>()
  const outgoing = new Map<string, number>()
  for (const name of names) {
    incoming.set(name, 0)
    outgoing.set(name, 0)
  }
  for (const flow of flows) {
    outgoing.set(flow.source, (outgoing.get(flow.source) ?? 0) + flow.value)
    incoming.set(flow.target, (incoming.get(flow.target) ?? 0) + flow.value)
  }

  const values = new Map<string, number>()
  for (const name of names) {
    values.set(name, Math.max(incoming.get(name) ?? 0, outgoing.get(name) ?? 0, 0.0001))
  }

  const byLayer = new Map<number, string[]>()
  for (const name of names) {
    const layer = layers.get(name) ?? 0
    const list = byLayer.get(layer) ?? []
    list.push(name)
    byLayer.set(layer, list)
  }

  let maxLayerNeed = 0
  for (const list of byLayer.values()) {
    const valueSum = list.reduce((sum, name) => sum + (values.get(name) ?? 0), 0)
    const spacing = style.nodeSpacing * Math.max(0, list.length - 1)
    maxLayerNeed = Math.max(maxLayerNeed, valueSum + spacing)
  }

  const usable = Math.max(80, height - PAD_Y * 2)
  const pxPerUnit = Math.max(0.2, (usable - style.nodeSpacing * 2) / maxLayerNeed)

  const nodes: LaidNode[] = []
  const nodeMap = new Map<string, LaidNode>()

  for (let layer = 0; layer <= maxLayer; layer++) {
    const list = byLayer.get(layer) ?? []
    const layerValue = list.reduce((sum, name) => sum + (values.get(name) ?? 0), 0)
    const layerHeight =
      layerValue * pxPerUnit + style.nodeSpacing * Math.max(0, list.length - 1)
    let y = PAD_Y + Math.max(0, (usable - layerHeight) / 2)

    for (const name of list) {
      const value = values.get(name) ?? 0
      const h = Math.max(style.minNodeHeight, value * pxPerUnit)
      const baseX = PAD_X + layer * columnGap
      const offset = offsets[name] ?? { x: 0, y: 0 }
      const x = style.autoLayout ? baseX : baseX + offset.x
      const node: LaidNode = {
        id: name,
        name,
        layer,
        value,
        x,
        y: y + offset.y,
        width: style.nodeWidth,
        height: h,
      }
      nodes.push(node)
      nodeMap.set(name, node)
      y += h + style.nodeSpacing
    }
  }

  const outCursor = new Map<string, number>()
  const inCursor = new Map<string, number>()
  for (const node of nodes) {
    outCursor.set(node.id, node.y)
    inCursor.set(node.id, node.y)
  }

  const links: LaidLink[] = flows.map((flow) => {
    const source = nodeMap.get(flow.source)
    const target = nodeMap.get(flow.target)
    if (!source || !target) {
      return { id: flow.id, source: flow.source, target: flow.target, value: flow.value, path: "" }
    }

    const thickness = Math.max(2, flow.value * pxPerUnit)
    const y0 = (outCursor.get(source.id) ?? source.y) + thickness / 2
    const y1 = (inCursor.get(target.id) ?? target.y) + thickness / 2
    outCursor.set(source.id, (outCursor.get(source.id) ?? source.y) + thickness)
    inCursor.set(target.id, (inCursor.get(target.id) ?? target.y) + thickness)

    return {
      id: flow.id,
      source: flow.source,
      target: flow.target,
      value: flow.value,
      path: ribbonPath(source.x + source.width, y0, target.x, y1, thickness),
    }
  })

  return { nodes, links, width, height }
}

export function formatValue(value: number): string {
  if (value >= 1000) {
    return Number(value.toFixed(1)).toLocaleString("en-AU", { maximumFractionDigits: 1 })
  }
  return Number(value.toFixed(2)).toLocaleString("en-AU", { maximumFractionDigits: 2 })
}
