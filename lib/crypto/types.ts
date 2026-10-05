export const TIMEFRAMES = ["5m", "15m", "1h", "4h", "24h"] as const
export type Timeframe = (typeof TIMEFRAMES)[number]

export const SORTS = ["score", "volume", "change"] as const
export type SortBy = (typeof SORTS)[number]

export const KLINE_INTERVAL: Record<Timeframe, string> = {
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "24h": "1d",
}

export type ScanFlag = "Extended" | "Low liquidity" | "Trending"

export type Candle = {
  open: number
  high: number
  close: number
  quoteVolume: number
  closeTime: number
}

export type ScanInputs = {
  volRatio: number
  priceChangePct: number
  breakout: boolean
  social: number
  quoteVolume24h: number
  trending: boolean
}

export type ScoreBreakdown = {
  volScore: number
  priceScore: number
  breakoutScore: number
  base: number
  score: number
  flags: ScanFlag[]
}

export type ScanRow = {
  rank: number
  symbol: string
  base: string
  name: string | null
  price: number
  priceChangePct: number
  volRatio: number
  score: number
  flags: ScanFlag[]
  reason: string
  quoteVolume24h: number
  breakout: boolean
  social: number
  volScore: number
  priceScore: number
  breakoutScore: number
}

export type ScanSource = "binance" | "coingecko"

export type ScanResponse = {
  timeframe: Timeframe
  source: ScanSource
  notice: string | null
  updatedAt: string
  results: ScanRow[]
}

export type ScanQuery = {
  timeframe: Timeframe
  minVolume: number
  minChange: number
  sortBy: SortBy
}
