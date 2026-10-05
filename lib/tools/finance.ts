export type MoneyLine = { id: string; label: string; amount: number }

export function sumLines(lines: MoneyLine[]) {
  return lines.reduce((sum, line) => sum + (Number.isFinite(line.amount) ? line.amount : 0), 0)
}

export function netWorth(assets: MoneyLine[], liabilities: MoneyLine[]) {
  const totalAssets = sumLines(assets)
  const totalLiabilities = sumLines(liabilities)
  return {
    totalAssets,
    totalLiabilities,
    net: totalAssets - totalLiabilities,
  }
}

export type DebtInput = {
  balance: number
  annualRate: number
  minimum: number
  extra: number
}

export type DebtPayoff = {
  months: number
  payoffDate: string
  totalInterest: number
  totalPaid: number
  payment: number
  never?: string
}

export function debtPayoff(input: DebtInput, from = new Date()): DebtPayoff | { error: string } {
  const { balance, annualRate, minimum, extra } = input
  if (!(balance > 0)) return { error: "Enter a balance greater than zero." }
  if (annualRate < 0) return { error: "Interest can’t be negative." }
  if (!(minimum + extra > 0)) return { error: "Enter a payment greater than zero." }

  const monthlyRate = annualRate / 100 / 12
  const payment = minimum + extra
  if (monthlyRate > 0 && payment <= balance * monthlyRate + 1e-9) {
    return { error: "That payment never covers the interest, so the balance would not fall." }
  }

  let remaining = balance
  let totalInterest = 0
  let months = 0
  const cap = 1200
  while (remaining > 0.005 && months < cap) {
    const interest = remaining * monthlyRate
    totalInterest += interest
    remaining = remaining + interest - payment
    months += 1
    if (remaining < 0) remaining = 0
  }
  if (months >= cap && remaining > 0) {
    return { error: "That schedule would take more than 100 years. Raise the payment." }
  }

  const end = new Date(from.getFullYear(), from.getMonth() + months, 1)
  const payoffDate = end.toLocaleDateString("en-AU", { month: "long", year: "numeric" })
  const totalPaid = balance + totalInterest
  return { months, payoffDate, totalInterest, totalPaid, payment }
}
