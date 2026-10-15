import { formatNodeNumber, sankeyTotal, settingsFor } from "@/lib/sankey/format"
import { wrapNote } from "@/lib/sankey/notes"
import type {
  LaidLink,
  LaidNode,
  NodeOffset,
  NodeSettings,
  SankeyLayout,
  StyleSettings,
  ValidFlow,
} from "@/lib/sankey/types"

export { formatValue } from "@/lib/sankey/format"

const PAD_X = 88
const PAD_Y = 28
const NOTE_PAD_X = 168
const NOTE_WIDTH = 150
const NOTE_SCALE = 0.85
const LABEL_GAP = 6

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
  frame: { width: number; height: number },
  nodeSettings: Record<string, NodeSettings> = {}
): SankeyLayout {
  const width = Math.max(320, frame.width)
  let height = Math.max(220, frame.height)
  const names = uniqueNames(flows)

  if (names.length === 0) {
    return { nodes: [], links: [], width, height }
  }

  const layers = assignLayers(flows, names)
  const maxLayer = Math.max(...[...layers.values()])
  const columns = maxLayer + 1

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

  // Label content: number in the chosen format, and the wrapped note.
  const total = sankeyTotal(
    flows,
    names.map((name) => ({ id: name, value: values.get(name) ?? 0 }))
  )
  const labelLine = Math.max(style.labelSize, style.valueSize) * 1.25
  const noteSize = style.labelSize * NOTE_SCALE
  const noteLine = noteSize * 1.3
  const notePad = Math.min(NOTE_PAD_X, Math.max(PAD_X, Math.round(width * 0.3)))
  const noteWidth = Math.min(NOTE_WIDTH, notePad - 14)
  const content = new Map<string, { numberText: string; note: string; noteLines: string[] }>()
  let hasNotes = false
  for (const name of names) {
    const settings = settingsFor(nodeSettings, name)
    const note = settings.note.trim()
    const noteLines = style.showLabels && note ? wrapNote(note, noteWidth, noteSize) : []
    if (noteLines.length > 0) hasNotes = true
    content.set(name, {
      numberText: style.showValues ? formatNodeNumber(values.get(name) ?? 0, total, settings.numberFormat) : "",
      note,
      noteLines,
    })
  }
  const blockHeight = (name: string) => labelLine + (content.get(name)?.noteLines.length ?? 0) * noteLine
  const outsideLabels = style.labelPosition === "outside"
  const firstHasNote = outsideLabels && (byLayer.get(0) ?? []).some((name) => (content.get(name)?.noteLines.length ?? 0) > 0)
  const lastHasNote =
    outsideLabels &&
    maxLayer > 0 &&
    (byLayer.get(maxLayer) ?? []).some((name) => (content.get(name)?.noteLines.length ?? 0) > 0)
  const padLeft = firstHasNote ? notePad : PAD_X
  const padRight = lastHasNote ? notePad : PAD_X
  const innerWidth = Math.max(hasNotes ? 120 : 0, width - padLeft - padRight - style.nodeWidth)
  const columnGap = columns > 1 ? innerWidth / maxLayer : 0

  let maxValueSum = 0
  let longest = 1
  for (const list of byLayer.values()) {
    const valueSum = list.reduce((sum, name) => sum + (values.get(name) ?? 0), 0)
    maxValueSum = Math.max(maxValueSum, valueSum)
    longest = Math.max(longest, list.length)
  }

  // Extra room a label block needs beyond its node, so notes never meet the next label.
  const extraRoom = (name: string, ppu: number) =>
    Math.max(0, blockHeight(name) - Math.max(style.minNodeHeight, (values.get(name) ?? 0) * ppu))
  const gapsFor = (list: string[], ppu: number) =>
    list.slice(1).map((name, index) =>
      hasNotes
        ? Math.max(style.nodeSpacing, extraRoom(list[index], ppu) / 2 + extraRoom(name, ppu) / 2 + LABEL_GAP)
        : style.nodeSpacing
    )

  let padY = PAD_Y
  if (hasNotes) {
    const biggest = Math.max(...names.map((name) => extraRoom(name, 0)))
    padY = Math.max(PAD_Y, Math.ceil(biggest / 2) + 8)
  }
  let usable = Math.max(80, height - padY * 2)
  const spacing = style.nodeSpacing * Math.max(0, longest - 1)
  let pxPerUnit = maxValueSum > 0 ? Math.max(40, usable - spacing) / maxValueSum : 1
  if (hasNotes && maxValueSum > 0) {
    for (let pass = 0; pass < 6; pass++) {
      let limit = Infinity
      for (const list of byLayer.values()) {
        const valueSum = list.reduce((sum, name) => sum + (values.get(name) ?? 0), 0)
        if (valueSum <= 0) continue
        const gapSum = gapsFor(list, pxPerUnit).reduce((sum, gap) => sum + gap, 0)
        limit = Math.min(limit, Math.max(40, usable - gapSum) / valueSum)
      }
      if (!Number.isFinite(limit)) break
      pxPerUnit = limit
    }
  }

  const heightOf = (name: string) => Math.max(style.minNodeHeight, (values.get(name) ?? 0) * pxPerUnit)
  const layerGaps = new Map<number, number[]>()
  const layerHeights = new Map<number, number>()
  for (const [layer, list] of byLayer) {
    const gaps = gapsFor(list, pxPerUnit)
    layerGaps.set(layer, gaps)
    layerHeights.set(
      layer,
      list.reduce((sum, name) => sum + (hasNotes ? heightOf(name) : (values.get(name) ?? 0) * pxPerUnit), 0) +
        gaps.reduce((sum, gap) => sum + gap, 0)
    )
  }
  if (hasNotes) {
    // If notes need more room than the frame offers, make the diagram taller so it still fits.
    const needed = Math.max(...layerHeights.values()) + padY * 2
    if (needed > height) {
      height = Math.ceil(needed)
      usable = Math.max(80, height - padY * 2)
    }
  }

  const nodes: LaidNode[] = []
  const nodeMap = new Map<string, LaidNode>()

  for (let layer = 0; layer <= maxLayer; layer++) {
    const list = byLayer.get(layer) ?? []
    const gaps = layerGaps.get(layer) ?? []
    const layerHeight = layerHeights.get(layer) ?? 0
    let y = padY + Math.max(0, (usable - layerHeight) / 2)

    list.forEach((name, index) => {
      const value = values.get(name) ?? 0
      const h = heightOf(name)
      const baseX = padLeft + layer * columnGap
      const offset = offsets[name] ?? { x: 0, y: 0 }
      const x = style.autoLayout ? baseX : baseX + offset.x
      const label = content.get(name)
      const node: LaidNode = {
        id: name,
        name,
        layer,
        value,
        numberText: label?.numberText ?? "",
        note: label?.note ?? "",
        noteLines: label?.noteLines ?? [],
        labelLine,
        noteSize,
        noteLine,
        x,
        y: y + offset.y,
        width: style.nodeWidth,
        height: h,
      }
      nodes.push(node)
      nodeMap.set(name, node)
      y += h + (gaps[index] ?? 0)
    })
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
