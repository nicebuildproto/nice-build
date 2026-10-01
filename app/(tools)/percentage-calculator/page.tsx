"use client"

import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useMemo, useState } from "react"

function parseNumber(value: string): number | null {
  if (value.trim() === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function formatResult(value: number | null, suffix = ""): string {
  if (value === null) return "—"
  return `${Number(value.toFixed(4))}${suffix}`
}

export default function PercentageCalculatorPage() {
  const [part, setPart] = useState("")
  const [whole, setWhole] = useState("")
  const [percent, setPercent] = useState("")
  const [ofValue, setOfValue] = useState("")

  const whatPercent = useMemo(() => {
    const x = parseNumber(part)
    const y = parseNumber(whole)
    if (x === null || y === null || y === 0) return null
    return (x / y) * 100
  }, [part, whole])

  const percentOf = useMemo(() => {
    const x = parseNumber(percent)
    const y = parseNumber(ofValue)
    if (x === null || y === null) return null
    return (x / 100) * y
  }, [percent, ofValue])

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-10 px-6 py-16">
      <div className="space-y-3">
        <Link
          href="/"
          className="text-sm text-[var(--nb-secondary)] hover:text-[var(--nb-primary)]"
        >
          Nice Build
        </Link>
        <h1 className="text-2xl font-medium tracking-tight text-[var(--nb-primary)]">
          Percentage Calculator
        </h1>
        <p className="text-sm text-[var(--nb-secondary)]">
          Results update as you type.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-[var(--nb-primary)]">
          X is what percent of Y
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 text-sm text-[var(--nb-secondary)]">
            X
            <Input
              type="number"
              inputMode="decimal"
              value={part}
              onChange={(event) => setPart(event.target.value)}
            />
          </label>
          <label className="space-y-1.5 text-sm text-[var(--nb-secondary)]">
            Y
            <Input
              type="number"
              inputMode="decimal"
              value={whole}
              onChange={(event) => setWhole(event.target.value)}
            />
          </label>
        </div>
        <p className="text-lg text-[var(--nb-primary)]">
          {formatResult(whatPercent, "%")}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-[var(--nb-primary)]">
          What is X% of Y
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 text-sm text-[var(--nb-secondary)]">
            X%
            <Input
              type="number"
              inputMode="decimal"
              value={percent}
              onChange={(event) => setPercent(event.target.value)}
            />
          </label>
          <label className="space-y-1.5 text-sm text-[var(--nb-secondary)]">
            Y
            <Input
              type="number"
              inputMode="decimal"
              value={ofValue}
              onChange={(event) => setOfValue(event.target.value)}
            />
          </label>
        </div>
        <p className="text-lg text-[var(--nb-primary)]">
          {formatResult(percentOf)}
        </p>
      </section>
    </main>
  )
}
