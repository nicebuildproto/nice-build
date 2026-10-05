import { fetchBinanceTickers, fetchKlinesPool } from "./binance"
import { fetchMarkets, fetchTrending, type MarketCoin } from "./coingecko"
import { redditMentions } from "./reddit"
import {
  candleWindow,
  combinedSocial,
  momentumReason,
  redditSocial,
  scoreMomentum,
  statsFromCandles,
  trendingSocial,
} from "./score"
import type { ScanQuery, ScanResponse, ScanRow, ScanSource, Timeframe } from "./types"
import { KLINE_INTERVAL } from "./types"
import { baseFromUsdtSymbol, isSpotUsdtCandidate, selectUniverse, type Ticker24h } from "./universe"

const FALLBACK_NOTICE =
  "Binance short-timeframe data was unavailable, so this scan uses 24-hour CoinGecko movers only."

function nameMap(markets: MarketCoin[], trending: { symbol: string; name: string }[]) {
  const names = new Map<string, string>()
  for (const market of markets) {
    const symbol = market.symbol.trim().toUpperCase()
    if (symbol && market.name) names.set(symbol, market.name)
  }
  for (const hit of trending) names.set(hit.symbol, hit.name)
  return names
}

function trendRank(trending: { symbol: string; rank: number }[]) {
  return new Map(trending.map((hit) => [hit.symbol, hit.rank]))
}

function sortRows(rows: ScanRow[], sortBy: ScanQuery["sortBy"]) {
  const copy = [...rows]
  copy.sort((a, b) => {
    if (sortBy === "volume") return b.quoteVolume24h - a.quoteVolume24h
    if (sortBy === "change") return b.priceChangePct - a.priceChangePct
    return b.score - a.score
  })
  return copy.map((row, index) => ({ ...row, rank: index + 1 }))
}

function peakMentions(mentions: Record<string, number>) {
  return Object.values(mentions).reduce((max, value) => Math.max(max, value), 0)
}

function buildRow(input: {
  ticker: Ticker24h
  price: number
  stats: { volRatio: number; priceChangePct: number; breakout: boolean }
  timeframe: Timeframe
  names: Map<string, string>
  ranks: Map<string, number>
  trendCount: number
  mentions: Record<string, number>
  peak: number
  limited?: boolean
}): ScanRow | null {
  const base = baseFromUsdtSymbol(input.ticker.symbol)
  if (!base) return null
  const rank = input.ranks.get(base) ?? null
  const trending = rank !== null
  const social = combinedSocial(trendingSocial(rank, input.trendCount), redditSocial(input.mentions[base] ?? 0, input.peak))
  const scored = scoreMomentum({
    volRatio: input.stats.volRatio,
    priceChangePct: input.stats.priceChangePct,
    breakout: input.stats.breakout,
    social,
    quoteVolume24h: input.ticker.quoteVolume,
    trending,
  })
  return {
    rank: 0,
    symbol: input.ticker.symbol,
    base,
    name: input.names.get(base) ?? null,
    price: input.price,
    priceChangePct: input.stats.priceChangePct,
    volRatio: input.stats.volRatio,
    score: scored.score,
    flags: scored.flags,
    reason: momentumReason({
      timeframe: input.timeframe,
      volRatio: input.stats.volRatio,
      priceChangePct: input.stats.priceChangePct,
      breakout: input.stats.breakout,
      trending,
      limited: input.limited,
    }),
    quoteVolume24h: input.ticker.quoteVolume,
    breakout: input.stats.breakout,
    social,
    volScore: scored.volScore,
    priceScore: scored.priceScore,
    breakoutScore: scored.breakoutScore,
  }
}

function parseTickers(raw: { symbol: string; lastPrice: string; quoteVolume: string; priceChangePercent: string }[]): Ticker24h[] {
  const rows: Ticker24h[] = []
  for (const item of raw) {
    const lastPrice = Number(item.lastPrice)
    const quoteVolume = Number(item.quoteVolume)
    const priceChangePercent = Number(item.priceChangePercent)
    if (!Number.isFinite(lastPrice) || !Number.isFinite(quoteVolume)) continue
    rows.push({
      symbol: item.symbol,
      lastPrice,
      quoteVolume,
      priceChangePercent: Number.isFinite(priceChangePercent) ? priceChangePercent : 0,
    })
  }
  return rows
}

async function scanBinance(
  query: ScanQuery,
  names: Map<string, string>,
  ranks: Map<string, number>,
  trendCount: number,
): Promise<ScanRow[] | null> {
  const tickers = await fetchBinanceTickers()
  if (!tickers.ok) return null
  const universe = selectUniverse(parseTickers(tickers.data), query.minVolume, 60)
  if (universe.length === 0) return []
  const interval = KLINE_INTERVAL[query.timeframe]
  const klines = await fetchKlinesPool(
    universe.map((row) => row.symbol),
    interval,
  )
  const bases = universe.map((row) => baseFromUsdtSymbol(row.symbol)).filter((value): value is string => Boolean(value))
  const mentions = await redditMentions(bases)
  const peak = peakMentions(mentions)
  const bySymbol = new Map(universe.map((row) => [row.symbol, row]))
  const rows: ScanRow[] = []
  for (const item of klines) {
    const ticker = bySymbol.get(item.symbol)
    if (!ticker || !item.result.ok) continue
    const window = candleWindow(item.result.data)
    if (!window) continue
    const stats = statsFromCandles(window)
    if (!stats || stats.priceChangePct < query.minChange) continue
    const last = window[window.length - 1]
    const row = buildRow({
      ticker,
      price: last.close,
      stats,
      timeframe: query.timeframe,
      names,
      ranks,
      trendCount,
      mentions,
      peak,
    })
    if (row) rows.push(row)
  }
  return rows
}

function fallbackChange(market: MarketCoin, timeframe: Timeframe) {
  if (timeframe === "5m" || timeframe === "15m" || timeframe === "1h") {
    const hourly = market.price_change_percentage_1h_in_currency
    if (typeof hourly === "number" && Number.isFinite(hourly)) return hourly
  }
  return market.price_change_percentage_24h ?? 0
}

async function scanCoinGecko(
  query: ScanQuery,
  markets: MarketCoin[],
  names: Map<string, string>,
  ranks: Map<string, number>,
  trendCount: number,
): Promise<ScanRow[]> {
  const tickers: Ticker24h[] = []
  for (const market of markets) {
    const base = market.symbol.trim().toUpperCase()
    const symbol = `${base}USDT`
    if (!isSpotUsdtCandidate(symbol)) continue
    const volume = Number(market.total_volume) || 0
    const price = Number(market.current_price) || 0
    tickers.push({ symbol, lastPrice: price, quoteVolume: volume, priceChangePercent: fallbackChange(market, query.timeframe) })
  }
  const universe = selectUniverse(tickers, query.minVolume, 60)
  const bases = universe.map((row) => baseFromUsdtSymbol(row.symbol)).filter((value): value is string => Boolean(value))
  const mentions = await redditMentions(bases)
  const peak = peakMentions(mentions)
  const rows: ScanRow[] = []
  for (const ticker of universe) {
    const change = ticker.priceChangePercent
    if (change < query.minChange) continue
    const row = buildRow({
      ticker,
      price: ticker.lastPrice,
      stats: { volRatio: 1, priceChangePct: change, breakout: false },
      timeframe: query.timeframe,
      names,
      ranks,
      trendCount,
      mentions,
      peak,
      limited: true,
    })
    if (row) rows.push(row)
  }
  return rows
}

export async function runScan(query: ScanQuery): Promise<{ ok: true; data: ScanResponse } | { ok: false; error: string }> {
  const [trending, markets] = await Promise.all([fetchTrending(), fetchMarkets()])
  const hits = trending.ok ? trending.hits : []
  const marketRows = markets.ok ? markets.data : []
  const names = nameMap(marketRows, hits)
  const ranks = trendRank(hits)

  const binanceRows = await scanBinance(query, names, ranks, hits.length)
  let source: ScanSource = "binance"
  let notice: string | null = null
  let results: ScanRow[]

  if (binanceRows) {
    results = binanceRows
  } else if (marketRows.length > 0) {
    source = "coingecko"
    notice = FALLBACK_NOTICE
    results = await scanCoinGecko(query, marketRows, names, ranks, hits.length)
  } else {
    return { ok: false, error: "Market data is unavailable right now. Try again in a minute." }
  }

  return {
    ok: true,
    data: {
      timeframe: query.timeframe,
      source,
      notice,
      updatedAt: new Date().toISOString(),
      results: sortRows(results, query.sortBy),
    },
  }
}
