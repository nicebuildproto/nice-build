export function parseNumber(value: string): number | null {
  if (value.trim() === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function formatFigure(value: number, digits = 4): string {
  return Number(value.toFixed(digits)).toLocaleString("en-AU", { maximumFractionDigits: digits })
}

export function whatPercent(part: number, whole: number): number | null {
  if (whole === 0) return null
  return (part / whole) * 100
}

export function percentOf(percent: number, value: number): number {
  return (percent / 100) * value
}

export function applyIncrease(percent: number, value: number) {
  const delta = percentOf(percent, value)
  return { next: value + delta, delta }
}

export function applyDecrease(percent: number, value: number) {
  const delta = percentOf(percent, value)
  return { next: value - delta, delta }
}

export function percentChange(from: number, to: number): number | null {
  if (from === 0) return null
  return ((to - from) / from) * 100
}

export function tipSplit(bill: number, tipPercent: number, people: number) {
  if (!(people > 0)) return null
  const tipAmount = bill * (tipPercent / 100)
  const total = bill + tipAmount
  return { tipAmount, total, each: total / people }
}
