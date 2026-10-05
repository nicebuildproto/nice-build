"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChartFrame } from "@/components/viz/chart-frame"
import { VizCustomize } from "@/components/viz/customize"
import { EmptyViz, ExampleList, VizStudio } from "@/components/viz/studio"
import { scatterExamples, scatterPoint, type ScatterPoint } from "@/lib/viz/examples"
import { vizId } from "@/lib/viz/id"
import { inferTable, parseNumber, parseTable, rowsToCsv } from "@/lib/viz/parse"
import { formatValue, niceExtent, ticks as axisTicks } from "@/lib/viz/scale"
import { defaultVizStyle, emptyMeta, resolveTheme, type VizMeta, type VizStyle } from "@/lib/viz/style"
import { seriesColor } from "@/lib/viz/themes"
import { Plus, Trash2 } from "lucide-react"
import { useMemo, useRef, useState } from "react"

export function ScatterPlotGenerator() {
  const first = scatterExamples[0]
  const svgRef = useRef<SVGSVGElement>(null)
  const [points, setPoints] = useState<ScatterPoint[]>(() => first.data.map((point) => ({ ...point, id: vizId() })))
  const [style, setStyle] = useState<VizStyle>({ ...defaultVizStyle, showPercent: false })
  const [meta, setMeta] = useState<VizMeta>({ ...emptyMeta, title: first.title })
  const [xLabel, setXLabel] = useState("X")
  const [yLabel, setYLabel] = useState("Y")
  const [hover, setHover] = useState<string | null>(null)
  const [fileNote, setFileNote] = useState<string | null>(null)
  const theme = resolveTheme(style)

  const numeric = useMemo(
    () =>
      points
        .map((point) => ({
          ...point,
          nx: parseNumber(point.x),
          ny: parseNumber(point.y),
        }))
        .filter((point): point is ScatterPoint & { nx: number; ny: number } => point.nx !== null && point.ny !== null),
    [points],
  )
  const series = useMemo(() => [...new Set(numeric.map((point) => point.series.trim() || "Series 1"))], [numeric])
  const empty = numeric.length === 0

  function applyTable(text: string) {
    const table = parseTable(text)
    if (table.length < 2) return false
    const inferred = inferTable(text)
    const body = inferred ? inferred.rows : table.slice(1)
    const next: ScatterPoint[] = body.map((row) =>
      scatterPoint(row[0] ?? "", row[1] ?? "", row[2] ?? "Series 1", row[3] ?? ""),
    )
    if (!next.length) return false
    setPoints(next)
    setFileNote(null)
    return true
  }

  const csv = rowsToCsv(
    ["X", "Y", "Series", "Label"],
    points.map((point) => [point.x, point.y, point.series, point.label]),
  )
  const width = 720
  const height = 400
  const pad = { l: 52, r: style.legend === "right" ? 120 : 24, t: 16, b: 52 }
  const xs = numeric.map((point) => point.nx)
  const ys = numeric.map((point) => point.ny)
  const xExtent = niceExtent(Math.min(...xs, 0), Math.max(...xs, 1), false)
  const yExtent = niceExtent(Math.min(...ys, 0), Math.max(...ys, 1), false)
  const xTicks = axisTicks(xExtent.min, xExtent.max)
  const yTicks = axisTicks(yExtent.min, yExtent.max)
  const sx = (value: number) => pad.l + ((value - xExtent.min) / (xExtent.max - xExtent.min || 1)) * (width - pad.l - pad.r)
  const sy = (value: number) => pad.t + (1 - (value - yExtent.min) / (yExtent.max - yExtent.min || 1)) * (height - pad.t - pad.b)

  const data = (
    <div className="flex flex-col gap-4">
      <ExampleList examples={scatterExamples} onLoad={(data, title) => { setPoints(data.map((point) => ({ ...point, id: vizId() }))); setMeta((current) => ({ ...current, title })) }} />
      <div className="overflow-x-auto rounded-lg border border-black/[0.08]">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[var(--nb-accent)] text-left text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">
              <th className="px-2 py-2">X</th>
              <th className="px-2 py-2">Y</th>
              <th className="px-2 py-2">Series</th>
              <th className="px-2 py-2">Label</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.id} className="border-t border-black/[0.06]">
                {(["x", "y", "series", "label"] as const).map((key) => (
                  <td key={key} className="p-0">
                    <Input
                      value={point[key]}
                      aria-label={key}
                      onChange={(event) =>
                        setPoints((current) => current.map((item) => (item.id === point.id ? { ...item, [key]: event.target.value } : item)))
                      }
                      className="h-9 rounded-none border-0"
                    />
                  </td>
                ))}
                <td>
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="Delete point" onClick={() => setPoints((current) => current.filter((item) => item.id !== point.id || current.length === 1))}>
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setPoints((current) => [...current, scatterPoint("", "", current[0]?.series || "Series 1")])}>
          <Plus /> Add point
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => setPoints([scatterPoint("", "", "Series 1")])}>
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
                if (!applyTable(String(reader.result ?? ""))) setFileNote("Couldn’t read that file as X, Y, series.")
              }
              reader.readAsText(file)
              event.target.value = ""
            }}
          />
          <span className="cursor-pointer underline-offset-4 hover:underline">Upload CSV</span>
        </label>
      </div>
      {fileNote ? <p className="text-[12px] text-red-600">{fileNote}</p> : null}
      <p className="text-[12px] text-[var(--nb-secondary)]">Paste or upload X, Y, optional series and label.</p>
    </div>
  )

  const hovered = numeric.find((point) => point.id === hover)

  return (
    <VizStudio
      filename="scatter-plot"
      csv={csv}
      svgRef={svgRef}
      data={data}
      canvas={
        empty ? (
          <EmptyViz onExample={() => { setPoints(first.data.map((point) => ({ ...point, id: vizId() }))); setMeta((current) => ({ ...current, title: first.title })) }} onManual={() => setPoints([scatterPoint("1", "1")])} />
        ) : (
          <ChartFrame ref={svgRef} width={width} height={height} theme={theme} meta={meta} description={meta.title || "Scatter plot"}>
            {style.showGrid
              ? yTicks.map((tick) => (
                  <g key={`y-${tick}`}>
                    <line x1={pad.l} x2={width - pad.r} y1={sy(tick)} y2={sy(tick)} stroke={theme.grid} />
                    <text x={pad.l - 8} y={sy(tick) + 4} textAnchor="end" fill={theme.muted} fontSize={10}>
                      {formatValue(tick)}
                    </text>
                  </g>
                ))
              : null}
            {xTicks.map((tick) => (
              <g key={`x-${tick}`}>
                {style.showGrid ? <line x1={sx(tick)} x2={sx(tick)} y1={pad.t} y2={height - pad.b} stroke={theme.grid} /> : null}
                <text x={sx(tick)} y={height - pad.b + 16} textAnchor="middle" fill={theme.muted} fontSize={10}>
                  {formatValue(tick)}
                </text>
              </g>
            ))}
            <text x={width / 2} y={height - 8} textAnchor="middle" fill={theme.muted} fontSize={11}>
              {xLabel}
            </text>
            <text x={16} y={height / 2} textAnchor="middle" fill={theme.muted} fontSize={11} transform={`rotate(-90 16 ${height / 2})`}>
              {yLabel}
            </text>
            {numeric.map((point) => {
              const seriesIndex = series.indexOf(point.series.trim() || "Series 1")
              return (
                <circle
                  key={point.id}
                  cx={sx(point.nx)}
                  cy={sy(point.ny)}
                  r={hover === point.id ? 7 : 5}
                  fill={seriesColor(theme, Math.max(0, seriesIndex))}
                  onMouseEnter={() => setHover(point.id)}
                  onMouseLeave={() => setHover(null)}
                />
              )
            })}
            {hovered && style.showLabels ? (
              <text x={sx(hovered.nx) + 10} y={sy(hovered.ny) - 8} fill={theme.ink} fontSize={style.labelSize}>
                {hovered.label || `${formatValue(hovered.nx)}, ${formatValue(hovered.ny)}`}
              </text>
            ) : null}
            {style.legend !== "none" && series.length > 1
              ? series.map((name, index) => (
                  <g key={name} transform={`translate(${style.legend === "right" ? width - 110 : pad.l + index * 110}, ${style.legend === "right" ? pad.t + index * 18 : height - 36})`}>
                    <circle r={4} fill={seriesColor(theme, index)} />
                    <text x={10} y={4} fill={theme.ink} fontSize={11}>
                      {name}
                    </text>
                  </g>
                ))
              : null}
          </ChartFrame>
        )
      }
      customize={
        <VizCustomize
          style={style}
          meta={meta}
          onStyle={(next) => setStyle((current) => ({ ...current, ...next }))}
          onMeta={(next) => setMeta((current) => ({ ...current, ...next }))}
          omit={["percent", "values"]}
          extra={
            <>
              <label className="flex flex-col gap-1 text-[13px]">
                X axis
                <Input value={xLabel} onChange={(event) => setXLabel(event.target.value)} className="h-8" />
              </label>
              <label className="flex flex-col gap-1 text-[13px]">
                Y axis
                <Input value={yLabel} onChange={(event) => setYLabel(event.target.value)} className="h-8" />
              </label>
            </>
          }
        />
      }
    />
  )
}
