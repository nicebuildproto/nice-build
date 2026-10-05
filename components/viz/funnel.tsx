"use client"

import { Button } from "@/components/ui/button"
import { ChartFrame } from "@/components/viz/chart-frame"
import { VizCustomize } from "@/components/viz/customize"
import { VizDataTable } from "@/components/viz/data-table"
import { EmptyViz, ExampleList, VizStudio } from "@/components/viz/studio"
import {
  funnelExamples,
  funnelStage,
  type FunnelStage,
} from "@/lib/viz/examples"
import { computeFunnel } from "@/lib/viz/funnel"
import { vizId } from "@/lib/viz/id"
import { inferTable, parseNumber, rowsToCsv } from "@/lib/viz/parse"
import { formatPercent, formatValue } from "@/lib/viz/scale"
import { defaultVizStyle, emptyMeta, resolveTheme, type VizMeta, type VizStyle } from "@/lib/viz/style"
import { seriesColor } from "@/lib/viz/themes"
import { useMemo, useRef, useState } from "react"

const first = funnelExamples[0]

export function FunnelChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [stages, setStages] = useState<FunnelStage[]>(() => first.data.map((stage) => ({ ...stage, id: vizId() })))
  const [style, setStyle] = useState<VizStyle>(defaultVizStyle)
  const [meta, setMeta] = useState<VizMeta>({ ...emptyMeta, title: first.title })
  const [pasteNote, setPasteNote] = useState<string | null>(null)
  const rows = useMemo(() => computeFunnel(stages), [stages])
  const theme = resolveTheme(style)
  const overall = rows.length > 1 && Number.isFinite(rows[0].value) && rows[0].value !== 0
    ? (rows[rows.length - 1].value / rows[0].value) * 100
    : null
  const increased = rows.filter((row) => row.increased)

  function setCell(id: string, key: string, value: string) {
    setStages((current) => current.map((stage) => (stage.id === id ? { ...stage, [key]: value } : stage)))
  }

  function onPaste(event: React.ClipboardEvent) {
    const text = event.clipboardData.getData("text/plain")
    const inferred = inferTable(text)
    if (!inferred || inferred.rows.length === 0) return
    event.preventDefault()
    const label = inferred.columns.find((column) => column.kind === "label") ?? inferred.columns[0]
    const value = inferred.columns.find((column) => column.kind === "number") ?? inferred.columns[1] ?? inferred.columns[0]
    setStages(
      inferred.rows.map((row) => funnelStage(row[label.index] ?? "Stage", row[value.index] ?? "0"))
    )
    setPasteNote(inferred.mappingNote)
  }

  const csv = rowsToCsv(
    ["Stage", "Value"],
    stages.map((stage) => [stage.label, stage.value])
  )

  const width = 720
  const height = Math.max(280, rows.length * 64 + 48)

  const data = (
    <div className="flex flex-col gap-4" onPaste={onPaste}>
      <ExampleList examples={funnelExamples} onLoad={(next, title) => {
        setStages(next.map((stage) => ({ ...stage, id: vizId() })))
        setMeta((current) => ({ ...current, title }))
      }} />
      <VizDataTable
        columns={[
          { key: "label", label: "Stage", placeholder: "Visits" },
          { key: "value", label: "Value", kind: "number", placeholder: "1000", width: "6rem" },
        ]}
        rows={stages}
        get={(row, key) => (key === "label" ? row.label : row.value)}
        set={setCell}
        onAdd={() => setStages((current) => [...current, funnelStage("Stage", "0")])}
        onDelete={(id) => setStages((current) => (current.length === 1 ? current : current.filter((stage) => stage.id !== id)))}
        onDuplicate={(id) =>
          setStages((current) => {
            const index = current.findIndex((stage) => stage.id === id)
            if (index < 0) return current
            const copy = { ...current[index], id: vizId() }
            return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)]
          })
        }
        onMove={(id, direction) =>
          setStages((current) => {
            const index = current.findIndex((stage) => stage.id === id)
            const next = index + direction
            if (index < 0 || next < 0 || next >= current.length) return current
            const clone = [...current]
            const [item] = clone.splice(index, 1)
            clone.splice(next, 0, item)
            return clone
          })
        }
        addLabel="Add stage"
      />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="xs" onClick={() => setStages(current => [...current].sort((a, b) => (parseNumber(b.value) ?? 0) - (parseNumber(a.value) ?? 0)))}>
          Sort largest first
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => setStages([funnelStage("", "")])}>
          Clear
        </Button>
      </div>
      <p className="text-[12px] text-[var(--nb-secondary)]">Paste a table from Excel or Sheets. Each row is a stage and a value.</p>
    </div>
  )

  const empty = stages.every((stage) => !stage.label.trim() && !stage.value.trim())
  const canvas = empty ? (
    <EmptyViz
      onExample={() => {
        setStages(first.data.map((stage) => ({ ...stage, id: vizId() })))
        setMeta((current) => ({ ...current, title: first.title }))
      }}
      onManual={() => setStages([funnelStage("Stage", "")])}
    />
  ) : (
    <ChartFrame
      ref={svgRef}
      width={width}
      height={height}
      theme={theme}
      meta={meta}
      description={`Funnel from ${rows[0]?.label ?? "start"} to ${rows[rows.length - 1]?.label ?? "end"}`}
    >
      {rows.map((row, index) => {
        const band = 56
        const y = 16 + index * band
        const w = Math.max(48, (Math.max(0, row.ofTop) / 100) * (width - 180))
        const x = 24 + (width - 180 - w) / 2
        const next = rows[index + 1]
        const nextW = next ? Math.max(48, (Math.max(0, next.ofTop) / 100) * (width - 180)) : w * 0.7
        const nx = 24 + (width - 180 - nextW) / 2
        const h = 40
        const path = `M ${x} ${y} L ${x + w} ${y} L ${nx + nextW} ${y + h} L ${nx} ${y + h} Z`
        const fill = seriesColor(theme, 0)
        const label = style.showLabels ? row.label : ""
        const valueBits = [
          style.showValues && Number.isFinite(row.value) ? formatValue(row.value) : "",
          style.showPercent ? formatPercent(row.ofTop) : "",
        ].filter(Boolean)
        return (
          <g key={row.id}>
            <path d={path} fill={fill} opacity={1 - index * 0.12} />
            <text x={width - 20} y={y + 18} textAnchor="end" fill={theme.ink} fontSize={style.labelSize} fontWeight={style.labelWeight}>
              {label}
            </text>
            <text x={width - 20} y={y + 34} textAnchor="end" fill={theme.muted} fontSize={style.valueSize}>
              {valueBits.join(" · ")}
              {index > 0 ? ` · ${formatPercent(row.ofPrev)} step` : ""}
            </text>
          </g>
        )
      })}
      {overall != null ? (
        <text x={24} y={height - 8} fill={theme.muted} fontSize={11}>
          Overall conversion {formatPercent(overall)}
        </text>
      ) : null}
    </ChartFrame>
  )

  return (
    <VizStudio
      filename="funnel-chart"
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
          omit={["grid", "legend"]}
        />
      }
      notice={
        increased.length > 0 ? (
          <p className="rounded-xl border border-black/[0.08] bg-[var(--nb-accent)] px-4 py-3 text-[13px] text-[var(--nb-primary)]">
            {increased.map((row) => row.label).join(", ")} {increased.length === 1 ? "is" : "are"} larger than the stage above. That’s unusual for a conversion funnel — the shape will widen.
          </p>
        ) : pasteNote ? (
          <p className="text-[13px] text-[var(--nb-secondary)]">{pasteNote}</p>
        ) : null
      }
    />
  )
}
