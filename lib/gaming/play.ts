export type LootTier = { name: string; rate: number; value: number }

export function lootOdds(tiers: LootTier[], cost: number, pulls: number, focusIndex: number) {
  const clean = tiers.filter((tier) => Number.isFinite(tier.rate) && Number.isFinite(tier.value))
  const rateSum = clean.reduce((sum, tier) => sum + tier.rate, 0)
  const ev = clean.reduce((sum, tier) => sum + (tier.rate / 100) * tier.value, 0)
  const chosen = clean[focusIndex] ?? clean[0]
  const p = chosen ? Math.min(1, Math.max(0, chosen.rate / 100)) : 0
  const n = Math.max(0, Math.floor(pulls))
  const chance = 1 - (1 - p) ** n
  return {
    ev,
    versusCost: ev - cost,
    rateSum,
    chance,
    n,
    focusName: chosen?.name ?? "",
    complete: Math.abs(rateSum - 100) <= 0.5,
  }
}

export function sumAmounts(values: number[]) {
  if (!values.every((value) => Number.isFinite(value) && value >= 0)) return null
  return values.reduce((sum, value) => sum + value, 0)
}

export function chanceAtLeastOnce(ratePercent: number, n: number) {
  const p = Math.min(1, Math.max(0, ratePercent / 100))
  return 1 - (1 - p) ** Math.max(0, Math.floor(n))
}
