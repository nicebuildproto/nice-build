const STABLES = new Set([
  "USDT",
  "USDC",
  "BUSD",
  "DAI",
  "TUSD",
  "FDUSD",
  "USDP",
  "USDD",
  "TUSD",
  "PYUSD",
  "GUSD",
  "LUSD",
  "FRAX",
  "USDE",
  "USD1",
  "UST",
  "USTC",
  "EUR",
  "AEUR",
  "EURC",
  "EURI",
])

const LEVERAGED = /(?:UP|DOWN|BULL|BEAR|3L|3S|2L|2S)$/i

export function baseFromUsdtSymbol(symbol: string) {
  if (!symbol.endsWith("USDT")) return null
  return symbol.slice(0, -4)
}

export function isSpotUsdtCandidate(symbol: string) {
  const base = baseFromUsdtSymbol(symbol)
  if (!base) return false
  if (STABLES.has(base.toUpperCase())) return false
  if (LEVERAGED.test(base)) return false
  return true
}

export type Ticker24h = {
  symbol: string
  lastPrice: number
  quoteVolume: number
  priceChangePercent: number
}

export function selectUniverse(tickers: Ticker24h[], minVolume: number, limit = 60) {
  return tickers
    .filter((ticker) => isSpotUsdtCandidate(ticker.symbol) && ticker.quoteVolume >= minVolume)
    .sort((a, b) => b.quoteVolume - a.quoteVolume)
    .slice(0, limit)
}
