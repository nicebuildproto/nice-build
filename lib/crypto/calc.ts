export function sameUnit(value: number) {
  if (!Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

export type StakeKind = "apr" | "apy"

export function stakingYield(input: {
  amount: number
  ratePercent: number
  days: number
  kind: StakeKind
  periods: number
  feePercent: number
}) {
  if (![input.amount, input.ratePercent, input.days, input.feePercent].every((value) => Number.isFinite(value))) return null
  if (input.amount < 0 || input.days < 0 || input.feePercent < 0 || input.feePercent > 100) return null
  if (input.kind === "apy" && input.ratePercent <= -100) return null
  if (input.kind === "apr" && input.periods > 1 && input.ratePercent / input.periods <= -100) return null
  const rate = input.ratePercent / 100
  let gross = 0
  let basis = ""
  if (input.kind === "apy") {
    gross = input.amount * ((1 + rate) ** (input.days / 365) - 1)
    basis = "The rate is an APY. Reward = amount × ((1 + APY)^(days ÷ 365) − 1). That already includes compounding, so it is not compounded again."
  } else if (input.periods > 1) {
    const elapsed = (input.days / 365) * input.periods
    gross = input.amount * ((1 + rate / input.periods) ** elapsed - 1)
    basis = `The rate is an APR, compounded ${input.periods} times a year. Reward = amount × ((1 + APR ÷ ${input.periods})^(days ÷ 365 × ${input.periods}) − 1).`
  } else {
    gross = input.amount * rate * (input.days / 365)
    basis = "The rate is an APR with no compounding. Reward = amount × APR × days ÷ 365."
  }
  const fee = gross * (input.feePercent / 100)
  const net = gross - fee
  if (![gross, fee, net].every((value) => Number.isFinite(value))) return null
  return { gross, fee, net, balance: input.amount + net, basis }
}

export function positionSize(account: number, riskPercent: number, entry: number, stop: number) {
  if (![account, riskPercent, entry, stop].every((value) => Number.isFinite(value))) return null
  if (account < 0 || riskPercent < 0 || entry === stop) return null
  const riskAmount = account * (riskPercent / 100)
  const distance = Math.abs(entry - stop)
  const units = riskAmount / distance
  return {
    riskAmount,
    distance,
    units,
    notional: units * entry,
    basis: `Size = risk amount ÷ |entry − stop|. ${riskAmount} ÷ ${distance} = ${units}.`,
  }
}

export function tradeProfit(quantity: number, entry: number, exit: number, feePercent: number) {
  if (![quantity, entry, exit, feePercent].every((value) => Number.isFinite(value))) return null
  if (quantity < 0 || feePercent < 0) return null
  const cost = quantity * entry
  const proceeds = quantity * exit
  const fees = (cost + proceeds) * (feePercent / 100)
  const profit = proceeds - cost - fees
  return {
    cost,
    proceeds,
    fees,
    profit,
    returnPct: cost ? (profit / cost) * 100 : null,
    basis: "Profit = proceeds − cost − a fee on each side. Prices are the ones you typed.",
  }
}
