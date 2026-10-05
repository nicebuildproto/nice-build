"use client"

import { CopyButton, ResetButton, ToolNote, selectClass } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { formatHour, overlapHours, plannerGrid, zoneCities } from "@/lib/tools/timezone-planner"
import { useMemo, useState } from "react"

function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

export function TimeZoneMeetingPlanner() {
  const [date, setDate] = useState(todayIso)
  const [zones, setZones] = useState(["syd", "lon", "nyc"])
  const [pick, setPick] = useState("tok")
  const rows = useMemo(() => plannerGrid(date, zones), [date, zones])
  const overlap = useMemo(() => overlapHours(rows), [rows])

  return (
    <div className="flex flex-col gap-6">
      <ToolNote>
        Pick a date and a few cities. Each cell is that city’s local time. Green hours sit in a 9:00–17:00 window for every selected place. Day shifts show as +1 or −1.
      </ToolNote>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2 text-[13px]">
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm" />
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          Add a city
          <select className={selectClass} value={pick} onChange={(event) => setPick(event.target.value)}>
            {zoneCities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.city}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          className="h-10"
          onClick={() => setZones((current) => (current.includes(pick) ? current : [...current, pick]))}
        >
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {rows.map((row) => (
          <button
            key={row.city.id}
            type="button"
            className="rounded-full border border-border px-3 py-1 text-[13px]"
            onClick={() => setZones((current) => current.filter((id) => id !== row.city.id))}
          >
            {row.city.city} ×
          </button>
        ))}
      </div>
      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-[720px] w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[var(--nb-accent)] text-left">
                <th className="sticky left-0 bg-[var(--nb-accent)] px-2 py-2">City</th>
                {Array.from({ length: 24 }, (_, hour) => (
                  <th key={hour} className={`px-1 py-2 text-center tabular-nums ${overlap.includes(hour) ? "text-[var(--nb-primary)]" : "text-[var(--nb-secondary)]"}`}>
                    {formatHour(hour)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.city.id} className="border-t border-border">
                  <th className="sticky left-0 bg-background px-2 py-2 text-left font-medium">
                    {row.city.city}
                    {rowIndex === 0 ? <span className="block text-[10px] font-normal text-[var(--nb-secondary)]">grid</span> : null}
                  </th>
                  {row.cells.map((cell) => (
                    <td
                      key={cell.hour}
                      className={`px-1 py-2 text-center tabular-nums ${overlap.includes(cell.hour) ? "bg-emerald-500/15 font-medium" : cell.work ? "bg-[var(--nb-accent)]" : ""}`}
                    >
                      {String(cell.localHour).padStart(2, "0")}
                      {cell.offsetDays ? (
                        <span className="block text-[10px] text-[var(--nb-secondary)]">
                          {cell.offsetDays > 0 ? `+${cell.offsetDays}` : cell.offsetDays}
                        </span>
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Add at least one city.</p>
      )}
      <p className="text-sm text-[var(--nb-secondary)]">
        {overlap.length
          ? `Overlap in everyone’s 9:00–17:00: ${overlap.map((hour) => formatHour(hour)).join(", ")} (times in the first city).`
          : "No hour sits inside 9:00–17:00 for every city. Try fewer places, or look for the paler local-work cells."}
      </p>
      <div className="flex flex-wrap gap-2">
        <CopyButton
          text={rows
            .map((row) => `${row.city.city}: ${row.cells.filter((cell) => overlap.includes(cell.hour)).map((cell) => `${String(cell.localHour).padStart(2, "0")}:00`).join(", ")}`)
            .join("\n")}
          label="Copy overlap"
        />
        <ResetButton onClick={() => setZones(["syd", "lon", "nyc"])} />
      </div>
    </div>
  )
}
