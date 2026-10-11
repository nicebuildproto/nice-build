"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChartFrame } from "@/components/viz/chart-frame"
import { MarkPopover, useMarks } from "@/components/viz/mark-editor"
import { VizCustomize } from "@/components/viz/customize"
import { badNumber, cellInput, DataError, DataLead } from "@/components/viz/data-entry"
import { EmptyViz, ExampleList, VizStudio } from "@/components/viz/studio"
import { cn } from "@/lib/utils"
import { waterfallExamples, waterfallRow, type WaterfallRow } from "@/lib/viz/examples"
import { vizId } from "@/lib/viz/id"
import { parseNumber, parseTable, rowsToCsv } from "@/lib/viz/parse"
import { formatValue, niceExtent, ticks as axisTicks } from "@/lib/viz/scale"
import { defaultVizStyle, emptyMeta, resolveTheme, type VizMeta, type VizStyle } from "@/lib/viz/style"
import { layoutWaterfall } from "@/lib/viz/waterfall"
import { ChevronDown, Plus, Trash2 } from "lucide-react"
import { useMemo, useRef, useState } from "react"

export function WaterfallChartGenerator({ title = "Waterfall Chart Generator" }: { title?: string }) {
  const first = waterfallExamples[0]
  const svgRef = useRef<SVGSVGElement>(null)
  const [rows, setRows] = useState<WaterfallRow[]>(() => first.data.map((row) => ({ ...row, id: vizId() })))
  const [style, setStyle] = useState<VizStyle>({ ...defaultVizStyle, showPercent: false, showLegend: false, legend: "none" })
  const [meta, setMeta] = useState<VizMeta>({ ...emptyMeta, title: first.title })
  const [hover, setHover] = useState<string | null>(null)
  const [fileNote, setFileNote] = useState<string | null>(null)
  const theme = resolveTheme(style)
  const marks = useMarks()

  const numeric = useMemo(
    () =>
      rows
        .map((row) => ({ ...row, n: parseNumber(row.value) }))
        .filter((row): row is WaterfallRow & { n: number } => row.n !== null && row.label.trim() !== ""),
    [rows],
  )
  const bars = useMemo(
    () => layoutWaterfall(numeric.map((row) => ({ label: row.label, value: row.n, kind: row.kind }))),
    [numeric],
  )
  const empty = bars.length === 0
  const values = bars.flatMap((bar) => [bar.start, bar.end])
  const extent = niceExtent(Math.min(0, ...values), Math.max(0, ...values), true)
  const width = 720
  const height = 400
  const pad = { l: 52, r: 24, t: 16, b: 56 }
  const plotW = width - pad.l - pad.r
  const plotH = height - pad.t - pad.b
  const yTicks = axisTicks(extent.min, extent.max)
  const y = (value: number) => pad.t + (1 - (value - extent.min) / (extent.max - extent.min || 1)) * plotH
  const gap = 12
  const barW = bars.length ? (plotW - gap * bars.length) / bars.length : 0

  function applyTable(text: string) {
    const table = parseTable(text)
    if (table.length < 2) return false
    const body = table[0][0]?.toLowerCase().includes("label") || table[0][0]?.toLowerCase().includes("category") ? table.slice(1) : table
    setRows(
      body.map((row) =>
        waterfallRow(row[0] ?? "", row[1] ?? "0", /total|sum|open|close/i.test(row[2] ?? "") ? "total" : "relative"),
      ),
    )
    setFileNote(null)
    return true
  }

  const csv = rowsToCsv(
    ["Category", "Value", "Type"],
    rows.map((row) => [row.label, row.value, row.kind]),
  )

  const invalidValue = rows.some((row) => badNumber(row.value))

  const data = (
    <div className="flex flex-col gap-4">
      <DataLead hint="Each row is a category, a number, and whether that number is a change or a total.">
        <ExampleList examples={waterfallExamples} onLoad={(data, title) => { setRows(data.map((row) => ({ ...row, id: vizId() }))); setMeta((current) => ({ ...current, title })) }} />
      </DataLead>
      <div className="overflow-visible rounded-lg border border-black/[0.08]">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[var(--nb-accent)] text-left text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">
              <th className="px-2 py-2">Category</th>
              <th className="px-2 py-2">Value</th>
              <th className="px-2 py-2">Type</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-black/[0.06]">
                <td className="p-0">
                  <Input value={row.label} aria-label="Category" onChange={(event) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, label: event.target.value } : item)))} className={cellInput} />
                </td>
                <td className="p-0">
                  <Input value={row.value} inputMode="decimal" aria-label="Value" aria-invalid={badNumber(row.value) || undefined} onChange={(event) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, value: event.target.value } : item)))} className={cn(cellInput, "tabular-nums", badNumber(row.value) && "text-red-600")} />
                </td>
                <td className="p-1">
                  <div className="relative min-w-[7.5rem]">
                    <select
                      aria-label="Type"
                      value={row.kind}
                      onChange={(event) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, kind: event.target.value as "relative" | "total" } : item)))}
                      className="h-8 w-full appearance-none rounded-lg border border-border bg-background px-2 pr-7 text-[13px] text-foreground"
                    >
                      <option value="relative">Change</option>
                      <option value="total">Total</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-[var(--nb-secondary)]" />
                  </div>
                </td>
                <td>
                  <Button type="button" variant="ghost" size="icon" aria-label="Delete row" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id || current.length === 1))}>
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="h-8" onClick={() => setRows((current) => [...current, waterfallRow("", "0")])}>
          <Plus /> Add row
        </Button>
        <Button type="button" variant="ghost" className="h-8" onClick={() => setRows([waterfallRow("", "")])}>
          Clear
        </Button>
        <label className="text-[12px] text-[var(--nb-secondary)]">
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => {
                if (!applyTable(String(reader.result ?? ""))) setFileNote("Couldn’t read that file as a table.")
              }
              reader.readAsText(file)
              event.target.value = ""
            }}
          />
          <span className="cursor-pointer underline-offset-4 hover:underline">Upload CSV</span>
        </label>
      </div>
      {fileNote ? <p className="text-[13px] text-red-600">{fileNote}</p> : null}
      <DataError show={invalidValue} />
    </div>
  )

  const hovered = hover !== null ? bars[Number(hover)] : null

  const nums = numeric.map((row) => row.n)
  const stats =
    nums.length === 0
      ? []
      : [
          { label: "Total", value: formatValue(nums.reduce((sum, value) => sum + value, 0)) },
          { label: "Min", value: formatValue(Math.min(...nums)) },
          { label: "Max", value: formatValue(Math.max(...nums)) },
        ]

  function reset() {
    setRows(first.data.map((row) => ({ ...row, id: vizId() })))
    setStyle({ ...defaultVizStyle, showPercent: false, showLegend: false, legend: "none" })
    setMeta({ ...emptyMeta, title: first.title })
    setHover(null)
    marks.reset()
    setFileNote(null)
  }

  return (
    <>
    <VizStudio
      title={title}
      filename="waterfall-chart"
      surface={{ background: theme.background, dot: theme.dot }}
      stats={stats}
      onReset={reset}
      csv={csv}
      svgRef={svgRef}
      data={data}
      canvas={
        empty ? (
          <EmptyViz onExample={() => { setRows(first.data.map((row) => ({ ...row, id: vizId() }))); setMeta((current) => ({ ...current, title: first.title })) }} onManual={() => setRows([waterfallRow("Opening", "0", "total")])} />
        ) : (
          <ChartFrame ref={svgRef} width={width} height={height} theme={theme} meta={meta} description={meta.title || "Waterfall chart"}>
            {style.showGrid
              ? yTicks.map((tick) => (
                  <g key={tick}>
                    <line x1={pad.l} x2={width - pad.r} y1={y(tick)} y2={y(tick)} stroke={theme.grid} />
                    <text x={pad.l - 8} y={y(tick) + 4} textAnchor="end" fill={theme.muted} fontSize={10}>
                      {formatValue(tick)}
                    </text>
                  </g>
                ))
              : null}
            {bars.map((bar, index) => {
              const x = pad.l + index * (barW + gap) + gap / 2
              const top = y(Math.max(bar.start, bar.end))
              const bottom = y(Math.min(bar.start, bar.end))
              const id = `bar:${index}`
              const mark = marks.of(id)
              const selected = marks.selected?.id === id
              const fill = mark.color ?? (bar.kind === "total" ? theme.ink : bar.value >= 0 ? theme.series[1] : theme.series[3])
              const next = bars[index + 1]
              return (
                <g key={`${bar.label}-${index}`}>
                  <rect
                    x={x}
                    y={top}
                    width={barW}
                    height={Math.max(1, bottom - top)}
                    fill={fill}
                    opacity={mark.opacity ?? (hover === String(index) ? 1 : 0.92)}
                    stroke={selected ? theme.selected : "transparent"}
                    strokeWidth={selected ? 2 : 0}
                    className="cursor-pointer"
                    onMouseEnter={() => setHover(String(index))}
                    onMouseLeave={() => setHover(null)}
                    onPointerDown={(event) => marks.select(id, bar.label || "Bar", event)}
                  />
                  {style.showValues && mark.showLabel !== false ? (
                    <text x={x + barW / 2} y={top - 6} textAnchor="middle" fill={theme.ink} fontSize={style.valueSize}>
                      {formatValue(bar.display)}
                    </text>
                  ) : null}
                  {style.showLabels && mark.showLabel !== false ? (
                    <text x={x + barW / 2} y={height - 18} textAnchor="middle" fill={theme.muted} fontSize={Math.max(9, style.labelSize - 1)}>
                      {bar.label}
                    </text>
                  ) : null}
                  {next && next.kind !== "total" ? (
                    <line
                      x1={x + barW}
                      x2={pad.l + (index + 1) * (barW + gap) + gap / 2}
                      y1={y(bar.end)}
                      y2={y(bar.end)}
                      stroke={theme.muted}
                      strokeDasharray="3 3"
                    />
                  ) : null}
                </g>
              )
            })}
            {hovered ? (
              <text x={width - pad.r} y={20} textAnchor="end" fill={theme.ink} fontSize={12}>
                {hovered.label}: {formatValue(hovered.display)}
              </text>
            ) : null}
          </ChartFrame>
        )
      }
      customize={
        <VizCustomize
          style={style}
          meta={meta}
          onStyle={(next) => setStyle((current) => ({ ...current, ...next }))}
          onMeta={(next) => setMeta((current) => ({ ...current, ...next }))}
          omit={["percent", "legend"]}
        />
      }
    />
    <MarkPopover
      selected={marks.selected}
      value={marks.selected ? marks.of(marks.selected.id) : {}}
      color={marks.selected ? (marks.of(marks.selected.id).color ?? theme.series[1]) : theme.series[1]}
      fields={["label"]}
      onChange={marks.update}
      onClose={marks.close}
    />
    </>
  )
}
