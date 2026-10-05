"use client"

import { Button } from "@/components/ui/button"
import { ChartFrame } from "@/components/viz/chart-frame"
import { Segmented } from "@/components/viz/fields"
import { VizCustomize } from "@/components/viz/customize"
import { VizDataTable } from "@/components/viz/data-table"
import { EmptyViz, ExampleList, VizStudio } from "@/components/viz/studio"
import { parseFlexibleDate } from "@/lib/viz/dates"
import { timelineEvent, timelineExamples, type TimelineEvent } from "@/lib/viz/examples"
import { vizId } from "@/lib/viz/id"
import { inferTable, rowsToCsv } from "@/lib/viz/parse"
import { defaultVizStyle, emptyMeta, resolveTheme, type VizMeta, type VizStyle } from "@/lib/viz/style"
import { seriesColor } from "@/lib/viz/themes"
import { useMemo, useRef, useState } from "react"

const first = timelineExamples[0]

export function TimelineGenerator() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [events, setEvents] = useState<TimelineEvent[]>(() => first.data.map((event) => ({ ...event, id: vizId() })))
  const [style, setStyle] = useState<VizStyle>(defaultVizStyle)
  const [meta, setMeta] = useState<VizMeta>({ ...emptyMeta, title: first.title })
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical")
  const [autoSort, setAutoSort] = useState(true)
  const theme = resolveTheme(style)

  const ordered = useMemo(() => {
    const parsed = events.map((event) => ({ event, date: parseFlexibleDate(event.date) }))
    if (!autoSort) return parsed
    return [...parsed].sort((a, b) => (a.date?.time ?? 0) - (b.date?.time ?? 0))
  }, [events, autoSort])

  function setCell(id: string, key: string, value: string) {
    setEvents((current) => current.map((event) => (event.id === id ? { ...event, [key]: value } : event)))
  }

  function onPaste(event: React.ClipboardEvent) {
    const text = event.clipboardData.getData("text/plain")
    const inferred = inferTable(text)
    if (!inferred || inferred.rows.length === 0) return
    event.preventDefault()
    setEvents(
      inferred.rows.map((row) => timelineEvent(row[0] ?? "", row[1] ?? row[0] ?? "", { description: row[2] ?? "", category: row[3] ?? "" }))
    )
  }

  const csv = rowsToCsv(
    ["Date", "Event", "Description", "Category"],
    events.map((event) => [event.date, event.title, event.description, event.category])
  )
  const empty = events.every((event) => !event.title.trim() && !event.date.trim())
  const width = orientation === "vertical" ? 640 : Math.max(720, ordered.length * 140)
  const height = orientation === "vertical" ? Math.max(280, ordered.length * 88) : 280

  const data = (
    <div className="flex flex-col gap-4" onPaste={onPaste}>
      <ExampleList
        examples={timelineExamples}
        onLoad={(next, title) => {
          setEvents(next.map((event) => ({ ...event, id: vizId() })))
          setMeta((current) => ({ ...current, title }))
        }}
      />
      <VizDataTable
        columns={[
          { key: "date", label: "Date", placeholder: "Q1 2026" },
          { key: "title", label: "Event", placeholder: "Launch" },
          { key: "description", label: "Description" },
          { key: "category", label: "Category", placeholder: "Ship" },
        ]}
        rows={events}
        get={(row, key) => String(row[key as keyof TimelineEvent] ?? "")}
        set={setCell}
        onAdd={() => setEvents((current) => [...current, timelineEvent("", "")])}
        onDelete={(id) => setEvents((current) => (current.length === 1 ? current : current.filter((event) => event.id !== id)))}
        onDuplicate={(id) =>
          setEvents((current) => {
            const index = current.findIndex((event) => event.id === id)
            if (index < 0) return current
            return [...current.slice(0, index + 1), { ...current[index], id: vizId() }, ...current.slice(index + 1)]
          })
        }
        addLabel="Add event"
      />
      <Button type="button" variant="ghost" size="xs" onClick={() => setEvents([timelineEvent("", "")])}>
        Clear
      </Button>
      <p className="text-[12px] text-[var(--nb-secondary)]">
        Dates can be a year, a quarter, a month, or a day — “2026”, “Q1 2026”, “March 2026”, or “10 March 2026”.
      </p>
    </div>
  )

  const canvas = empty ? (
    <EmptyViz
      onExample={() => {
        setEvents(first.data.map((event) => ({ ...event, id: vizId() })))
        setMeta((current) => ({ ...current, title: first.title }))
      }}
      onManual={() => setEvents([timelineEvent("", "")])}
    />
  ) : (
    <ChartFrame ref={svgRef} width={width} height={height} theme={theme} meta={meta} description="Timeline">
      {orientation === "vertical" ? (
        <>
          <line x1={40} x2={40} y1={16} y2={height - 16} stroke={theme.ink} />
          {ordered.map(({ event, date }, index) => {
            const y = 28 + index * 88
            const cats = [...new Set(events.map((item) => item.category).filter(Boolean))]
            const fill = seriesColor(theme, Math.max(0, cats.indexOf(event.category)))
            return (
              <g key={event.id}>
                <circle cx={40} cy={y} r={6} fill={fill} />
                {style.showLabels ? (
                  <text x={64} y={y - 8} fill={theme.muted} fontSize={style.valueSize}>
                    {event.date}
                    {date ? "" : event.date ? "" : ""}
                  </text>
                ) : null}
                <text x={64} y={y + 10} fill={theme.ink} fontSize={style.labelSize} fontWeight={style.labelWeight}>
                  {event.title}
                </text>
                {event.description ? (
                  <text x={64} y={y + 28} fill={theme.muted} fontSize={11}>
                    {event.description}
                  </text>
                ) : null}
              </g>
            )
          })}
        </>
      ) : (
        <>
          <line x1={32} x2={width - 32} y1={120} y2={120} stroke={theme.ink} />
          {ordered.map(({ event }, index) => {
            const x = 48 + index * ((width - 96) / Math.max(ordered.length - 1, 1))
            const cats = [...new Set(events.map((item) => item.category).filter(Boolean))]
            const fill = seriesColor(theme, Math.max(0, cats.indexOf(event.category)))
            const up = index % 2 === 0
            return (
              <g key={event.id}>
                <circle cx={x} cy={120} r={6} fill={fill} />
                <line x1={x} x2={x} y1={120} y2={up ? 72 : 168} stroke={theme.grid} />
                <text x={x} y={up ? 48 : 188} textAnchor="middle" fill={theme.muted} fontSize={style.valueSize}>
                  {event.date}
                </text>
                <text x={x} y={up ? 64 : 204} textAnchor="middle" fill={theme.ink} fontSize={style.labelSize} fontWeight={style.labelWeight}>
                  {event.title}
                </text>
              </g>
            )
          })}
        </>
      )}
    </ChartFrame>
  )

  return (
    <VizStudio
      filename="timeline"
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
          omit={["percent", "grid", "legend"]}
          extra={
            <>
              <Segmented
                label="Layout"
                value={orientation}
                options={[
                  { id: "vertical", label: "Vertical" },
                  { id: "horizontal", label: "Horizontal" },
                ]}
                onChange={setOrientation}
              />
              <Segmented
                label="Order"
                value={autoSort ? "auto" : "manual"}
                options={[
                  { id: "auto", label: "By date" },
                  { id: "manual", label: "As entered" },
                ]}
                onChange={(value) => setAutoSort(value === "auto")}
              />
            </>
          }
        />
      }
    />
  )
}
