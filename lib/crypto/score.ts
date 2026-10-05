import type { Candle, ScanFlag, ScanInputs, ScoreBreakdown, Timeframe } from "./types"

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function candleWindow(candles: Candle[], now = Date.now()): Candle[] | null {
  const closed = candles.filter((candle) => candle.closeTime < now)
  if (closed.length < 21) return null
  return closed.slice(-21)
}

export function statsFromCandles(window: Candle[]): Pick<ScanInputs, "volRatio" | "priceChangePct" | "breakout"> | null {
  if (window.length < 21) return null
  const previous = window.slice(0, 20)
  const last = window[20]
  const meanQuote = previous.reduce((sum, candle) => sum + candle.quoteVolume, 0) / previous.length
  const volRatio = meanQuote > 0 ? last.quoteVolume / meanQuote : 0
  const priceChangePct = last.open !== 0 ? ((last.close - last.open) / last.open) * 100 : 0
  const highestHigh = previous.reduce((max, candle) => Math.max(max, candle.high), 0)
  const breakout = last.close > highestHigh
  return { volRatio, priceChangePct, breakout }
}

export function trendingSocial(rank: number | null, listSize: number) {
  if (rank === null || rank < 1 || listSize <= 0) return 0
  return clamp((listSize - rank + 1) / listSize, 0, 1)
}

export function redditSocial(mentions: number, peak: number) {
  if (mentions <= 0 || peak <= 0) return 0
  return clamp(Math.log2(mentions + 1) / Math.log2(peak + 1), 0, 1)
}

export function combinedSocial(trend: number, reddit: number) {
  return clamp(trend + reddit * 0.25, 0, 1)
}

export function scoreMomentum(input: ScanInputs): ScoreBreakdown {
  const log8 = Math.log2(8)
  const volScore = input.volRatio <= 0 ? 0 : clamp(Math.log2(input.volRatio) / log8, 0, 1) * 100
  const priceScore = clamp(input.priceChangePct / 8, 0, 1) * 100
  const breakoutScore = input.breakout ? 100 : 0
  const base = 0.5 * volScore + 0.3 * priceScore + 0.2 * breakoutScore
  const score = Math.min(100, base * (1 + 0.25 * clamp(input.social, 0, 1)))
  const flags: ScanFlag[] = []
  if (input.priceChangePct > 15) flags.push("Extended")
  if (input.quoteVolume24h < 1_000_000) flags.push("Low liquidity")
  if (input.trending) flags.push("Trending")
  return { volScore, priceScore, breakoutScore, base, score, flags }
}

export function formatRatio(value: number) {
  if (!Number.isFinite(value)) return "0x"
  return `${value.toFixed(1)}x`
}

export function formatPct(value: number) {
  const abs = Math.abs(value).toFixed(1)
  return value < 0 ? `down ${abs}%` : `up ${abs}%`
}

export function momentumReason(input: {
  timeframe: Timeframe
  volRatio: number
  priceChangePct: number
  breakout: boolean
  trending: boolean
  limited?: boolean
}) {
  if (input.limited) {
    const parts = [`${formatPct(input.priceChangePct)} over 24h on CoinGecko`]
    if (input.trending) parts.push("trending on CoinGecko")
    parts.push("short-timeframe volume is limited")
    return parts.join(", ") + "."
  }
  const parts = [`Volume ${formatRatio(input.volRatio)} average`, formatPct(input.priceChangePct) + ` in ${input.timeframe}`]
  if (input.breakout) parts.push("breaking 20-candle high")
  if (input.trending) parts.push("trending on CoinGecko")
  return parts.join(", ") + "."
}
