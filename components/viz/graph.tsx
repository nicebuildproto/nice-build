"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChartFrame } from "@/components/viz/chart-frame"
import { Segmented } from "@/components/viz/fields"
import { VizCustomize } from "@/components/viz/customize"
import { EmptyViz, ExampleList, VizStudio } from "@/components/viz/studio"
import {
  diagramExamples,
  flowchartExamples,
  graphEdge,
  graphNode,
  type GraphModel,
  type GraphNodeType,
} from "@/lib/viz/examples"
import { layoutGraph, parseLinkSyntax } from "@/lib/viz/graph"
import { vizId } from "@/lib/viz/id"
import { rowsToCsv } from "@/lib/viz/parse"
import { defaultVizStyle, emptyMeta, resolveTheme, type VizMeta, type VizStyle } from "@/lib/viz/style"
import { Minus, Plus } from "lucide-react"
import { useMemo, useRef, useState } from "react"

export function FlowchartGenerator() {
  return <GraphTool kind="flow" />
}
export function DiagramGenerator() {
  return <GraphTool kind="diagram" />
}

function cloneGraph(model: GraphModel): GraphModel {
  const ids = new Map(model.nodes.map((node) => [node.id, vizId()]))
  return {
    nodes: model.nodes.map((node) => ({ ...node, id: ids.get(node.id) ?? vizId(), x: 0, y: 0 })),
    edges: model.edges.map((edge) => ({
      ...edge,
      id: vizId(),
      from: ids.get(edge.from) ?? edge.from,
      to: ids.get(edge.to) ?? edge.to,
    })),
  }
}

function GraphTool({ kind }: { kind: "flow" | "diagram" }) {
  const examples = kind === "flow" ? flowchartExamples : diagramExamples
  const first = examples[0]
  const svgRef = useRef<SVGSVGElement>(null)
  const [model, setModel] = useState<GraphModel>(() => cloneGraph(first.data))
  const [style, setStyle] = useState<VizStyle>(defaultVizStyle)
  const [meta, setMeta] = useState<VizMeta>({ ...emptyMeta, title: first.title })
  const [orientation, setOrientation] = useState<"tb" | "lr">("tb")
  const [selected, setSelected] = useState<string | null>(null)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [syntax, setSyntax] = useState("")
  const [zoom, setZoom] = useState(1)
  const drag = useRef<{ id: string; x: number; y: number; ox: number; oy: number } | null>(null)
  const theme = resolveTheme(style)
  const layout = useMemo(() => layoutGraph(model, orientation), [model, orientation])

  function load(next: GraphModel, title: string) {
    setModel(cloneGraph(next))
    setMeta((current) => ({ ...current, title }))
    setSelected(null)
    setConnectFrom(null)
  }

  function addNode(type: GraphNodeType) {
    const node = graphNode(type === "decision" ? "Decision" : type === "start" ? "Start" : type === "end" ? "End" : "Step", type)
    setModel((current) => ({ ...current, nodes: [...current.nodes, node] }))
    setSelected(node.id)
  }

  function updateNode(id: string, label: string) {
    setModel((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (node.id === id ? { ...node, label } : node)),
    }))
  }

  function removeNode(id: string) {
    setModel((current) => ({
      nodes: current.nodes.filter((node) => node.id !== id),
      edges: current.edges.filter((edge) => edge.from !== id && edge.to !== id),
    }))
    if (selected === id) setSelected(null)
  }

  function connect(from: string, to: string, label = "") {
    if (from === to) return
    setModel((current) => ({
      ...current,
      edges: [...current.edges, graphEdge(from, to, label)],
    }))
  }

  const csv = rowsToCsv(
    ["From", "To", "Label"],
    model.edges.map((edge) => {
      const from = model.nodes.find((node) => node.id === edge.from)?.label ?? ""
      const to = model.nodes.find((node) => node.id === edge.to)?.label ?? ""
      return [from, to, edge.label]
    })
  )
  const empty = model.nodes.length === 0
  const selectedNode = model.nodes.find((node) => node.id === selected)

  const data = (
    <div className="flex flex-col gap-4">
      <ExampleList examples={examples} onLoad={load} />
      <div className="flex flex-wrap gap-1.5">
        {(kind === "flow"
          ? (["process", "decision", "start", "end"] as const)
          : (["process"] as const)
        ).map((type) => (
          <Button key={type} type="button" size="xs" variant="outline" onClick={() => addNode(type)}>
            Add {type}
          </Button>
        ))}
      </div>
      <ul className="flex flex-col gap-2">
        {model.nodes.map((node) => (
          <li key={node.id} className="flex gap-2">
            <Input
              value={node.label}
              aria-label="Node label"
              onChange={(event) => updateNode(node.id, event.target.value)}
              onFocus={() => setSelected(node.id)}
              className="h-9"
            />
            <Button type="button" variant="ghost" size="xs" onClick={() => setConnectFrom(node.id)}>
              Connect
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" aria-label={`Delete ${node.label}`} onClick={() => removeNode(node.id)}>
              ×
            </Button>
          </li>
        ))}
      </ul>
      {connectFrom ? (
        <div className="rounded-xl bg-[var(--nb-accent)] p-3 text-[13px]">
          <p className="mb-2 text-[var(--nb-secondary)]">Connect from {model.nodes.find((node) => node.id === connectFrom)?.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {model.nodes
              .filter((node) => node.id !== connectFrom)
              .map((node) => (
                <Button
                  key={node.id}
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => {
                    const fromNode = model.nodes.find((item) => item.id === connectFrom)
                    const label = fromNode?.type === "decision" ? (model.edges.some((edge) => edge.from === connectFrom) ? "No" : "Yes") : ""
                    connect(connectFrom, node.id, label)
                    setConnectFrom(null)
                  }}
                >
                  {node.label}
                </Button>
              ))}
            <Button type="button" size="xs" variant="ghost" onClick={() => setConnectFrom(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium">Advanced: paste links</span>
        <textarea
          value={syntax}
          rows={3}
          onChange={(event) => setSyntax(event.target.value)}
          placeholder="Brief -> Design"
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="w-fit"
          onClick={() => {
            const parsed = parseLinkSyntax(syntax)
            if (parsed.nodes.length) setModel(parsed)
          }}
        >
          Apply links
        </Button>
      </label>
      <Button type="button" variant="ghost" size="xs" onClick={() => setModel({ nodes: [], edges: [] })}>
        Clear
      </Button>
      <p className="text-[12px] text-[var(--nb-secondary)]">
        Add a step, then Connect to branch. Drag a box on the canvas. Layout is automatic until you drag.
      </p>
    </div>
  )

  const canvas = empty ? (
    <EmptyViz onExample={() => load(first.data, first.title)} onManual={() => addNode("process")} />
  ) : (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button type="button" size="icon-xs" variant="outline" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}>
          <Minus />
        </Button>
        <Button type="button" size="icon-xs" variant="outline" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(2, value + 0.1))}>
          <Plus />
        </Button>
        <Button type="button" size="xs" variant="outline" onClick={() => {
          setModel((current) => ({ ...current, nodes: current.nodes.map((node) => ({ ...node, x: 0, y: 0 })) }))
          setZoom(1)
        }}>
          Fit
        </Button>
      </div>
      <div className="overflow-auto">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}>
          <ChartFrame
            ref={svgRef}
            width={layout.width}
            height={layout.height}
            theme={theme}
            meta={meta}
            description={kind === "flow" ? "Flowchart" : "Diagram"}
          >
            <defs>
              <marker id="viz-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={theme.ink} />
              </marker>
            </defs>
            {layout.edges.map((edge) => {
              const [a, b] = edge.points
              const mx = (a.x + b.x) / 2
              const my = (a.y + b.y) / 2
              return (
                <g key={edge.id}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={theme.ink}
                    strokeWidth={1.5}
                    markerEnd="url(#viz-arrow)"
                  />
                  {edge.label ? (
                    <text x={mx} y={my - 6} textAnchor="middle" fill={theme.muted} fontSize={11}>
                      {edge.label}
                    </text>
                  ) : null}
                </g>
              )
            })}
            {layout.nodes.map((node) => {
              const active = selected === node.id
              const onDown = (event: React.PointerEvent) => {
                event.stopPropagation()
                setSelected(node.id)
                drag.current = { id: node.id, x: event.clientX, y: event.clientY, ox: node.x, oy: node.y }
                event.currentTarget.setPointerCapture(event.pointerId)
              }
              const onMove = (event: React.PointerEvent) => {
                const activeDrag = drag.current
                if (!activeDrag || activeDrag.id !== node.id) return
                const dx = (event.clientX - activeDrag.x) / zoom
                const dy = (event.clientY - activeDrag.y) / zoom
                setModel((current) => ({
                  ...current,
                  nodes: current.nodes.map((item) =>
                    item.id === node.id ? { ...item, x: activeDrag.ox + dx, y: activeDrag.oy + dy } : item
                  ),
                }))
              }
              const shape =
                node.type === "decision" ? (
                  <polygon
                    points={`${node.x + node.width / 2},${node.y} ${node.x + node.width},${node.y + node.height / 2} ${node.x + node.width / 2},${node.y + node.height} ${node.x},${node.y + node.height / 2}`}
                    fill={theme.background}
                    stroke={theme.ink}
                    strokeWidth={active ? 2.25 : 1.5}
                  />
                ) : (
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    rx={node.type === "process" ? 10 : 24}
                    fill={theme.background}
                    stroke={theme.ink}
                    strokeWidth={active ? 2.25 : 1.5}
                  />
                )
              return (
                <g
                  key={node.id}
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={() => {
                    drag.current = null
                  }}
                  style={{ cursor: "grab" }}
                >
                  {shape}
                  <text
                    x={node.x + node.width / 2}
                    y={node.y + node.height / 2 + 4}
                    textAnchor="middle"
                    fill={theme.ink}
                    fontSize={style.labelSize}
                    fontWeight={style.labelWeight}
                  >
                    {node.label}
                  </text>
                </g>
              )
            })}
          </ChartFrame>
        </div>
      </div>
      {selectedNode ? (
        <p className="mt-2 text-[12px] text-[var(--nb-secondary)]">Selected: {selectedNode.label}. Drag to place, or connect it from the data panel.</p>
      ) : null}
    </div>
  )

  return (
    <VizStudio
      filename={kind === "flow" ? "flowchart" : "diagram"}
      csv={csv}
      svgRef={svgRef}
      data={data}
      canvas={canvas}
      customize={
        <VizCustomize
          style={style}
          meta={meta}
          onStyle={(next) => setStyle((current) => ({ ...current, ...next }))}
          onMeta={(next) => setMeta((current) => ({ ...current, ...next }))}
          omit={["values", "percent", "grid", "legend"]}
          extra={
            <Segmented
              label="Orientation"
              value={orientation}
              options={[
                { id: "tb", label: "Top–bottom" },
                { id: "lr", label: "Left–right" },
              ]}
              onChange={(value) => {
                setOrientation(value)
                setModel((current) => ({ ...current, nodes: current.nodes.map((node) => ({ ...node, x: 0, y: 0 })) }))
              }}
            />
          }
        />
      }
    />
  )
}
