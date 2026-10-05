"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChartFrame } from "@/components/viz/chart-frame"
import { Segmented, ToggleField } from "@/components/viz/fields"
import { VizCustomize } from "@/components/viz/customize"
import { EmptyViz, ExampleList, VizStudio } from "@/components/viz/studio"
import {
  barExamples,
  lineExamples,
  pieExamples,
  seriesRow,
  type SeriesRow,
} from "@/lib/viz/examples"
import { vizId } from "@/lib/viz/id"
import { inferTable, parseNumber, rowsToCsv, tableToSeries } from "@/lib/viz/parse"
import { formatPercent, formatValue, niceExtent, ticks as axisTicks } from "@/lib/viz/scale"
import { defaultVizStyle, emptyMeta, resolveTheme, type VizMeta, type VizStyle } from "@/lib/viz/style"
import { seriesColor } from "@/lib/viz/themes"
import { Plus, Trash2 } from "lucide-react"
import { useMemo, useRef, useState } from "react"

type Kind = "bar" | "line" | "pie"
type BarLayout = "vertical" | "horizontal"
type BarMode = "grouped" | "stacked"

const catalogs = {
  bar: barExamples,
  line: lineExamples,
  pie: pieExamples,
}

export function BarChartGenerator() {
  return <CartesianChart kind="bar" />
}
export function LineChartGenerator() {
  return <CartesianChart kind="line" />
}
export function PieChartGenerator() {
  return <CartesianChart kind="pie" />
}

function CartesianChart({ kind }: { kind: Kind }) {
  const examples = catalogs[kind]
  const first = examples[0]
  const svgRef = useRef<SVGSVGElement>(null)
  const [series, setSeries] = useState<string[]>(() => [...first.data.series])
  const [rows, setRows] = useState<SeriesRow[]>(() => first.data.rows.map((row) => ({ ...row, id: vizId(), values: [...row.values] })))
  const [style, setStyle] = useState<VizStyle>(defaultVizStyle)
  const [meta, setMeta] = useState<VizMeta>({ ...emptyMeta, title: first.title })
  const [layout, setLayout] = useState<BarLayout>("vertical")
  const [mode, setMode] = useState<BarMode>("grouped")
  const [sort, setSort] = useState<"none" | "asc" | "desc">("none")
  const [startAtZero, setStartAtZero] = useState(kind !== "line")
  const [area, setArea] = useState(false)
  const [donut, setDonut] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const [pasteNote, setPasteNote] = useState<string | null>(null)
  const [fileNote, setFileNote] = useState<string | null>(null)
  const theme = resolveTheme(style)

  const numeric = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        nums: series.map((_, index) => parseNumber(row.values[index] ?? "") ?? 0),
      })),
    [rows, series]
  )

  const sorted = useMemo(() => {
    if (sort === "none") return numeric
    const clone = [...numeric]
    clone.sort((a, b) => (sort === "asc" ? a.nums[0] - b.nums[0] : b.nums[0] - a.nums[0]))
    return clone
  }, [numeric, sort])

  const negatives = numeric.flatMap((row) => row.nums.filter((value) => value < 0))
  const pieTooMany = kind === "pie" && sorted.length > 7

  function load(data: { series: string[]; rows: SeriesRow[] }, title: string) {
    setSeries([...data.series])
    setRows(data.rows.map((row) => ({ ...row, id: vizId(), values: [...row.values] })))
    setMeta((current) => ({ ...current, title }))
  }

  function applyTable(text: string) {
    const inferred = inferTable(text)
    if (!inferred) return false
    const converted = tableToSeries(inferred)
    setSeries(converted.series)
    setRows(converted.rows.map((row) => seriesRow(row.label, row.values)))
    setPasteNote(inferred.mappingNote)
    return true
  }

  function onPaste(event: React.ClipboardEvent) {
    const text = event.clipboardData.getData("text/plain")
    if (!text.includes("\n") && !text.includes("\t")) return
    if (applyTable(text)) event.preventDefault()
  }

  function onFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? "")
      if (!applyTable(text)) setFileNote("Couldn’t read that file as a table.")
      else setFileNote(null)
    }
    reader.readAsText(file)
  }

  const csv = rowsToCsv(["Label", ...series], rows.map((row) => [row.label, ...row.values]))
  const empty = rows.every((row) => !row.label.trim() && row.values.every((value) => value.trim() === ""))
  const width = 720
  const height = 400
  const pad = { l: layout === "horizontal" ? 96 : 48, r: style.legend === "right" ? 120 : 24, t: 16, b: 48 }
  const plotW = width - pad.l - pad.r
  const plotH = height - pad.t - pad.b

  const allValues = sorted.flatMap((row) => row.nums)
  const stackedMax = Math.max(
    ...sorted.map((row) => row.nums.reduce((sum, value) => sum + Math.max(0, value), 0)),
    1
  )
  const extent = niceExtent(
    Math.min(...allValues, 0),
    kind === "bar" && mode === "stacked" ? stackedMax : Math.max(...allValues, 0),
    kind === "pie" ? true : startAtZero
  )
  const yTicks = axisTicks(extent.min, extent.max)

  const data = (
    <div className="flex flex-col gap-4" onPaste={onPaste}>
      <ExampleList examples={examples} onLoad={load} />
      <div className="flex flex-wrap gap-2">
        {series.map((name, index) => (
          <Input
            key={`${name}-${index}`}
            value={name}
            aria-label={`Series ${index + 1} name`}
            onChange={(event) =>
              setSeries((current) => current.map((item, i) => (i === index ? event.target.value : item)))
            }
            className="h-8 w-28"
          />
        ))}
        {kind !== "pie" ? (
          <Button type="button" variant="outline" size="xs" onClick={() => {
            setSeries((current) => [...current, `Series ${current.length + 1}`])
            setRows((current) => current.map((row) => ({ ...row, values: [...row.values, "0"] })))
          }}>
            Add series
          </Button>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-lg border border-black/[0.08]">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[var(--nb-accent)] text-left text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">
              <th className="px-2 py-2">Label</th>
              {series.map((name) => (
                <th key={name} className="px-2 py-2">{name}</th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-black/[0.06]">
                <td className="p-0">
                  <Input
                    value={row.label}
                    aria-label="Label"
                    onChange={(event) =>
                      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, label: event.target.value } : item)))
                    }
                    className="h-9 rounded-none border-0"
                  />
                </td>
                {series.map((_, index) => (
                  <td key={index} className="border-l border-black/[0.06] p-0">
                    <Input
                      value={row.values[index] ?? ""}
                      inputMode="decimal"
                      aria-label={`${row.label || "Row"} ${series[index]}`}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id
                              ? {
                                  ...item,
                                  values: series.map((__, i) => (i === index ? event.target.value : item.values[i] ?? "")),
                                }
                              : item
                          )
                        )
                      }
                      className="h-9 rounded-none border-0 tabular-nums"
                    />
                  </td>
                ))}
                <td className="border-l border-black/[0.06]">
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="Delete row" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id || current.length === 1))}>
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setRows((current) => [...current, seriesRow("", series.map(() => "0"))])}>
          <Plus /> Add row
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => setRows([seriesRow("", series.map(() => ""))])}>
          Clear
        </Button>
        <label className="text-[12px] text-[var(--nb-secondary)]">
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onFile(file)
              event.target.value = ""
            }}
          />
          <span className="cursor-pointer underline-offset-4 hover:underline">Upload CSV</span>
        </label>
      </div>
      {fileNote ? <p className="text-[12px] text-red-600">{fileNote}</p> : null}
      <p className="text-[12px] text-[var(--nb-secondary)]">Paste from Excel or Sheets. The first column is the label; other numeric columns become series.</p>
    </div>
  )

  let plot = null
  if (!empty && kind === "bar") {
    plot = (
      <g>
        {style.showGrid
          ? yTicks.map((tick) => {
              const y = pad.t + plotH - ((tick - extent.min) / (extent.max - extent.min || 1)) * plotH
              return layout === "vertical" ? (
                <g key={tick}>
                  <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke={theme.grid} />
                  <text x={pad.l - 8} y={y + 4} textAnchor="end" fill={theme.muted} fontSize={10}>
                    {formatValue(tick)}
                  </text>
                </g>
              ) : (
                <g key={tick}>
                  <line
                    y1={pad.t}
                    y2={height - pad.b}
                    x1={pad.l + ((tick - extent.min) / (extent.max - extent.min || 1)) * plotW}
                    x2={pad.l + ((tick - extent.min) / (extent.max - extent.min || 1)) * plotW}
                    stroke={theme.grid}
                  />
                </g>
              )
            })
          : null}
        {sorted.map((row, index) => {
          const band = (layout === "vertical" ? plotW : plotH) / sorted.length
          const inner = series.length
          return series.map((_, s) => {
            const value = mode === "stacked"
              ? row.nums.slice(0, s + 1).reduce((sum, n) => sum + Math.max(0, n), 0)
              : row.nums[s]
            const base = mode === "stacked" ? row.nums.slice(0, s).reduce((sum, n) => sum + Math.max(0, n), 0) : 0
            const scale = (n: number) => ((n - extent.min) / (extent.max - extent.min || 1))
            const fill = seriesColor(theme, s)
            if (layout === "vertical") {
              const x = pad.l + index * band + (mode === "grouped" ? (s * band * 0.7) / inner + band * 0.15 : band * 0.18)
              const barW = mode === "grouped" ? (band * 0.7) / inner : band * 0.64
              const y = pad.t + plotH - scale(value) * plotH
              const h = Math.max(0, scale(value) * plotH - scale(base) * plotH)
              const top = mode === "stacked" ? pad.t + plotH - scale(value) * plotH : y
              return (
                <g key={`${row.id}-${s}`}>
                  <rect
                    x={x}
                    y={top}
                    width={barW}
                    height={mode === "stacked" ? h : pad.t + plotH - y}
                    fill={fill}
                    opacity={hover && hover !== `${row.id}-${s}` ? 0.35 : 1}
                    onPointerEnter={() => setHover(`${row.id}-${s}`)}
                    onPointerLeave={() => setHover(null)}
                  >
                    <title>{`${row.label} ${series[s]}: ${formatValue(row.nums[s])}`}</title>
                  </rect>
                  {style.showValues && s === (mode === "stacked" ? inner - 1 : s) ? (
                    <text x={x + barW / 2} y={top - 4} textAnchor="middle" fill={theme.ink} fontSize={style.valueSize}>
                      {formatValue(mode === "stacked" ? value : row.nums[s])}
                    </text>
                  ) : null}
                  {style.showLabels && s === 0 ? (
                    <text x={pad.l + index * band + band / 2} y={height - 16} textAnchor="middle" fill={theme.muted} fontSize={style.labelSize}>
                      {row.label}
                    </text>
                  ) : null}
                </g>
              )
            }
            const y = pad.t + index * band + (mode === "grouped" ? (s * band * 0.7) / inner + band * 0.15 : band * 0.18)
            const barH = mode === "grouped" ? (band * 0.7) / inner : band * 0.64
            const w = scale(value) * plotW - scale(base) * plotW
            const x = pad.l + scale(base) * plotW
            return (
              <g key={`${row.id}-${s}`}>
                <rect x={x} y={y} width={Math.max(0, w)} height={barH} fill={fill}>
                  <title>{`${row.label}: ${formatValue(row.nums[s])}`}</title>
                </rect>
                {style.showLabels && s === 0 ? (
                  <text x={pad.l - 8} y={y + barH / 2 + 4} textAnchor="end" fill={theme.ink} fontSize={style.labelSize}>
                    {row.label}
                  </text>
                ) : null}
              </g>
            )
          })
        })}
      </g>
    )
  }

  if (!empty && kind === "line") {
    const pointsFor = (s: number) =>
      sorted.map((row, index) => {
        const x = pad.l + (sorted.length === 1 ? plotW / 2 : (index / (sorted.length - 1)) * plotW)
        const y = pad.t + plotH - ((row.nums[s] - extent.min) / (extent.max - extent.min || 1)) * plotH
        return { x, y, row }
      })
    plot = (
      <g>
        {style.showGrid
          ? yTicks.map((tick) => {
              const y = pad.t + plotH - ((tick - extent.min) / (extent.max - extent.min || 1)) * plotH
              return (
                <g key={tick}>
                  <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke={theme.grid} />
                  <text x={pad.l - 8} y={y + 4} textAnchor="end" fill={theme.muted} fontSize={10}>
                    {formatValue(tick)}
                  </text>
                </g>
              )
            })
          : null}
        {series.map((_, s) => {
          const pts = pointsFor(s)
          const d = pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ")
          const last = pts[pts.length - 1]
          const areaD = `${d} L ${last?.x ?? 0} ${pad.t + plotH} L ${pts[0]?.x ?? 0} ${pad.t + plotH} Z`
          const fill = seriesColor(theme, s)
          return (
            <g key={series[s]}>
              {area ? <path d={areaD} fill={fill} opacity={0.12} /> : null}
              <path d={d} fill="none" stroke={fill} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((pt) => (
                <circle key={pt.row.id} cx={pt.x} cy={pt.y} r={3.5} fill={theme.background} stroke={fill} strokeWidth={1.5}>
                  <title>{`${pt.row.label}: ${formatValue(pt.row.nums[s])}`}</title>
                </circle>
              ))}
            </g>
          )
        })}
        {style.showLabels
          ? sorted.map((row, index) => {
              const x = pad.l + (sorted.length === 1 ? plotW / 2 : (index / (sorted.length - 1)) * plotW)
              return (
                <text key={row.id} x={x} y={height - 16} textAnchor="middle" fill={theme.muted} fontSize={style.labelSize}>
                  {row.label}
                </text>
              )
            })
          : null}
      </g>
    )
  }

  if (!empty && kind === "pie") {
    const total = sorted.reduce((sum, row) => sum + Math.max(0, row.nums[0]), 0) || 1
    const cx = width / 2 - (style.legend === "right" ? 40 : 0)
    const cy = height / 2
    const r = Math.min(plotW, plotH) / 2 - 8
    const inner = donut ? r * 0.56 : 0
    const slices = sorted.map((row) => ({ row, value: Math.max(0, row.nums[0]) }))
    const starts = slices.reduce<number[]>((acc, _slice, index) => {
      const prev = index === 0 ? -Math.PI / 2 : acc[index - 1] + (slices[index - 1].value / total) * Math.PI * 2
      acc.push(prev)
      return acc
    }, [])
    plot = (
      <g>
        {slices.map((slice, index) => {
          const start = starts[index]
          const end = start + (slice.value / total) * Math.PI * 2
          const large = end - start > Math.PI ? 1 : 0
          const x1 = cx + Math.cos(start) * r
          const y1 = cy + Math.sin(start) * r
          const x2 = cx + Math.cos(end) * r
          const y2 = cy + Math.sin(end) * r
          const ix1 = cx + Math.cos(end) * inner
          const iy1 = cy + Math.sin(end) * inner
          const ix2 = cx + Math.cos(start) * inner
          const iy2 = cy + Math.sin(start) * inner
          const mid = start + (end - start) / 2
          const lx = cx + Math.cos(mid) * (r + 16)
          const ly = cy + Math.sin(mid) * (r + 16)
          const d = inner
            ? `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${inner} ${inner} 0 ${large} 0 ${ix2} ${iy2} Z`
            : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
          const highlighted = hover === slice.row.id
          return (
            <g key={slice.row.id}>
              <path
                d={d}
                fill={seriesColor(theme, index)}
                opacity={hover && !highlighted ? 0.35 : 1}
                transform={highlighted ? `translate(${Math.cos(mid) * 6} ${Math.sin(mid) * 6})` : undefined}
                onPointerEnter={() => setHover(slice.row.id)}
                onPointerLeave={() => setHover(null)}
              >
                <title>{`${slice.row.label}: ${formatValue(slice.row.nums[0])} (${formatPercent((slice.value / total) * 100)})`}</title>
              </path>
              {style.showLabels && end - start > 0.25 ? (
                <text x={lx} y={ly} textAnchor={Math.cos(mid) > 0 ? "start" : "end"} fill={theme.ink} fontSize={style.labelSize}>
                  {slice.row.label}
                  {style.showPercent ? ` ${formatPercent((slice.value / total) * 100)}` : ""}
                </text>
              ) : null}
            </g>
          )
        })}
      </g>
    )
  }

  const legend =
    style.legend === "none" || empty
      ? null
      : (kind === "pie" ? sorted.map((row, index) => ({ name: row.label, color: seriesColor(theme, index) })) : series.map((name, index) => ({ name, color: seriesColor(theme, index) }))).map(
          (item, index) => (
            <g key={item.name} transform={style.legend === "right" ? `translate(${width - 110} ${28 + index * 18})` : `translate(${24 + index * 110} ${height - 8})`}>
              <rect width={8} height={8} y={-8} fill={item.color} />
              <text x={12} fill={theme.muted} fontSize={11}>
                {item.name}
              </text>
            </g>
          )
        )

  const canvas = empty ? (
    <EmptyViz onExample={() => load(first.data, first.title)} onManual={() => setRows([seriesRow("", series.map(() => ""))])} />
  ) : (
    <ChartFrame ref={svgRef} width={width} height={height} theme={theme} meta={meta} description={`${kind} chart`}>
      {plot}
      {legend}
    </ChartFrame>
  )

  return (
    <VizStudio
      filename={`${kind}-chart`}
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
          extra={
            <>
              {kind === "bar" ? (
                <>
                  <Segmented
                    label="Orientation"
                    value={layout}
                    options={[
                      { id: "vertical", label: "Vertical" },
                      { id: "horizontal", label: "Horizontal" },
                    ]}
                    onChange={setLayout}
                  />
                  {series.length > 1 ? (
                    <Segmented
                      label="Series"
                      value={mode}
                      options={[
                        { id: "grouped", label: "Grouped" },
                        { id: "stacked", label: "Stacked" },
                      ]}
                      onChange={setMode}
                    />
                  ) : null}
                </>
              ) : null}
              {kind === "line" ? (
                <>
                  <ToggleField label="Start axis at zero" checked={startAtZero} onChange={setStartAtZero} />
                  <ToggleField label="Area fill" checked={area} onChange={setArea} />
                </>
              ) : null}
              {kind === "pie" ? <ToggleField label="Donut" checked={donut} onChange={setDonut} /> : null}
              <Segmented
                label="Sort"
                value={sort}
                options={[
                  { id: "none", label: "As entered" },
                  { id: "desc", label: "High–low" },
                  { id: "asc", label: "Low–high" },
                ]}
                onChange={setSort}
              />
            </>
          }
        />
      }
      notice={
        <>
          {kind === "pie" && negatives.length > 0 ? (
            <p className="rounded-xl border border-black/[0.08] bg-[var(--nb-accent)] px-4 py-3 text-[13px]">
              Negative values can’t be slices. They’re left out of the pie and still shown in the table.
            </p>
          ) : null}
          {pieTooMany ? (
            <p className="text-[13px] text-[var(--nb-secondary)]">
              More than seven slices is hard to read. Consider grouping the smaller ones, or use a bar chart.
            </p>
          ) : null}
          {pasteNote ? <p className="text-[13px] text-[var(--nb-secondary)]">{pasteNote}</p> : null}
        </>
      }
    />
  )
}
