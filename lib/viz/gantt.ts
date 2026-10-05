import { parseNumber } from "./parse"
import type { GanttTask } from "./examples"

const day = 86_400_000

export type GanttLayoutTask = {
  id: string
  name: string
  group: string
  start: number
  end: number
  progress: number
  milestone: boolean
  dependsOn: string
  invalid: string | null
}

export function layoutGantt(tasks: GanttTask[]): {
  items: GanttLayoutTask[]
  min: number
  max: number
} {
  const items = tasks.map((task) => {
    const start = Date.parse(`${task.start}T00:00:00`)
    const end = Date.parse(`${task.end}T00:00:00`)
    const progress = Math.min(100, Math.max(0, parseNumber(task.progress) ?? 0))
    let invalid: string | null = null
    if (Number.isNaN(start) || Number.isNaN(end)) invalid = "Needs a start and end date."
    else if (end < start) invalid = "End is before start."
    return {
      id: task.id,
      name: task.name.trim() || "Task",
      group: task.group.trim(),
      start: Number.isNaN(start) ? 0 : start,
      end: Number.isNaN(end) ? 0 : end,
      progress,
      milestone: task.milestone || task.start === task.end,
      dependsOn: task.dependsOn,
      invalid,
    }
  })
  const valid = items.filter((item) => !item.invalid)
  const min = valid.length ? Math.min(...valid.map((item) => item.start)) : Date.now()
  const max = valid.length ? Math.max(...valid.map((item) => item.end), min + day) : min + day * 14
  return { items, min, max: Math.max(max, min + day) }
}

export type GanttScale = "day" | "week" | "month"

export function ganttTicks(min: number, max: number, scale: GanttScale): { time: number; label: string }[] {
  const ticks: { time: number; label: string }[] = []
  const start = new Date(min)
  start.setHours(0, 0, 0, 0)
  if (scale === "month") start.setDate(1)
  if (scale === "week") start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const cursor = new Date(start)
  const step = scale === "day" ? 1 : scale === "week" ? 7 : 0
  while (cursor.getTime() <= max) {
    const time = cursor.getTime()
    const label =
      scale === "month"
        ? cursor.toLocaleDateString("en-AU", { month: "short", year: "numeric" })
        : cursor.toLocaleDateString("en-AU", { day: "numeric", month: "short" })
    ticks.push({ time, label })
    if (scale === "month") cursor.setMonth(cursor.getMonth() + 1)
    else cursor.setDate(cursor.getDate() + step)
    if (ticks.length > 48) break
  }
  return ticks
}

export function isoDate(time: number): string {
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function addDays(iso: string, days: number): string {
  const time = Date.parse(`${iso}T00:00:00`)
  if (Number.isNaN(time)) return iso
  return isoDate(time + days * day)
}
