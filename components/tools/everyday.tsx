"use client"

import { TextArea } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEffect, useMemo, useState } from "react"

export function Countdown() {
  const [when, setWhen] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    date.setHours(9, 0, 0, 0)
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 16)
  })
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const parts = useMemo(() => {
    const target = new Date(when).getTime()
    if (Number.isNaN(target)) return null
    const delta = target - now
    const past = delta < 0
    const abs = Math.abs(delta)
    return {
      past,
      days: Math.floor(abs / 86400000),
      hours: Math.floor(abs / 3600000) % 24,
      minutes: Math.floor(abs / 60000) % 60,
      seconds: Math.floor(abs / 1000) % 60,
    }
  }, [when, now])

  return (
    <div className="flex flex-col gap-8">
      <label className="flex max-w-xs flex-col gap-2 text-[13px]">
        Date and time
        <Input type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} className="h-10" />
      </label>
      {parts ? (
        <>
          <p className="text-sm text-[var(--nb-secondary)]">{parts.past ? "That moment has passed." : "Time remaining"}</p>
          <div className="flex flex-wrap gap-8">
            <Count label="Days" value={parts.days} />
            <Count label="Hours" value={parts.hours} />
            <Count label="Minutes" value={parts.minutes} />
            <Count label="Seconds" value={parts.seconds} />
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Choose a valid date.</p>
      )}
    </div>
  )
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-4xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-[var(--nb-secondary)]">{label}</div>
    </div>
  )
}

export function NamePicker() {
  const [list, setList] = useState("Ava\nNoah\nMia\nLeo\nSofia")
  const [drawn, setDrawn] = useState<string | null>(null)
  const [remove, setRemove] = useState(true)
  const names = list
    .split("\n")
    .map((name) => name.trim())
    .filter(Boolean)

  function draw() {
    if (names.length === 0) return
    const index = Math.floor(Math.random() * names.length)
    const name = names[index]
    setDrawn(name)
    if (remove) {
      const next = names.filter((_, item) => item !== index)
      setList(next.join("\n"))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <TextArea label="Names, one per line" value={list} onChange={setList} rows={8} />
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={remove} onChange={(event) => setRemove(event.target.checked)} />
        Remove a name after it is drawn
      </label>
      <div className="flex items-center gap-4">
        <Button type="button" onClick={draw} disabled={names.length === 0}>
          Draw a name
        </Button>
        <span className="text-sm text-[var(--nb-secondary)]">{names.length} remaining</span>
      </div>
      <p className="text-5xl font-semibold tracking-[-0.04em]">{drawn ?? "—"}</p>
    </div>
  )
}
