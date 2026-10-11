"use client"

import { ToolStage } from "@/components/stage/ToolStage"
import { CustomizePanel } from "@/components/sankey/CustomizePanel"
import { DataTable, NodeColorTable } from "@/components/sankey/DataTable"
import { ExampleCards } from "@/components/sankey/ExampleCards"
import { FlowEditor } from "@/components/sankey/FlowEditor"
import { SankeySvg } from "@/components/sankey/SankeySvg"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataLead } from "@/components/viz/data-entry"
import { defaultExample, sankeyExamples, type SankeyExample } from "@/lib/sankey/examples"
import { downloadBlob, downloadText, serializeSvg, svgToPngBlob } from "@/lib/sankey/export"
import { layoutSankey } from "@/lib/sankey/layout"
import { parsePastedTable, validFlows } from "@/lib/sankey/parse"
import {
  defaultStyle,
  newRow,
  type NodeOffset,
  type SankeyRow,
  type StyleSettings,
} from "@/lib/sankey/types"
import { stageSurfaces, vizThemes } from "@/lib/viz/themes"
import { ChevronDown, RotateCcw } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

function nodePalette(source: SankeyRow[], series: string[]) {
  const names: string[] = []
  for (const row of source) {
    if (row.source && !names.includes(row.source)) names.push(row.source)
    if (row.target && !names.includes(row.target)) names.push(row.target)
  }
  return Object.fromEntries(names.map((name, index) => [name, series[index % series.length]]))
}

export function SankeyGenerator({ title = "Sankey Diagram Generator" }: { title?: string }) {
  const [rows, setRows] = useState<SankeyRow[]>(() => defaultExample.rows.map((row) => ({ ...row, id: newRow().id })))
  const [style, setStyle] = useState<StyleSettings>(defaultStyle)
  const [offsets, setOffsets] = useState<Record<string, NodeOffset>>({})
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [selectedLink, setSelectedLink] = useState<string | null>(null)
  const [editor, setEditor] = useState<{ kind: "node" | "link"; id: string; x: number; y: number } | null>(null)
  const [nodeColors, setNodeColors] = useState<Record<string, string>>(() =>
    nodePalette(defaultExample.rows, vizThemes[defaultStyle.theme].series)
  )
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [frame, setFrame] = useState({ width: 720, height: 380 })

  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{
    id: string
    startX: number
    startY: number
    origin: NodeOffset
    moved: boolean
  } | null>(null)

  const flows = useMemo(() => validFlows(rows), [rows])
  const nodeNames = useMemo(() => {
    const names: string[] = []
    for (const flow of flows) {
      if (!names.includes(flow.source)) names.push(flow.source)
      if (!names.includes(flow.target)) names.push(flow.target)
    }
    return names
  }, [flows])
  const layout = useMemo(
    () => layoutSankey(flows, style, offsets, frame),
    [flows, style, offsets, frame]
  )

  useEffect(() => {
    setNodeColors((current) => {
      const series = vizThemes[style.theme].series
      let changed = false
      const next = { ...current }
      nodeNames.forEach((name, index) => {
        if (!next[name]) {
          next[name] = series[index % series.length]
          changed = true
        }
      })
      return changed ? next : current
    })
  }, [nodeNames, style.theme])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    const update = () => {
      setFrame({
        width: Math.max(320, el.clientWidth),
        height: Math.min(380, Math.max(260, el.clientHeight)),
      })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function updateRow(id: string, key: keyof Pick<SankeyRow, "source" | "target" | "value">, value: string) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)))
  }

  function loadExample(example: SankeyExample) {
    const next = example.rows.map((row) => ({ ...row, id: newRow().id }))
    setRows(next)
    setOffsets({})
    setSelectedNode(null)
    setSelectedLink(null)
    setNodeColors(nodePalette(next, vizThemes[style.theme].series))
    setEditor(null)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  function resetAll() {
    loadExample(defaultExample)
    setStyle(defaultStyle)
    setNodeColors(nodePalette(defaultExample.rows, vizThemes[defaultStyle.theme].series))
  }

  function onPaste(event: React.ClipboardEvent) {
    const text = event.clipboardData.getData("text/plain")
    if (!text.includes("\t") && !text.includes("\n")) return
    const parsed = parsePastedTable(text)
    if (parsed.length === 0) return
    event.preventDefault()
    setRows(parsed)
    setOffsets({})
  }

  function renameNode(from: string, to: string) {
    if (from === to) return
    setRows((current) =>
      current.map((row) => ({
        ...row,
        source: row.source === from ? to : row.source,
        target: row.target === from ? to : row.target,
      }))
    )
    setNodeColors((current) => {
      if (!(from in current)) return current
      const next = { ...current, [to]: current[from] }
      delete next[from]
      return next
    })
    setOffsets((current) => {
      if (!(from in current)) return current
      const next = { ...current, [to]: current[from] }
      delete next[from]
      return next
    })
    setSelectedNode(to)
    setEditor((current) => (current?.kind === "node" && current.id === from ? { ...current, id: to } : current))
  }

  function addTarget(source: string) {
    const row = { ...newRow(), source, target: "", value: "" }
    setRows((current) => [...current, row])
    if (editor?.kind === "link") {
      setSelectedLink(row.id)
      setEditor({ kind: "link", id: row.id, x: editor.x, y: editor.y })
    }
  }

  function deleteFlow(id: string) {
    setRows((current) => (current.length === 1 ? [newRow()] : current.filter((row) => row.id !== id)))
    setSelectedLink((current) => (current === id ? null : current))
    setEditor((current) => (current?.kind === "link" && current.id === id ? null : current))
  }

  function duplicateFlow(id: string) {
    setRows((current) => {
      const index = current.findIndex((row) => row.id === id)
      if (index === -1) return current
      const copy = { ...current[index], id: newRow().id }
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]
    })
  }

  function onNodePointerDown(id: string, event: React.PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    setSelectedNode(id)
    setSelectedLink(null)
    setEditor(null)
    const origin = offsets[id] ?? { x: 0, y: 0 }
    dragRef.current = { id, startX: event.clientX, startY: event.clientY, origin, moved: false }
  }

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const drag = dragRef.current
      if (!drag) return
      const dx = event.clientX - drag.startX
      const dy = event.clientY - drag.startY
      if (!drag.moved && Math.hypot(dx, dy) < 4) return
      drag.moved = true
      setOffsets((current) => ({
        ...current,
        [drag.id]: {
          x: style.autoLayout ? 0 : drag.origin.x + dx / zoom,
          y: drag.origin.y + dy / zoom,
        },
      }))
    }

    function onUp(event: PointerEvent) {
      const drag = dragRef.current
      dragRef.current = null
      if (!drag || drag.moved) return
      setSelectedNode(drag.id)
      setSelectedLink(null)
      setEditor({ kind: "node", id: drag.id, x: event.clientX, y: event.clientY })
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [style.autoLayout, zoom])

  async function exportPng() {
    if (!svgRef.current) return
    const blob = await svgToPngBlob(svgRef.current, 2)
    downloadBlob("sankey-diagram.png", blob)
  }

  function exportSvg() {
    if (!svgRef.current) return
    downloadText("sankey-diagram.svg", serializeSvg(svgRef.current), "image/svg+xml")
  }

  async function copyDiagram() {
    if (!svgRef.current) return
    const blob = await svgToPngBlob(svgRef.current, 2)
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
      downloadBlob("sankey-diagram.png", blob)
      return
    }
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
  }

  const dataPanel = (
    <div className="flex flex-col gap-3" onPaste={onPaste}>
      <DataLead hint="Each row is where a flow starts, where it goes, and how much moves. You can paste a table from a spreadsheet.">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">Templates</p>
        <div className="flex flex-wrap gap-1.5">
          {sankeyExamples.map((example) => (
            <button
              key={example.id}
              type="button"
              title={example.description}
              onClick={() => loadExample(example)}
              className="h-8 rounded-lg bg-[var(--nb-accent)] px-2.5 text-[13px] font-medium text-[var(--nb-primary)] transition-colors hover:bg-[var(--nb-primary)] hover:text-white"
            >
              {example.title}
            </button>
          ))}
        </div>
        </div>
      </DataLead>
      <Button
        type="button"
        variant="ghost"
        className="h-8 w-fit"
        onClick={() => {
          setRows([newRow(), newRow(), newRow()])
          setOffsets({})
          setNodeColors({})
        }}
      >
        Clear
      </Button>
        <DataTable
          rows={rows}
          onChange={updateRow}
          onAdd={() => setRows((current) => [...current, newRow()])}
          onDelete={deleteFlow}
          onDuplicate={duplicateFlow}
        />
    </div>
  )

  const stylePanel = (
    <div className="flex flex-col gap-4">
      <CustomizePanel
        style={style}
        onChange={(next) => {
          setStyle((current) => ({ ...current, ...next }))
          if (next.theme) setNodeColors(nodePalette(rows, vizThemes[next.theme].series))
        }}
      />
      <NodeColorTable
        nodes={nodeNames}
        colors={nodeColors}
        fallback={style.nodeColor}
        onChange={(name, color) => setNodeColors((current) => ({ ...current, [name]: color }))}
      />
    </div>
  )

  const empty = flows.length === 0
  const totalFlow = flows.reduce((sum, flow) => sum + flow.value, 0)
  const stats = empty
    ? []
    : [
        { label: "Total flow", value: totalFlow.toLocaleString("en-AU") },
        { label: "Nodes", value: String(nodeNames.length) },
        { label: "Links", value: String(flows.length) },
      ]

  return (
    <ToolStage
      toolId="sankey-generator"
      dataOpen={false}
      title={title}
      stats={stats}
      left={dataPanel}
      right={stylePanel}
      view={{ zoom, setZoom, pan, setPan }}
      fill
      surface={{ background: stageSurfaces[style.stage].background, dot: stageSurfaces[style.stage].dot }}
      tools={[
        {
          id: "reset-layout",
          label: "Reset layout",
          icon: <RotateCcw />,
          onClick: () => {
            setOffsets({})
            setZoom(1)
            setPan({ x: 0, y: 0 })
          },
        },
      ]}
      actions={
        <>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="default" className="h-8" />}>
              Export
              <ChevronDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportPng}>PNG</DropdownMenuItem>
              <DropdownMenuItem onClick={exportSvg}>SVG</DropdownMenuItem>
              <DropdownMenuItem onClick={copyDiagram}>Copy image</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" variant="ghost" className="h-8" onClick={resetAll}>
            Reset
          </Button>
        </>
      }
    >
      <div ref={canvasRef} className="relative h-full w-full">
        {empty ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="w-full max-w-xl">
              <p className="mb-4 text-[13px] text-[var(--nb-secondary)]">
                Load an example to see a diagram, or type flows on the left.
              </p>
              <ExampleCards onLoad={loadExample} />
            </div>
          </div>
        ) : (
          <SankeySvg
            layout={layout}
            style={style}
            selectedNode={selectedNode}
            selectedLink={selectedLink}
            hoveredLink={hoveredLink}
            nodeColors={nodeColors}
            zoom={zoom}
            pan={pan}
            onSelectNode={(id) => {
              setSelectedNode(id)
              if (!id) setEditor(null)
            }}
            onSelectLink={(id, point) => {
              setSelectedLink(id)
              setSelectedNode(null)
              if (id && point) setEditor({ kind: "link", id, x: point.clientX, y: point.clientY })
              else setEditor(null)
            }}
            onHoverLink={setHoveredLink}
            onNodePointerDown={onNodePointerDown}
            svgRef={svgRef}
          />
        )}
      </div>
      {editor ? (
        <FlowEditor
          title={editor.kind === "node" ? editor.id || "Node" : "Flow"}
          x={editor.x}
          y={editor.y}
          source={editor.kind === "node" ? editor.id : (rows.find((row) => row.id === editor.id)?.source ?? "")}
          onSource={(value) => {
            if (editor.kind === "node") renameNode(editor.id, value)
            else updateRow(editor.id, "source", value)
          }}
          targets={
            editor.kind === "node"
              ? rows.filter((row) => row.source === editor.id).map((row) => ({ id: row.id, target: row.target, value: row.value }))
              : rows.filter((row) => row.id === editor.id).map((row) => ({ id: row.id, target: row.target, value: row.value }))
          }
          onTarget={(id, value) => updateRow(id, "target", value)}
          onValue={(id, value) => updateRow(id, "value", value)}
          onDelete={deleteFlow}
          onDuplicate={duplicateFlow}
          onAddTarget={() => addTarget(editor.kind === "node" ? editor.id : (rows.find((row) => row.id === editor.id)?.source ?? ""))}
          color={editor.kind === "node" ? (nodeColors[editor.id] ?? style.nodeColor) : undefined}
          recent={[...new Set(nodeNames.map((name) => nodeColors[name] ?? style.nodeColor))]}
          onColor={
            editor.kind === "node"
              ? (color) => setNodeColors((current) => ({ ...current, [editor.id]: color }))
              : undefined
          }
          onClose={() => setEditor(null)}
        />
      ) : null}
    </ToolStage>
  )
}
