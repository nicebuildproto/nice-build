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

export function PaintCalculator() {
  const [length, setLength] = useState("4.2")
  const [width, setWidth] = useState("3.6")
  const [height, setHeight] = useState("2.7")
  const [openings, setOpenings] = useState("3")
  const [coats, setCoats] = useState("2")
  const [coverage, setCoverage] = useState("12")
  const [ceiling, setCeiling] = useState(true)
  const result = useMemo(() => {
    const l = parseAmount(length)
    const w = parseAmount(width)
    const h = parseAmount(height)
    const openingsArea = parseAmount(openings) ?? 0
    const coatCount = parseAmount(coats)
    const cover = parseAmount(coverage)
    if (l === null || w === null || h === null || coatCount === null || !cover) return null
    const walls = Math.max(0, 2 * (l + w) * h - openingsArea)
    const area = walls + (ceiling ? l * w : 0)
    return { area, litres: (area * coatCount) / cover }
  }, [length, width, height, openings, coats, coverage, ceiling])

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="Length" value={length} onChange={setLength} suffix="m" min={0} />
        <NumberField label="Width" value={width} onChange={setWidth} suffix="m" min={0} />
        <NumberField label="Height" value={height} onChange={setHeight} suffix="m" min={0} />
        <NumberField label="Doors and windows" value={openings} onChange={setOpenings} suffix="m²" min={0} />
        <NumberField label="Coats" value={coats} onChange={setCoats} min={1} />
        <NumberField label="Coverage" value={coverage} onChange={setCoverage} suffix="m²/L" min={1} />
      </div>
      <label className="flex items-center gap-2 text-[13px] text-[var(--nb-primary)]">
        <input type="checkbox" checked={ceiling} onChange={(event) => setCeiling(event.target.checked)} />
        Include the ceiling
      </label>
      <div className="flex flex-col gap-4" aria-live="polite">
        <div className="flex flex-wrap gap-10">
          <Stat label="Area" value={result ? `${num(result.area, 1)} m²` : "—"} />
          <Stat label="Paint" value={result ? `${num(result.litres, 1)} L` : "—"} />
        </div>
        {result ? <CopyButton label="Copy result" text={`Area: ${num(result.area, 1)} m²\nPaint: ${num(result.litres, 1)} L`} /> : null}
      </div>
    </div>
  )
}

export function MeetingCost() {
  const [people, setPeople] = useState("6")
  const [rate, setRate] = useState("85")
  const [minutes, setMinutes] = useState("45")
  const [perMonth, setPerMonth] = useState("4")
  const result = useMemo(() => {
    const count = parseAmount(people)
    const hourly = parseAmount(rate)
    const mins = parseAmount(minutes)
    const times = parseAmount(perMonth)
    if (count === null || hourly === null || mins === null || times === null) return null
    const meeting = count * hourly * (mins / 60)
    return { meeting, month: meeting * times, year: meeting * times * 12 }
  }, [people, rate, minutes, perMonth])

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="People" value={people} onChange={setPeople} min={1} step="1" />
        <NumberField label="Average hourly cost" value={rate} onChange={setRate} suffix="AUD" min={0} />
        <NumberField label="Length" value={minutes} onChange={setMinutes} suffix="min" min={1} />
        <NumberField label="Times each month" value={perMonth} onChange={setPerMonth} min={0} />
      </div>
      <div className="flex flex-col gap-4" aria-live="polite">
        <div className="flex flex-wrap gap-10">
          <Stat label="Each meeting" value={result ? money(result.meeting) : "—"} />
          <Stat label="Each month" value={result ? money(result.month) : "—"} />
          <Stat label="Each year" value={result ? money(result.year) : "—"} />
        </div>
        {result ? (
          <CopyButton
            label="Copy result"
            text={`Each meeting: ${money(result.meeting)}\nEach month: ${money(result.month)}\nEach year: ${money(result.year)}`}
          />
        ) : null}
      </div>
    </div>
  )
}

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

export function MaterialEstimator() {
  const [kind, setKind] = useState("plaster")
  const [length, setLength] = useState("8")
  const [height, setHeight] = useState("2.7")
  const [width, setWidth] = useState("4")
  const [spacing, setSpacing] = useState("450")
  const [coverage, setCoverage] = useState("2.4")
  const result = useMemo(() => {
    const l = parseAmount(length)
    const h = parseAmount(height)
    const w = parseAmount(width)
    if (kind === "plaster" && l !== null && h !== null) {
      const sheets = Math.ceil((l * h * 1.1) / (2.4 * 1.2))
      return `${num(sheets, 0)} sheets of 2400 × 1200 mm, with 10% waste`
    }
    if (kind === "studs" && l !== null) {
      const gap = (parseAmount(spacing) ?? 450) / 1000
      const studs = Math.ceil(l / gap) + 1
      return `${num(studs, 0)} studs at ${spacing || "450"} mm centres`
    }
    if (kind === "floor" && l !== null && w !== null) {
      const cover = parseAmount(coverage)
      if (!cover) return null
      const packs = Math.ceil((l * w * 1.1) / cover)
      return `${num(packs, 0)} packs for ${num(l * w, 1)} m², with 10% waste`
    }
    return null
  }, [kind, length, height, width, spacing, coverage])

  return (
    <div className="flex flex-col gap-8">
      <label className="flex max-w-xs flex-col gap-2 text-[13px]">
        Material
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value)}
          className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="plaster">Plasterboard</option>
          <option value="studs">Timber studs</option>
          <option value="floor">Flooring</option>
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label={kind === "studs" ? "Wall length" : "Length"} value={length} onChange={setLength} suffix="m" />
        {kind === "plaster" ? <NumberField label="Height" value={height} onChange={setHeight} suffix="m" /> : null}
        {kind === "floor" ? <NumberField label="Width" value={width} onChange={setWidth} suffix="m" /> : null}
        {kind === "studs" ? (
          <NumberField label="Stud spacing" value={spacing} onChange={setSpacing} suffix="mm" />
        ) : null}
        {kind === "floor" ? (
          <NumberField label="Coverage per pack" value={coverage} onChange={setCoverage} suffix="m²" />
        ) : null}
      </div>
      <div className="flex flex-col gap-4" aria-live="polite">
        <p className="text-2xl font-semibold tracking-[-0.03em] text-[var(--nb-primary)]">{result ?? "—"}</p>
        {result ? <CopyButton label="Copy result" text={result} /> : null}
      </div>
    </div>
  )
}
