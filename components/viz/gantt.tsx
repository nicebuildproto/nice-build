"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ChartFrame } from "@/components/viz/chart-frame"
import { Segmented } from "@/components/viz/fields"
import { VizCustomize } from "@/components/viz/customize"
import { VizDataTable } from "@/components/viz/data-table"
import { EmptyViz, ExampleList, VizStudio } from "@/components/viz/studio"
import { ganttExamples, ganttTask, type GanttTask } from "@/lib/viz/examples"
import { addDays, ganttTicks, isoDate, layoutGantt, type GanttScale } from "@/lib/viz/gantt"
import { vizId } from "@/lib/viz/id"
import { inferTable, rowsToCsv } from "@/lib/viz/parse"
import { defaultVizStyle, emptyMeta, resolveTheme, type VizMeta, type VizStyle } from "@/lib/viz/style"
import { seriesColor } from "@/lib/viz/themes"
import { useMemo, useRef, useState } from "react"

const first = ganttExamples[0]
const day = 86_400_000

export function GanttChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tasks, setTasks] = useState<GanttTask[]>(() => first.data.map((task) => ({ ...task, id: vizId() })))
  const [style, setStyle] = useState<VizStyle>(defaultVizStyle)
  const [meta, setMeta] = useState<VizMeta>({ ...emptyMeta, title: first.title })
  const [scale, setScale] = useState<GanttScale>("week")
  const [today] = useState(() => Date.now())
  const drag = useRef<{ id: string; mode: "move" | "start" | "end"; originX: number; start: string; end: string } | null>(null)

  const layout = useMemo(() => layoutGantt(tasks), [tasks])
  const theme = resolveTheme(style)
  const ticks = ganttTicks(layout.min, layout.max, scale)
  const span = layout.max - layout.min || day

  function setCell(id: string, key: string, value: string) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, [key]: value } : task)))
  }

  function onBarPointer(id: string, mode: "move" | "start" | "end", event: React.PointerEvent) {
    event.preventDefault()
    const task = tasks.find((item) => item.id === id)
    if (!task) return
    drag.current = { id, mode, originX: event.clientX, start: task.start, end: task.end }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onBarMove(event: React.PointerEvent, plotW: number) {
    const active = drag.current
    if (!active) return
    const days = Math.round(((event.clientX - active.originX) / plotW) * (span / day))
    if (active.mode === "move") {
      setCell(active.id, "start", addDays(active.start, days))
      setCell(active.id, "end", addDays(active.end, days))
    } else if (active.mode === "start") {
      setCell(active.id, "start", addDays(active.start, days))
    } else {
      setCell(active.id, "end", addDays(active.end, days))
    }
  }

  function onPaste(event: React.ClipboardEvent) {
    const text = event.clipboardData.getData("text/plain")
    const inferred = inferTable(text)
    if (!inferred || inferred.rows.length === 0) return
    event.preventDefault()
    setTasks(
      inferred.rows.map((row) =>
        ganttTask(row[0] ?? "Task", row[1] ?? "", row[2] ?? row[1] ?? "", { group: row[3] ?? "", progress: row[4] ?? "0" })
      )
    )
  }

  const csv = rowsToCsv(
    ["Task", "Start", "End", "Group", "Progress"],
    tasks.map((task) => [task.name, task.start, task.end, task.group, task.progress])
  )
  const empty = tasks.every((task) => !task.name.trim())
  const width = 860
  const left = 168
  const plotW = width - left - 24
  const rowH = 36
  const height = 56 + layout.items.length * rowH
  const todayX = left + ((today - layout.min) / span) * plotW

  const data = (
    <div className="flex flex-col gap-4" onPaste={onPaste}>
      <ExampleList
        examples={ganttExamples}
        onLoad={(next, title) => {
          setTasks(next.map((task) => ({ ...task, id: vizId() })))
          setMeta((current) => ({ ...current, title }))
        }}
      />
      <VizDataTable
        columns={[
          { key: "name", label: "Task", placeholder: "Design" },
          { key: "start", label: "Start", kind: "date" },
          { key: "end", label: "End", kind: "date" },
          { key: "group", label: "Group", placeholder: "Make" },
          { key: "progress", label: "%", kind: "number", width: "4rem" },
        ]}
        rows={tasks}
        get={(row, key) => String(row[key as keyof GanttTask] ?? "")}
        set={setCell}
        onAdd={() => setTasks((current) => [...current, ganttTask("New task", isoDate(layout.max), addDays(isoDate(layout.max), 5))])}
        onDelete={(id) => setTasks((current) => (current.length === 1 ? current : current.filter((task) => task.id !== id)))}
        onDuplicate={(id) =>
          setTasks((current) => {
            const index = current.findIndex((task) => task.id === id)
            if (index < 0) return current
            return [...current.slice(0, index + 1), { ...current[index], id: vizId() }, ...current.slice(index + 1)]
          })
        }
        onMove={(id, direction) =>
          setTasks((current) => {
            const index = current.findIndex((task) => task.id === id)
            const next = index + direction
            if (index < 0 || next < 0 || next >= current.length) return current
            const clone = [...current]
            const [item] = clone.splice(index, 1)
            clone.splice(next, 0, item)
            return clone
          })
        }
        addLabel="Add task"
      />
      <div className="flex flex-wrap items-center gap-3">
        {tasks.map((task) => (
          <label key={task.id} className="flex items-center gap-2 text-[12px] text-[var(--nb-secondary)]">
            <Switch
              size="sm"
              checked={task.milestone}
              onCheckedChange={(milestone) => setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, milestone } : item)))}
            />
            {task.name || "Task"} milestone
          </label>
        ))}
      </div>
      <Button type="button" variant="ghost" size="xs" onClick={() => setTasks([ganttTask("", "", "")])}>
        Clear
      </Button>
      <p className="text-[12px] text-[var(--nb-secondary)]">Paste columns of task, start, end. Drag a bar to move it; drag an end to resize.</p>
    </div>
  )

  const canvas = empty ? (
    <EmptyViz
      onExample={() => {
        setTasks(first.data.map((task) => ({ ...task, id: vizId() })))
        setMeta((current) => ({ ...current, title: first.title }))
      }}
      onManual={() => setTasks([ganttTask("Task", isoDate(Date.now()), addDays(isoDate(Date.now()), 7))])}
    />
  ) : (
    <ChartFrame ref={svgRef} width={width} height={height} theme={theme} meta={meta} description="Gantt chart">
      {ticks.map((tick) => {
        const x = left + ((tick.time - layout.min) / span) * plotW
        return (
          <g key={tick.time}>
            {style.showGrid ? <line x1={x} x2={x} y1={28} y2={height - 8} stroke={theme.grid} /> : null}
            <text x={x + 4} y={20} fill={theme.muted} fontSize={10}>
              {tick.label}
            </text>
          </g>
        )
      })}
      {todayX > left && todayX < width - 24 ? (
        <line x1={todayX} x2={todayX} y1={24} y2={height - 8} stroke={theme.ink} strokeDasharray="3 3" />
      ) : null}
      {layout.items.map((item, index) => {
        const y = 36 + index * rowH
        const x = left + ((item.start - layout.min) / span) * plotW
        const w = Math.max(item.milestone ? 10 : 8, ((item.end - item.start) / span) * plotW)
        const fill = seriesColor(theme, item.group ? Math.abs(item.group.length) % 4 : 0)
        return (
          <g key={item.id}>
            <text x={16} y={y + 14} fill={theme.ink} fontSize={style.labelSize} fontWeight={style.labelWeight}>
              {item.name}
            </text>
            {item.invalid ? (
              <text x={left} y={y + 14} fill={theme.muted} fontSize={11}>
                {item.invalid}
              </text>
            ) : item.milestone ? (
              <polygon
                points={`${x},${y + 4} ${x + 8},${y + 14} ${x},${y + 24} ${x - 8},${y + 14}`}
                fill={fill}
              />
            ) : (
              <g
                onPointerDown={(event) => onBarPointer(item.id, "move", event)}
                onPointerMove={(event) => onBarMove(event, plotW)}
                onPointerUp={() => {
                  drag.current = null
                }}
                style={{ cursor: "grab" }}
              >
                <rect x={x} y={y + 4} width={w} height={18} rx={4} fill={fill} opacity={0.2} />
                <rect x={x} y={y + 4} width={w * (item.progress / 100)} height={18} rx={4} fill={fill} />
                <rect
                  x={x - 3}
                  y={y + 4}
                  width={6}
                  height={18}
                  fill="transparent"
                  style={{ cursor: "ew-resize" }}
                  onPointerDown={(event) => onBarPointer(item.id, "start", event)}
                />
                <rect
                  x={x + w - 3}
                  y={y + 4}
                  width={6}
                  height={18}
                  fill="transparent"
                  style={{ cursor: "ew-resize" }}
                  onPointerDown={(event) => onBarPointer(item.id, "end", event)}
                />
                {style.showValues ? (
                  <text x={x + w + 6} y={y + 17} fill={theme.muted} fontSize={style.valueSize}>
                    {item.progress}%
                  </text>
                ) : null}
              </g>
            )}
          </g>
        )
      })}
    </ChartFrame>
  )

  return (
    <VizStudio
      filename="gantt-chart"
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
            <Segmented
              label="Scale"
              value={scale}
              options={[
                { id: "day", label: "Day" },
                { id: "week", label: "Week" },
                { id: "month", label: "Month" },
              ]}
              onChange={setScale}
            />
          }
        />
      }
    />
  )
}
