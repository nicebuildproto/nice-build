"use client"

import { useMemo } from "react"
import {
  applyDecrease,
  applyIncrease,
  parseNumber,
  percentOf,
  whatPercent,
  percentChange,
} from "@/lib/calculators/math"
import { useQueryFields } from "@/lib/calculators/query"
import type { PercentageMode } from "@/lib/calculators/content"

const defaults: Record<PercentageMode, Record<string, string>> = {
  basic: { part: "25", whole: "200", percent: "15", of: "200" },
  increase: { percent: "20", of: "50", from: "50", to: "60" },
  decrease: { percent: "15", of: "80", from: "80", to: "68" },
  discount: { percent: "25", of: "120", from: "120", to: "90" },
}

export function formatResult(value: number): string {
  return Number(value.toFixed(4)).toLocaleString("en-AU", { maximumFractionDigits: 4 })
}

export function usePercentage(mode: PercentageMode) {
  const fields = useQueryFields(defaults[mode])

  const whatPercentResult = useMemo(() => {
    const x = parseNumber(fields.values.part ?? "")
    const y = parseNumber(fields.values.whole ?? "")
    if (x === null || y === null) return null
    return whatPercent(x, y)
  }, [fields.values.part, fields.values.whole])

  const percentOfResult = useMemo(() => {
    const x = parseNumber(fields.values.percent ?? "")
    const y = parseNumber(fields.values.of ?? "")
    if (x === null || y === null) return null
    return percentOf(x, y)
  }, [fields.values.percent, fields.values.of])

  const change = useMemo(() => {
    if (mode === "basic") return { next: null, delta: null }
    const rate = parseNumber(fields.values.percent ?? "")
    const value = parseNumber(fields.values.of ?? "")
    if (rate === null || value === null) return { next: null, delta: null }
    return mode === "increase" ? applyIncrease(rate, value) : applyDecrease(rate, value)
  }, [mode, fields.values.percent, fields.values.of])

  const measured = useMemo(() => {
    const from = parseNumber(fields.values.from ?? "")
    const to = parseNumber(fields.values.to ?? "")
    if (from === null || to === null) return { percent: null, delta: null, from, to }
    return { percent: percentChange(from, to), delta: to - from, from, to }
  }, [fields.values.from, fields.values.to])

  return {
    values: fields.values,
    set: fields.set,
    setAll: fields.setAll,
    reset: fields.reset,
    dirty: fields.dirty,
    whatPercent: whatPercentResult,
    percentOf: percentOfResult,
    next: change.next,
    delta: change.delta,
    measured,
  }
}
