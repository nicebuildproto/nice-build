import { cachedJson } from "./cache"

const COINGECKO = "https://api.coingecko.com/api/v3"

function geckoHeaders(): HeadersInit {
  const headers: Record<string, string> = { accept: "application/json" }
  const key = process.env.COINGECKO_DEMO_KEY?.trim()
  if (key) headers["x-cg-demo-api-key"] = key
  return headers
}

type TrendingCoin = {
  item?: {
    name?: string
    symbol?: string
    score?: number
  }
}

type TrendingResponse = {
  coins?: TrendingCoin[]
}

export type TrendingHit = {
  symbol: string
  name: string
  rank: number
}

export async function fetchTrending() {
  const result = await cachedJson<TrendingResponse>("coingecko:trending", `${COINGECKO}/search/trending`, 300, {
    headers: geckoHeaders(),
  })
  if (!result.ok) return { ...result, hits: [] as TrendingHit[] }
  const hits: TrendingHit[] = []
  for (const [index, coin] of (result.data.coins ?? []).entries()) {
    const symbol = coin.item?.symbol?.trim().toUpperCase()
    if (!symbol) continue
    hits.push({
      symbol,
      name: coin.item?.name?.trim() || symbol,
      rank: index + 1,
    })
  }
  return { ok: true as const, status: result.status, hits }
}

export type MarketCoin = {
  name: string
  symbol: string
  current_price: number
  total_volume: number
  price_change_percentage_24h: number | null
  price_change_percentage_1h_in_currency?: number | null
}

export async function fetchMarkets() {
  const url = `${COINGECKO}/coins/markets?vs_currency=usd&order=volume_desc&per_page=80&page=1&price_change_percentage=1h,24h`
  const result = await cachedJson<MarketCoin[]>("coingecko:markets", url, 300, { headers: geckoHeaders() })
  if (!result.ok) return result
  const rows = Array.isArray(result.data) ? result.data : []
  return { ok: true as const, status: result.status, data: rows }
}
