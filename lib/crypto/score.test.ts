import assert from "node:assert/strict"
import test from "node:test"
import {
  candleWindow,
  combinedSocial,
  momentumReason,
  redditSocial,
  scoreMomentum,
  statsFromCandles,
  trendingSocial,
} from "./score.ts"
import { isSpotUsdtCandidate, selectUniverse } from "./universe.ts"
import type { Candle } from "./types.ts"

function candles(overrides: Partial<Candle>[] = []): Candle[] {
  const rows: Candle[] = []
  for (let i = 0; i < 22; i += 1) {
    const extra = overrides[i] ?? {}
    rows.push({
      open: 100,
      high: 101,
      close: 100.5,
      quoteVolume: 1_000,
      closeTime: 1_000 + i,
      ...extra,
    })
  }
  return rows
}

test("volume 8x, +8% and a breakout scores 100 before social", () => {
  const result = scoreMomentum({
    volRatio: 8,
    priceChangePct: 8,
    breakout: true,
    social: 0,
    quoteVolume24h: 5_000_000,
    trending: false,
  })
  assert.equal(result.volScore, 100)
  assert.equal(result.priceScore, 100)
  assert.equal(result.breakoutScore, 100)
  assert.equal(result.score, 100)
})

test("social only multiplies an existing base and never invents a score", () => {
  const quiet = scoreMomentum({
    volRatio: 1,
    priceChangePct: 0,
    breakout: false,
    social: 1,
    quoteVolume24h: 5_000_000,
    trending: true,
  })
  assert.equal(quiet.volScore, 0)
  assert.equal(quiet.score, 0)
  assert.deepEqual(quiet.flags, ["Trending"])

  const moving = scoreMomentum({
    volRatio: 8,
    priceChangePct: 0,
    breakout: false,
    social: 1,
    quoteVolume24h: 5_000_000,
    trending: true,
  })
  assert.equal(moving.score, 62.5)
})

test("negative price change scores 0 on the price leg", () => {
  const result = scoreMomentum({
    volRatio: 1,
    priceChangePct: -4,
    breakout: false,
    social: 0,
    quoteVolume24h: 100_000,
    trending: false,
  })
  assert.equal(result.priceScore, 0)
  assert.deepEqual(result.flags, ["Low liquidity"])
})

test("extended flag trips above 15% on the window", () => {
  const result = scoreMomentum({
    volRatio: 2,
    priceChangePct: 16,
    breakout: false,
    social: 0,
    quoteVolume24h: 2_000_000,
    trending: false,
  })
  assert.ok(result.flags.includes("Extended"))
  assert.equal(result.priceScore, 100)
})

test("candle window drops the open bar and scores the last closed vs previous 20", () => {
  const rows = candles()
  rows[21] = { open: 100, high: 140, close: 130, quoteVolume: 8_000, closeTime: 9_999 }
  const window = candleWindow(rows, 2_000)
  assert.ok(window)
  assert.equal(window.length, 21)
  const stats = statsFromCandles(window)
  assert.ok(stats)
  assert.equal(stats.volRatio, 1)
  assert.ok(Math.abs(stats.priceChangePct - 0.5) < 1e-9)
  assert.equal(stats.breakout, false)
})

test("breakout is close above the prior 20 highs", () => {
  const rows = candles()
  for (let i = 0; i < 20; i += 1) rows[i].high = 110
  rows[20] = { open: 100, high: 120, close: 111, quoteVolume: 4_000, closeTime: 1_020 }
  const stats = statsFromCandles(rows.slice(0, 21))
  assert.ok(stats)
  assert.equal(stats.breakout, true)
  assert.equal(stats.volRatio, 4)
})

test("trending rank 1 is 1, last rank is the smallest positive slice", () => {
  assert.equal(trendingSocial(1, 15), 1)
  assert.equal(trendingSocial(15, 15), 1 / 15)
  assert.equal(trendingSocial(null, 15), 0)
})

test("reddit mentions scale with log and combine as a mild add-on", () => {
  assert.equal(redditSocial(0, 10), 0)
  assert.ok(redditSocial(10, 10) > redditSocial(2, 10))
  assert.equal(combinedSocial(0.8, 1), 1)
  assert.ok(combinedSocial(0.4, 0.8) > 0.4)
})

test("reason sentence includes volume, move, breakout and trend", () => {
  const text = momentumReason({
    timeframe: "15m",
    volRatio: 4.2,
    priceChangePct: 5.1,
    breakout: true,
    trending: true,
  })
  assert.equal(text, "Volume 4.2x average, up 5.1% in 15m, breaking 20-candle high, trending on CoinGecko.")
})

test("universe keeps spot USDT and drops stables and leveraged tokens", () => {
  assert.equal(isSpotUsdtCandidate("BTCUSDT"), true)
  assert.equal(isSpotUsdtCandidate("USDCUSDT"), false)
  assert.equal(isSpotUsdtCandidate("ETHUPUSDT"), false)
  assert.equal(isSpotUsdtCandidate("BTCDOWNUSDT"), false)
  const picked = selectUniverse(
    [
      { symbol: "AAAUSDT", lastPrice: 1, quoteVolume: 5, priceChangePercent: 1 },
      { symbol: "BTCUSDT", lastPrice: 1, quoteVolume: 100, priceChangePercent: 1 },
      { symbol: "ETHUSDT", lastPrice: 1, quoteVolume: 80, priceChangePercent: 1 },
      { symbol: "USDCUSDT", lastPrice: 1, quoteVolume: 200, priceChangePercent: 0 },
    ],
    10,
    60,
  )
  assert.deepEqual(
    picked.map((row) => row.symbol),
    ["BTCUSDT", "ETHUSDT"],
  )
})
