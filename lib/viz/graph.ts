import { graphEdge, graphNode, type GraphEdge, type GraphModel, type GraphNode } from "./examples"

export type LaidNode = GraphNode & { width: number; height: number }
export type LaidEdge = GraphEdge & { points: { x: number; y: number }[] }

const nodeSize: Record<GraphNode["type"], { width: number; height: number }> = {
  start: { width: 140, height: 48 },
  end: { width: 140, height: 48 },
  process: { width: 160, height: 56 },
  decision: { width: 150, height: 88 },
}

export function layoutGraph(model: GraphModel, orientation: "tb" | "lr"): {
  nodes: LaidNode[]
  edges: LaidEdge[]
  width: number
  height: number
} {
  const incoming = new Map<string, number>()
  for (const node of model.nodes) incoming.set(node.id, 0)
  for (const edge of model.edges) incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1)

  const layers: string[][] = []
  const remaining = new Set(model.nodes.map((node) => node.id))
  let frontier = model.nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0).map((node) => node.id)
  if (frontier.length === 0 && model.nodes[0]) frontier = [model.nodes[0].id]

  while (remaining.size > 0 && layers.length < 24) {
    const layer = frontier.filter((id) => remaining.has(id))
    const use = layer.length > 0 ? layer : [remaining.values().next().value as string]
    layers.push(use)
    for (const id of use) remaining.delete(id)
    const next: string[] = []
    for (const edge of model.edges) {
      if (use.includes(edge.from) && remaining.has(edge.to) && !next.includes(edge.to)) next.push(edge.to)
    }
    frontier = next
  }

  const gapX = orientation === "tb" ? 48 : 96
  const gapY = orientation === "tb" ? 96 : 36
  const byId = new Map(model.nodes.map((node) => [node.id, node]))
  const placed: LaidNode[] = []

  layers.forEach((layer, layerIndex) => {
    layer.forEach((id, index) => {
      const node = byId.get(id)
      if (!node) return
      const size = nodeSize[node.type]
      const custom = node.x !== 0 || node.y !== 0
      const x =
        orientation === "tb"
          ? 40 + index * (size.width + gapX)
          : 40 + layerIndex * (size.width + gapX)
      const y =
        orientation === "tb"
          ? 36 + layerIndex * (size.height + gapY)
          : 36 + index * (size.height + gapY)
      placed.push({
        ...node,
        width: size.width,
        height: size.height,
        x: custom ? node.x : x,
        y: custom ? node.y : y,
      })
    })
  })

  const placedById = new Map(placed.map((node) => [node.id, node]))
  const edges: LaidEdge[] = model.edges.flatMap((edge) => {
    const from = placedById.get(edge.from)
    const to = placedById.get(edge.to)
    if (!from || !to) return []
    const a = anchor(from, to)
    const b = anchor(to, from)
    return [{ ...edge, points: [a, b] }]
  })

  const width = Math.max(480, ...placed.map((node) => node.x + node.width + 48))
  const height = Math.max(320, ...placed.map((node) => node.y + node.height + 48))
  return { nodes: placed, edges, width, height }
}

function anchor(from: LaidNode, toward: LaidNode): { x: number; y: number } {
  const cx = from.x + from.width / 2
  const cy = from.y + from.height / 2
  const tx = toward.x + toward.width / 2
  const ty = toward.y + toward.height / 2
  const dx = tx - cx
  const dy = ty - cy
  if (Math.abs(dx) > Math.abs(dy)) {
    return { x: dx > 0 ? from.x + from.width : from.x, y: cy }
  }
  return { x: cx, y: dy > 0 ? from.y + from.height : from.y }
}

export function parseLinkSyntax(text: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = []
  const edges: { from: string; to: string; label: string }[] = []
  const ensure = (label: string) => {
    const existing = nodes.find((node) => node.label === label)
    if (existing) return existing.id
    const node = graphNode(label, "process")
    nodes.push(node)
    return node.id
  }
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const match = trimmed.match(/^(.*?)\s*(->|→)\s*(.*?)(?:\s*[|:]\s*(.*))?$/)
    if (!match) {
      ensure(trimmed)
      continue
    }
    const from = ensure(match[1].trim())
    const to = ensure(match[3].trim())
    edges.push({ from, to, label: (match[4] ?? "").trim() })
  }
  return {
    nodes,
    edges: edges.map((edge) => graphEdge(edge.from, edge.to, edge.label)),
  }
}
