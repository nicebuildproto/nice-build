import { money, num, percent } from "../tools/format"

export { money, num, percent }

export function roundCents(value: number) {
  if (!Number.isFinite(value)) return 0
  const cents = value * 100
  return (Math.sign(cents) * Math.round(Math.abs(cents) + 1e-8)) / 100
}

export function parseMoney(value: string) {
  const trimmed = value.trim().replace(/[$,\s]/g, "")
  if (trimmed === "") return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

export function parseRate(value: string) {
  const parsed = parseMoney(value)
  if (parsed === null) return null
  return parsed
}

export function lineTotal(qty: number, rate: number) {
  return roundCents(qty * rate)
}

export type DocTotals = {
  subtotal: number
  tax: number
  total: number
}

export function documentTotals(lines: { qty: number; rate: number }[], taxPercent: number, inclusive: boolean): DocTotals {
  const sum = roundCents(lines.reduce((total, line) => total + lineTotal(line.qty, line.rate), 0))
  const rate = Number.isFinite(taxPercent) ? Math.max(0, taxPercent) / 100 : 0
  if (rate === 0) return { subtotal: sum, tax: 0, total: sum }
  if (inclusive) {
    const subtotal = roundCents(sum / (1 + rate))
    const tax = roundCents(sum - subtotal)
    return { subtotal, tax, total: sum }
  }
  const tax = roundCents(sum * rate)
  return { subtotal: sum, tax, total: roundCents(sum + tax) }
}

export type MarginResult = {
  cost: number
  price: number
  profit: number
  margin: number | null
  markup: number | null
}

export function marginFromPrices(cost: number, price: number): MarginResult {
  const profit = roundCents(price - cost)
  return {
    cost,
    price,
    profit,
    margin: price === 0 ? null : (profit / price) * 100,
    markup: cost === 0 ? null : (profit / cost) * 100,
  }
}

export function priceFromMargin(cost: number, marginPercent: number) {
  if (!Number.isFinite(cost) || !Number.isFinite(marginPercent)) return null
  if (marginPercent >= 100) return null
  return roundCents(cost / (1 - marginPercent / 100))
}

export function priceFromMarkup(cost: number, markupPercent: number) {
  if (!Number.isFinite(cost) || !Number.isFinite(markupPercent)) return null
  return roundCents(cost * (1 + markupPercent / 100))
}

export function explainMargin(result: MarginResult) {
  if (result.profit > 0 && result.margin !== null) {
    return `You're making ${money(result.profit)} gross profit on a ${money(result.price)} sale, which is a ${percent(result.margin)} margin.`
  }
  if (result.profit === 0) {
    return `Cost and selling price are the same, so there is no profit, margin, or markup.`
  }
  if (result.margin !== null) {
    return `The selling price is ${money(Math.abs(result.profit))} below cost, a ${percent(result.margin)} margin — that's a loss.`
  }
  return "Enter a selling price greater than zero to see margin."
}

export type BreakEvenResult =
  | { ok: true; contribution: number; units: number; revenue: number }
  | { ok: false; note: string }

export function breakEven(fixed: number, price: number, variable: number): BreakEvenResult {
  const contribution = roundCents(price - variable)
  if (contribution <= 0) {
    return { ok: false, note: "The price needs to be higher than the variable cost, or every sale adds to the loss." }
  }
  const units = Math.ceil(fixed / contribution)
  return { ok: true, contribution, units, revenue: roundCents(units * price) }
}

export function commissionOn(sales: number, ratePercent: number) {
  return roundCents(sales * (ratePercent / 100))
}

export function platformFee(amount: number, percentValue: number, fixed: number) {
  const fee = roundCents(amount * (percentValue / 100) + fixed)
  return { fee, net: roundCents(amount - fee) }
}
