"use client"

import { CalculatorPrivacy, CalculatorResult } from "@/components/calculators/CalculatorResult"
import { ErrorNote, NumberField, ToolNote, parseAmount } from "@/components/tools/ui"
import { money } from "@/lib/tools/format"
import { debtPayoff } from "@/lib/tools/finance"
import { useMemo, useState } from "react"

export function DebtPayoffCalculator() {
  const [balance, setBalance] = useState("8000")
  const [rate, setRate] = useState("18")
  const [minimum, setMinimum] = useState("240")
  const [extra, setExtra] = useState("100")
  const base = useMemo(() => {
    const b = parseAmount(balance)
    const r = parseAmount(rate)
    const m = parseAmount(minimum)
    if (b === null || r === null || m === null) return null
    return debtPayoff({ balance: b, annualRate: r, minimum: m, extra: 0 })
  }, [balance, rate, minimum])
  const boosted = useMemo(() => {
    const b = parseAmount(balance)
    const r = parseAmount(rate)
    const m = parseAmount(minimum)
    const e = parseAmount(extra) ?? 0
    if (b === null || r === null || m === null) return null
    return debtPayoff({ balance: b, annualRate: r, minimum: m, extra: e })
  }, [balance, rate, minimum, extra])

  const error = (boosted && "error" in boosted && boosted.error) || (base && "error" in base && base.error) || null
  const ok = boosted && !("error" in boosted) ? boosted : null
  const plain = base && !("error" in base) ? base : null

  return (
    <div className="flex flex-col gap-8">
      <ToolNote>
        A single debt, paid at the same amount each month. Interest is applied monthly. This is an estimate, not financial advice — lenders round differently, and fees are ignored.
      </ToolNote>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Balance" value={balance} onChange={setBalance} suffix="AUD" min={0} />
        <NumberField label="Interest rate" value={rate} onChange={setRate} suffix="% p.a." min={0} />
        <NumberField label="Minimum payment" value={minimum} onChange={setMinimum} suffix="AUD" min={0} />
        <NumberField label="Extra payment" value={extra} onChange={setExtra} suffix="AUD" min={0} />
      </div>
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      <CalculatorResult
        primary={ok ? { label: "Payoff", value: ok.payoffDate } : undefined}
        context={
          ok
            ? `${ok.months} months, paying ${money(ok.payment)} a month. Interest ${money(ok.totalInterest)}, total repaid ${money(ok.totalPaid)}.`
            : undefined
        }
        secondary={
          ok
            ? [
                { label: "Months", value: String(ok.months) },
                { label: "Interest", value: money(ok.totalInterest) },
                { label: "Total repaid", value: money(ok.totalPaid) },
              ]
            : undefined
        }
        note={
          ok && plain && extra && Number(extra) > 0
            ? `Without the extra ${money(Number(extra))} each month, payoff would be ${plain.payoffDate} and interest about ${money(plain.totalInterest)}${plain.months > ok.months ? ` — ${plain.months - ok.months} extra months.` : "."}`
            : undefined
        }
        copyText={
          ok
            ? `Payoff ${ok.payoffDate} in ${ok.months} months. Interest ${money(ok.totalInterest)}, total ${money(ok.totalPaid)}, paying ${money(ok.payment)} a month.`
            : undefined
        }
        onReset={() => {
          setBalance("8000")
          setRate("18")
          setMinimum("240")
          setExtra("100")
        }}
        empty={error ?? "Enter a balance, rate, and payment to see a payoff date."}
      />
      <CalculatorPrivacy />
    </div>
  )
}
