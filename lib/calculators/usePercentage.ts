"use client"

import { useMemo, useState } from "react"

export type PercentageMode = "basic" | "increase" | "decrease" | "discount"

export function parseNumber(value: string): number | null {
  if (value.trim() === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function formatResult(value: number): string {
  return Number(value.toFixed(4)).toLocaleString("en-AU", { maximumFractionDigits: 4 })
}

export function whatPercent(part: number, whole: number): number | null {
  if (whole === 0) return null
  return (part / whole) * 100
}

export function percentOf(percent: number, value: number): number {
  return (percent / 100) * value
}

export function applyChange(
  mode: Exclude<PercentageMode, "basic">,
  percent: number,
  value: number
): { next: number; delta: number } {
  const delta = percentOf(percent, value)
  if (mode === "increase") return { next: value + delta, delta }
  return { next: value - delta, delta }
}

export function usePercentage(mode: PercentageMode) {
  const [part, setPart] = useState("")
  const [whole, setWhole] = useState("")
  const [percent, setPercent] = useState("")
  const [ofValue, setOfValue] = useState("")

  const whatPercentResult = useMemo(() => {
    const x = parseNumber(part)
    const y = parseNumber(whole)
    if (x === null || y === null) return null
    return whatPercent(x, y)
  }, [part, whole])

  const percentOfResult = useMemo(() => {
    const x = parseNumber(percent)
    const y = parseNumber(ofValue)
    if (x === null || y === null) return null
    return percentOf(x, y)
  }, [percent, ofValue])

  const change = useMemo(() => {
    if (mode === "basic") return { next: null, delta: null }
    const rate = parseNumber(percent)
    const value = parseNumber(ofValue)
    if (rate === null || value === null) return { next: null, delta: null }
    return applyChange(mode, rate, value)
  }, [mode, percent, ofValue])

  return {
    part,
    setPart,
    whole,
    setWhole,
    percent,
    setPercent,
    ofValue,
    setOfValue,
    whatPercent: whatPercentResult,
    percentOf: percentOfResult,
    next: change.next,
    delta: change.delta,
  }
}
