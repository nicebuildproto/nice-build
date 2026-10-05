import { cachedJson } from "./cache"

const SUBREDDITS = "CryptoCurrency+bitcoin+CryptoMarkets"

type RedditListing = {
  data?: {
    children?: { data?: { title?: string; selftext?: string } }[]
  }
}

function redditEnabled() {
  const flag = process.env.ENABLE_REDDIT_SIGNAL?.trim().toLowerCase()
  return flag === "1" || flag === "true" || flag === "on"
}

export async function redditMentions(symbols: string[]): Promise<Record<string, number>> {
  if (!redditEnabled() || symbols.length === 0) return {}

  const result = await cachedJson<RedditListing>(
    "reddit:crypto-new",
    `https://www.reddit.com/r/${SUBREDDITS}/new.json?limit=100&raw_json=1`,
    120,
    {
      headers: {
        accept: "application/json",
        "user-agent": "NiceToolsMomentumScanner/1.0 (https://nicetools.co)",
      },
    },
  )
  if (!result.ok) return {}

  const counts: Record<string, number> = {}
  for (const symbol of symbols) counts[symbol] = 0
  const needles = symbols
    .map((symbol) => symbol.toUpperCase())
    .filter((symbol) => symbol.length >= 2)
    .sort((a, b) => b.length - a.length)

  for (const child of result.data.data?.children ?? []) {
    const text = `${child.data?.title ?? ""} ${child.data?.selftext ?? ""}`.toUpperCase()
    for (const symbol of needles) {
      const pattern = new RegExp(`(^|[^A-Z0-9])${symbol}([^A-Z0-9]|$)`)
      if (pattern.test(text)) counts[symbol] += 1
    }
  }

  return counts
}
