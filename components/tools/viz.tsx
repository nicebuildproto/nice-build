"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { num } from "@/lib/tools/format"
import { useMemo, useState } from "react"

type Stage = { id: number; label: string; value: string }

export function FunnelChart() {
  const [stages, setStages] = useState<Stage[]>([
    { id: 1, label: "Visits", value: "1000" },
    { id: 2, label: "Signups", value: "420" },
    { id: 3, label: "Trials", value: "140" },
    { id: 4, label: "Paid", value: "36" },
  ])
  const rows = useMemo(() => {
    const parsed = stages.map((stage) => ({ ...stage, n: Number(stage.value) }))
    const top = parsed[0]?.n || 0
    return parsed.map((stage, index) => {
      const previous = index === 0 ? stage.n : parsed[index - 1].n
      return {
        ...stage,
        ofTop: top > 0 && Number.isFinite(stage.n) ? (stage.n / top) * 100 : 0,
        ofPrev: previous > 0 && Number.isFinite(stage.n) ? (stage.n / previous) * 100 : 0,
      }
    })
  }, [stages])

  function update(id: number, patch: Partial<Stage>) {
    setStages((current) => current.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage)))
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-3">
        {rows.map((stage, index) => (
          <li key={stage.id} className="grid items-center gap-3 sm:grid-cols-[9rem_6rem_1fr_auto]">
            <Input value={stage.label} onChange={(event) => update(stage.id, { label: event.target.value })} className="h-10" />
            <Input
              inputMode="decimal"
              value={stage.value}
              onChange={(event) => update(stage.id, { value: event.target.value })}
              className="h-10 tabular-nums"
            />
            <div className="h-8 overflow-hidden rounded-md bg-[var(--nb-accent)]">
              <div className="h-full bg-[var(--nb-primary)]" style={{ width: `${Math.max(0, Math.min(100, stage.ofTop))}%` }} />
            </div>
            <span className="text-[13px] text-[var(--nb-secondary)] tabular-nums">
              {index === 0 ? `${num(stage.ofTop, 0)}%` : `${num(stage.ofPrev, 0)}% of previous`}
            </span>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        onClick={() => setStages((current) => [...current, { id: Date.now(), label: "Stage", value: "0" }])}
      >
        Add stage
      </Button>
    </div>
  )
}

type Task = { id: number; name: string; start: string; end: string }

export function GanttChart() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, name: "Foundations", start: "2026-10-06", end: "2026-10-17" },
    { id: 2, name: "Frame", start: "2026-10-18", end: "2026-11-06" },
    { id: 3, name: "Fit-off", start: "2026-11-07", end: "2026-11-21" },
  ])
  const span = useMemo(() => {
    const starts = tasks.map((task) => new Date(task.start).getTime()).filter((time) => !Number.isNaN(time))
    const ends = tasks.map((task) => new Date(task.end).getTime()).filter((time) => !Number.isNaN(time))
    if (starts.length === 0 || ends.length === 0) return null
    const min = Math.min(...starts)
    const max = Math.max(...ends)
    return { min, max: Math.max(max, min + 86400000) }
  }, [tasks])

  function update(id: number, patch: Partial<Task>) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)))
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-4">
        {tasks.map((task) => {
          const start = new Date(task.start).getTime()
          const end = new Date(task.end).getTime()
          const left = span && !Number.isNaN(start) ? ((start - span.min) / (span.max - span.min)) * 100 : 0
          const width = span && !Number.isNaN(end) ? (Math.max(end - start, 0) / (span.max - span.min)) * 100 : 0
          return (
            <li key={task.id} className="grid gap-3 lg:grid-cols-[12rem_1fr]">
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                <Input value={task.name} onChange={(event) => update(task.id, { name: event.target.value })} className="h-10" />
                <Input type="date" value={task.start} onChange={(event) => update(task.id, { start: event.target.value })} className="h-10" />
                <Input type="date" value={task.end} onChange={(event) => update(task.id, { end: event.target.value })} className="h-10" />
              </div>
              <div className="relative h-10 self-center rounded-md bg-[var(--nb-accent)]">
                <div
                  className="absolute top-1 bottom-1 rounded-md bg-[var(--nb-primary)]"
                  style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        onClick={() =>
          setTasks((current) => [
            ...current,
            { id: Date.now(), name: "New task", start: "2026-11-22", end: "2026-11-28" },
          ])
        }
      >
        Add task
      </Button>
    </div>
  )
}
