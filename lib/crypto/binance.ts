import { cachedJson, mapPool } from "./cache"
import type { Candle } from "./types"

const BINANCE = "https://data-api.binance.vision"

export type BinanceTicker = {
  symbol: string
  lastPrice: string
  quoteVolume: string
  priceChangePercent: string
}

export async function fetchBinanceTickers() {
  return cachedJson<BinanceTicker[]>("binance:ticker24h", `${BINANCE}/api/v3/ticker/24hr`, 60, {
    headers: { accept: "application/json" },
  })
}

type KlineRow = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
]

function parseKlines(rows: KlineRow[]): Candle[] {
  return rows.map((row) => ({
    open: Number(row[1]),
    high: Number(row[2]),
    close: Number(row[4]),
    quoteVolume: Number(row[7]),
    closeTime: row[6],
  }))
}

export async function fetchKlines(symbol: string, interval: string) {
  const key = `binance:klines:${symbol}:${interval}`
  const result = await cachedJson<KlineRow[]>(
    key,
    `${BINANCE}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=22`,
    60,
    { headers: { accept: "application/json" } },
  )
  if (!result.ok) return result
  return { ok: true as const, data: parseKlines(result.data), status: result.status }
}

export async function fetchKlinesPool(symbols: string[], interval: string) {
  return mapPool(symbols, 8, async (symbol) => {
    const result = await fetchKlines(symbol, interval)
    return { symbol, result }
  })
}
