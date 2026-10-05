export function niceNumber(value: number): number {
  if (value <= 0) return 1
  const exp = Math.floor(Math.log10(value))
  const frac = value / 10 ** exp
  const nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10
  return nice * 10 ** exp
}

export function niceExtent(min: number, max: number, startAtZero: boolean): { min: number; max: number } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 }
  if (min === max) {
    if (min === 0) return { min: 0, max: 1 }
    return startAtZero && min > 0 ? { min: 0, max: niceNumber(max) } : { min: min - Math.abs(min) * 0.1, max: max + Math.abs(max) * 0.1 }
  }
  if (startAtZero && min >= 0) return { min: 0, max: niceNumber(max) }
  if (startAtZero && max <= 0) return { min: -niceNumber(-min), max: 0 }
  const pad = (max - min) * 0.08
  return { min: min - pad, max: max + pad }
}

export function ticks(min: number, max: number, count = 4): number[] {
  const span = max - min || 1
  const step = niceNumber(span / count)
  const start = Math.ceil(min / step) * step
  const values: number[] = []
  for (let value = start; value <= max + step / 1000; value += step) {
    values.push(Number(value.toFixed(8)))
  }
  return values.length > 0 ? values : [min, max]
}

export function formatValue(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—"
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${trimNum(value / 1_000_000, digits)}m`
  if (abs >= 10_000) return `${trimNum(value / 1_000, digits)}k`
  if (Number.isInteger(value)) return String(value)
  return trimNum(value, digits)
}

function trimNum(value: number, digits: number): string {
  return value.toLocaleString("en-AU", { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—"
  if (Math.abs(value) > 0 && Math.abs(value) < 10) {
    return `${value.toLocaleString("en-AU", { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`
  }
  return `${Math.round(value)}%`
}
