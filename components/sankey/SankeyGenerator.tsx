"use client"

import { BrandLink } from "@/components/BrandLink"
import { HeaderActions } from "@/components/site/HeaderActions"
import { CustomizePanel } from "@/components/sankey/CustomizePanel"
import { DataTable, NodeColorTable } from "@/components/sankey/DataTable"
import { ExampleCards } from "@/components/sankey/ExampleCards"
import { SankeySvg } from "@/components/sankey/SankeySvg"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { defaultExample, type SankeyExample } from "@/lib/sankey/examples"
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
import { ChevronDown, Minus, Plus, RotateCcw, SlidersHorizontal, Table2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

export function SankeyGenerator() {
  const [rows, setRows] = useState<SankeyRow[]>(() => defaultExample.rows.map((row) => ({ ...row, id: newRow().id })))
  const [style, setStyle] = useState<StyleSettings>(defaultStyle)
  const [offsets, setOffsets] = useState<Record<string, NodeOffset>>({})
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [selectedLink, setSelectedLink] = useState<string | null>(null)
  const [nodeColors, setNodeColors] = useState<Record<string, string>>({})
  const [flowColors, setFlowColors] = useState<Record<string, string>>({})
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [frame, setFrame] = useState({ width: 720, height: 480 })
  const [dataOpen, setDataOpen] = useState(false)
  const [styleOpen, setStyleOpen] = useState(false)
  const [examplesOpen, setExamplesOpen] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{
    id: string
    startX: number
    startY: number
    origin: NodeOffset
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
    const el = canvasRef.current
    if (!el) return

    const update = () => {
      setFrame({
        width: Math.max(320, el.clientWidth),
        height: Math.max(240, el.clientHeight),
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
    setRows(example.rows.map((row) => ({ ...row, id: newRow().id })))
    setOffsets({})
    setSelectedNode(null)
    setSelectedLink(null)
    setNodeColors({})
    setFlowColors({})
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setExamplesOpen(false)
    setDataOpen(false)
  }

  function resetAll() {
    loadExample(defaultExample)
    setStyle(defaultStyle)
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

  function onNodePointerDown(id: string, event: React.PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    setSelectedNode(id)
    setSelectedLink(null)
    const origin = offsets[id] ?? { x: 0, y: 0 }
    dragRef.current = { id, startX: event.clientX, startY: event.clientY, origin }
  }

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const drag = dragRef.current
      if (!drag) return
      const dx = (event.clientX - drag.startX) / zoom
      const dy = (event.clientY - drag.startY) / zoom
      setOffsets((current) => ({
        ...current,
        [drag.id]: {
          x: style.autoLayout ? 0 : drag.origin.x + dx,
          y: drag.origin.y + dy,
        },
      }))
    }

    function onUp() {
      dragRef.current = null
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
          Data
        </h2>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="xs" onClick={() => setExamplesOpen((open) => !open)}>
            Examples
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              setRows([newRow(), newRow(), newRow()])
              setOffsets({})
            }}
          >
            Clear
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1" onPaste={onPaste}>
        {examplesOpen ? (
          <div className="mb-6">
            <ExampleCards onLoad={loadExample} />
          </div>
        ) : null}
        <DataTable
          rows={rows}
          flowColors={flowColors}
          defaultFlowColor={style.flowColor}
          onChange={updateRow}
          onFlowColor={(id, color) => setFlowColors((current) => ({ ...current, [id]: color }))}
          onAdd={() => setRows((current) => [...current, newRow()])}
          onDelete={(id) =>
            setRows((current) => (current.length === 1 ? [newRow()] : current.filter((row) => row.id !== id)))
          }
          onDuplicate={(id) =>
            setRows((current) => {
              const index = current.findIndex((row) => row.id === id)
              if (index === -1) return current
              const copy = { ...current[index], id: newRow().id }
              return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]
            })
          }
        />
        <NodeColorTable
          nodes={nodeNames}
          colors={nodeColors}
          fallback={style.nodeColor}
          onChange={(name, color) => setNodeColors((current) => ({ ...current, [name]: color }))}
        />
        <p className="mt-4 text-[12px] leading-relaxed text-[var(--nb-secondary)]">
          Paste from Excel or Sheets. Each row is source, target, value.
        </p>
      </div>
    </div>
  )

  const stylePanel = (
    <div className="flex h-full min-h-0 flex-col">
      <h2 className="mb-5 text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
        Customize
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <CustomizePanel style={style} onChange={(next) => setStyle((current) => ({ ...current, ...next }))} />
      </div>
    </div>
  )

  const empty = flows.length === 0

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-background text-[var(--nb-primary)]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <BrandLink logoClassName="h-6" />
          <div className="min-w-0">
            <h1 className="text-[15px] font-medium tracking-[-0.01em]">Sankey Diagram Generator</h1>
            <p className="hidden text-[13px] text-[var(--nb-secondary)] sm:block">
              Visualize how quantities flow from one stage to another.
            </p>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          <Button type="button" variant="ghost" size="sm" onClick={() => setStyleOpen(true)}>
            <SlidersHorizontal />
            Customize
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={resetAll}>
            Reset
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="default" size="sm" />}
            >
              Export
              <ChevronDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportPng}>PNG</DropdownMenuItem>
              <DropdownMenuItem onClick={exportSvg}>SVG</DropdownMenuItem>
              <DropdownMenuItem onClick={copyDiagram}>Copy image</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span aria-hidden className="mx-1 hidden h-4 w-px bg-border sm:block" />
          <HeaderActions />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(440px,1.05fr)_minmax(0,1fr)]">
        <aside className="hidden min-h-0 border-r border-black/[0.06] p-4 md:flex">{dataPanel}</aside>

        <section className="relative flex min-h-0 flex-col">
          <div ref={canvasRef} className="relative min-h-0 flex-1">
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
                flowColors={flowColors}
                zoom={zoom}
                pan={pan}
                onSelectNode={setSelectedNode}
                onSelectLink={setSelectedLink}
                onHoverLink={setHoveredLink}
                onNodePointerDown={onNodePointerDown}
                svgRef={svgRef}
              />
            )}
          </div>

          <div className="pointer-events-none absolute right-4 bottom-4 left-4 flex items-end justify-between gap-3">
            <div className="pointer-events-auto flex gap-2">
              <Button type="button" variant="outline" size="sm" className="md:hidden" onClick={() => setDataOpen(true)}>
                <Table2 />
                Data
              </Button>
            </div>
            <div className="pointer-events-auto ml-auto flex items-center gap-1 rounded-lg border border-black/[0.06] bg-white/90 p-1 backdrop-blur-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Zoom out"
                onClick={() => setZoom((current) => Math.max(0.5, Number((current - 0.1).toFixed(2))))}
              >
                <Minus />
              </Button>
              <span className="min-w-10 text-center text-[12px] text-[var(--nb-secondary)] tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Zoom in"
                onClick={() => setZoom((current) => Math.min(2.4, Number((current + 0.1).toFixed(2))))}
              >
                <Plus />
              </Button>
              <Button type="button" variant="ghost" size="xs" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}>
                Fit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Reset layout"
                onClick={() => {
                  setOffsets({})
                  setZoom(1)
                  setPan({ x: 0, y: 0 })
                }}
              >
                <RotateCcw />
              </Button>
            </div>
          </div>
        </section>

      </div>

      <Sheet open={dataOpen} onOpenChange={setDataOpen}>
        <SheetContent side="left" className="w-full max-w-xl p-5">
          <SheetHeader className="p-0 pb-4">
            <SheetTitle>Data</SheetTitle>
          </SheetHeader>
          {dataPanel}
        </SheetContent>
      </Sheet>

      <Sheet open={styleOpen} onOpenChange={setStyleOpen}>
        <SheetContent side="right" className="w-full max-w-md p-5">
          <SheetHeader className="p-0 pb-4">
            <SheetTitle>Customize</SheetTitle>
          </SheetHeader>
          {stylePanel}
        </SheetContent>
      </Sheet>
    </div>
  )
}
