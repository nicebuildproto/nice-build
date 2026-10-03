"use client"

import { TextArea } from "@/components/tools/ui"
import { useMemo, useState } from "react"

type ChartKind = "bar" | "line" | "pie" | "flow" | "timeline" | "diagram"

const samples: Record<ChartKind, string> = {
  bar: "Design, 12\nBuild, 18\nReview, 7",
  line: "Mon, 4\nTue, 6\nWed, 5\nThu, 9",
  pie: "Search, 40\nDirect, 25\nEmail, 15",
  flow: "Collect the numbers\nCheck the edge cases\nShip the tool",
  timeline: "2026-01 — First sketch\n2026-04 — Private beta\n2026-10 — Public tools",
  diagram: "Brief -> Design\nDesign -> Build\nBuild -> Review",
}

const ink = ["#111111", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8"]

export function BarChartGenerator() {
  return <ChartStudio kind="bar" />
}
export function LineChartGenerator() {
  return <ChartStudio kind="line" />
}
export function PieChartGenerator() {
  return <ChartStudio kind="pie" />
}
export function FlowchartGenerator() {
  return <ChartStudio kind="flow" />
}
export function TimelineGenerator() {
  return <ChartStudio kind="timeline" />
}
export function DiagramGenerator() {
  return <ChartStudio kind="diagram" />
}

function ChartStudio({ kind }: { kind: ChartKind }) {
  const [text, setText] = useState(samples[kind])
  const rows = useMemo(() => parseRows(text), [text])

  return (
    <div className="flex flex-col gap-8">
      <TextArea label={kind === "diagram" ? "Links" : "Data"} value={text} onChange={setText} rows={6} />
      {kind === "bar" ? <Bars rows={rows} /> : null}
      {kind === "line" ? <Line rows={rows} /> : null}
      {kind === "pie" ? <Pie rows={rows} /> : null}
      {kind === "flow" ? <Flow text={text} /> : null}
      {kind === "timeline" ? <Timeline text={text} /> : null}
      {kind === "diagram" ? <Diagram text={text} /> : null}
    </div>
  )
}

function parseRows(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.*?)[,:\s]+(-?\d+(?:\.\d+)?)$/)
      return { label: (match?.[1] ?? line).trim(), value: Number(match?.[2] ?? 0) }
    })
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1)
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-sm">
          <span className="truncate text-[var(--nb-secondary)]">{row.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-[var(--nb-accent)]">
            <span className="block h-full rounded-full bg-[var(--nb-primary)]" style={{ width: `${(row.value / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function Line({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1)
  const min = Math.min(...rows.map((row) => row.value), 0)
  const points = rows
    .map((row, index) => {
      const x = rows.length === 1 ? 160 : (index / (rows.length - 1)) * 320
      const y = 140 - ((row.value - min) / (max - min || 1)) * 120
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg viewBox="0 0 320 160" className="w-full text-[var(--nb-primary)]">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
    </svg>
  )
}

function Pie({ rows }: { rows: { label: string; value: number }[] }) {
  const total = rows.reduce((sum, row) => sum + Math.max(0, row.value), 0) || 1
  let cursor = 0
  const stops = rows.map((row, index) => {
    const start = cursor
    cursor += (Math.max(0, row.value) / total) * 100
    return `${ink[index % ink.length]} ${start}% ${cursor}%`
  })
  return (
    <div className="flex flex-wrap items-center gap-8">
      <div className="size-40 rounded-full" style={{ background: `conic-gradient(${stops.join(", ")})` }} />
      <ul className="flex flex-col gap-2 text-sm">
        {rows.map((row, index) => (
          <li key={row.label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: ink[index % ink.length] }} />
            {row.label}
            <span className="text-[var(--nb-secondary)] tabular-nums">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Flow({ text }: { text: string }) {
  const steps = text.split("\n").map((line) => line.trim()).filter(Boolean)
  return (
    <div className="flex flex-col items-center gap-2">
      {steps.map((step, index) => (
        <div key={`${step}-${index}`} className="flex flex-col items-center gap-2">
          <div className="rounded-xl border border-border px-4 py-3 text-sm">{step}</div>
          {index < steps.length - 1 ? <span className="h-5 w-px bg-border" /> : null}
        </div>
      ))}
    </div>
  )
}

function Timeline({ text }: { text: string }) {
  const events = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [when, ...rest] = line.split("—")
      return { when: when.trim(), note: rest.join("—").trim() || when.trim() }
    })
  return (
    <ol className="flex flex-col gap-5 border-l border-border pl-5">
      {events.map((event) => (
        <li key={event.when + event.note} className="relative">
          <span className="absolute top-1.5 -left-[1.4rem] size-2 rounded-full bg-[var(--nb-primary)]" />
          <div className="text-xs text-[var(--nb-secondary)]">{event.when}</div>
          <div className="text-sm">{event.note}</div>
        </li>
      ))}
    </ol>
  )
}

function Diagram({ text }: { text: string }) {
  const links = text
    .split("\n")
    .map((line) => line.split("->").map((part) => part.trim()))
    .filter((parts) => parts.length === 2 && parts[0] && parts[1])
  return (
    <div className="flex flex-col gap-3">
      {links.map(([from, to]) => (
        <div key={`${from}-${to}`} className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-lg border border-border px-3 py-2">{from}</span>
          <span className="text-[var(--nb-secondary)]">→</span>
          <span className="rounded-lg border border-border px-3 py-2">{to}</span>
        </div>
      ))}
    </div>
  )
}
