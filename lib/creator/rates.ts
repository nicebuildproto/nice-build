export const ratePlatforms = [
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["youtube", "YouTube"],
  ["x", "X"],
  ["linkedin", "LinkedIn"],
] as const

export const rateContent = [
  ["post", "Feed post"],
  ["reel", "Short or reel"],
  ["video", "Longer video"],
] as const

export const quoteCurrencies = ["USD", "AUD", "EUR", "GBP"] as const

const rateBases: Record<string, number> = {
  "instagram|post": 10,
  "instagram|reel": 20,
  "instagram|video": 25,
  "tiktok|post": 8,
  "tiktok|reel": 15,
  "tiktok|video": 15,
  "youtube|post": 20,
  "youtube|reel": 25,
  "youtube|video": 40,
  "x|post": 5,
  "x|reel": 8,
  "x|video": 12,
  "linkedin|post": 15,
  "linkedin|reel": 20,
  "linkedin|video": 25,
}

const typicalEngagement: Record<string, number> = {
  instagram: 1.5,
  tiktok: 4,
  youtube: 2,
  x: 0.5,
  linkedin: 2,
}

export function readAmount(value: string) {
  if (value.trim() === "") return null
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : null
}

export function moneyIn(amount: number, currency: string) {
  if (!Number.isFinite(amount)) return "—"
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(amount)
}

export function suggestedRate(followers: number, engagement: number, platform: string, content: string) {
  if (!Number.isFinite(followers) || !Number.isFinite(engagement) || followers <= 0 || engagement < 0) return null
  const base = rateBases[`${platform}|${content}`]
  const typical = typicalEngagement[platform]
  if (base === undefined || typical === undefined) return null
  const ratio = engagement / typical
  const adjust = Math.min(1.8, Math.max(0.6, ratio))
  const mid = (followers / 1000) * base * adjust
  if (!Number.isFinite(mid)) return null
  return {
    base,
    typical,
    adjust,
    clamped: ratio < 0.6 || ratio > 1.8,
    mid,
    low: mid * 0.7,
    high: mid * 1.3,
  }
}

export function quoteTotal(rate: number, quantity: number, extras: number[]) {
  if (![rate, quantity, ...extras].every((value) => Number.isFinite(value))) return null
  if (rate < 0 || quantity < 0 || extras.some((value) => value < 0)) return null
  const service = rate * quantity
  const extra = extras.reduce((sum, value) => sum + value, 0)
  const total = service + extra
  if (!Number.isFinite(total)) return null
  return { service, extra, total }
}

export type EngagementMethod = "followers" | "views"

export function engagementRate(
  method: EngagementMethod,
  input: { followers: number; likes: number; comments: number; shares: number; views: number },
) {
  const { likes, comments } = input
  if (![likes, comments].every((value) => Number.isFinite(value)) || likes < 0 || comments < 0) return null
  if (method === "followers") {
    if (!Number.isFinite(input.followers) || input.followers <= 0) return null
    const interactions = likes + comments
    return {
      rate: (interactions / input.followers) * 100,
      interactions,
      formula: "(average likes + average comments) ÷ followers",
      used: "Shares and views are not in this definition.",
    }
  }
  if (!Number.isFinite(input.shares) || !Number.isFinite(input.views) || input.shares < 0 || input.views <= 0) return null
  const interactions = likes + comments + input.shares
  return {
    rate: (interactions / input.views) * 100,
    interactions,
    formula: "(likes + comments + shares) ÷ views",
    used: "Followers are not in this definition.",
  }
}

export function instagramFollowerBand(rate: number) {
  if (rate < 1) return "Under 1% is a quiet range for a larger Instagram account, on this followers method only."
  if (rate < 3) return "1–3% is an ordinary range for a larger Instagram account, on this followers method only."
  return "Above 3% is a strong range for a larger Instagram account, on this followers method only. Smaller accounts often sit higher."
}
