"use client"

import {
  CalculatorExample,
  CalculatorPresets,
  CalculatorPrivacy,
  CalculatorResult,
} from "@/components/calculators/CalculatorResult"
import { CopyButton, NumberField, Stat, parseAmount } from "@/components/tools/ui"
import { Input } from "@/components/ui/input"
import { tipSplit } from "@/lib/calculators/math"
import { useQueryFields } from "@/lib/calculators/query"
import { exactAge, money, num, percent } from "@/lib/tools/format"
import { useMemo, useState } from "react"

const tipDefaults = { bill: "86", tip: "10", people: "2" }

export function TipCalculator() {
  const { values, set, reset, dirty } = useQueryFields(tipDefaults)
  const bill = values.bill ?? ""
  const tip = values.tip ?? ""
  const people = values.people ?? ""
  const amount = parseAmount(bill)
  const percentValue = parseAmount(tip)
  const count = parseAmount(people)
  const result =
    amount === null || percentValue === null || count === null ? null : tipSplit(amount, percentValue, count)
  const error =
    count !== null && count <= 0 ? "Enter at least 1 person." : amount !== null && amount < 0 ? "Enter a bill of 0 or more." : null

  const copyText =
    result && amount !== null && percentValue !== null && count !== null
      ? count === 1
        ? `On a ${money(amount)} bill with a ${percent(percentValue)} tip, the tip is ${money(result.tipAmount)} and the total is ${money(result.total)}.`
        : `On a ${money(amount)} bill with a ${percent(percentValue)} tip split ${num(count, 0)} ways, the tip is ${money(result.tipAmount)}, the total is ${money(result.total)}, and each person pays ${money(result.each)}.`
      : undefined

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="Bill" value={bill} onChange={(value) => set("bill", value)} suffix="AUD" min={0} placeholder="86" />
        <NumberField label="Tip" value={tip} onChange={(value) => set("tip", value)} suffix="%" min={0} placeholder="15" />
        <NumberField label="People" value={people} onChange={(value) => set("people", value)} min={1} step="1" placeholder="2" />
      </div>
      <CalculatorPresets
        label="Common tip rates"
        values={[
          { label: "10%", value: "10" },
          { label: "12%", value: "12" },
          { label: "15%", value: "15" },
          { label: "18%", value: "18" },
          { label: "20%", value: "20" },
        ]}
        current={tip}
        onSelect={(value) => set("tip", value)}
      />
      <CalculatorExample label="$86 at 15% for 2" onClick={() => {
        set("bill", "86")
        set("tip", "15")
        set("people", "2")
      }} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <CalculatorResult
        primary={result ? { label: "Total", value: money(result.total) } : undefined}
        context={copyText}
        formula={result && amount !== null && percentValue !== null ? `${money(amount)} × ${percent(percentValue)} tip = ${money(result.tipAmount)}` : undefined}
        secondary={
          result
            ? [
                { label: "Tip", value: money(result.tipAmount) },
                { label: "Each", value: money(result.each) },
              ]
            : undefined
        }
        copyText={copyText}
        onReset={dirty ? reset : undefined}
        share
        empty={error ?? "Enter the bill, tip percent, and how many people."}
      />
      <CalculatorPrivacy />
    </div>
  )
}

export function MarginCalculator() {
  const [cost, setCost] = useState("40")
  const [price, setPrice] = useState("65")
  const result = useMemo(() => {
    const c = parseAmount(cost)
    const p = parseAmount(price)
    if (c === null || p === null) return null
    const profit = p - c
    return {
      profit,
      margin: p === 0 ? null : (profit / p) * 100,
      markup: c === 0 ? null : (profit / c) * 100,
    }
  }, [cost, price])

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Cost" value={cost} onChange={setCost} suffix="AUD" min={0} />
        <NumberField label="Sell price" value={price} onChange={setPrice} suffix="AUD" min={0} />
      </div>
      <div className="flex flex-col gap-4" aria-live="polite">
        <div className="flex flex-wrap gap-10">
          <Stat label="Profit" value={result ? money(result.profit) : "—"} />
          <Stat label="Margin" value={result?.margin === null || !result ? "—" : `${num(result.margin)}%`} />
          <Stat label="Markup" value={result?.markup === null || !result ? "—" : `${num(result.markup)}%`} />
        </div>
        {result ? (
          <CopyButton
            label="Copy result"
            text={`Profit: ${money(result.profit)}\nMargin: ${result.margin === null ? "—" : `${num(result.margin)}%`}\nMarkup: ${result.markup === null ? "—" : `${num(result.markup)}%`}`}
          />
        ) : null}
      </div>
    </div>
  )
}

export { MeetingCost } from "@/components/people/views"

export function AgeCalculator() {
  const [dob, setDob] = useState("1994-06-12")
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10))
  const result = exactAge(new Date(`${dob}T00:00:00`), new Date(`${asOf}T00:00:00`))

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-[13px]">
          Date of birth
          <Input type="date" value={dob} onChange={(event) => setDob(event.target.value)} className="h-10" />
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          As of
          <Input type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} className="h-10" />
        </label>
      </div>
      <div className="flex flex-col gap-4" aria-live="polite">
        <div className="flex flex-wrap gap-10">
          <Stat label="Years" value={result ? String(result.years) : "—"} />
          <Stat label="Months" value={result ? String(result.months) : "—"} />
          <Stat label="Days" value={result ? String(result.days) : "—"} />
        </div>
        {result ? (
          <CopyButton label="Copy result" text={`${result.years} years, ${result.months} months, ${result.days} days`} />
        ) : null}
      </div>
    </div>
  )
}

