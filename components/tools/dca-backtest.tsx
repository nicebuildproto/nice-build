"use client"

import { NumberField } from "@/components/tools/ui"
import { num } from "@/lib/tools/format"
import series from "@/lib/data/crypto-closes.json"
import { useMemo, useState } from "react"

const selectClass =
  "h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

type Point = [string, number]

const closes = series as { source: string; asOf: string; btc: Point[]; eth: Point[] }

export function CryptoDcaBacktest() {
  const [coin, setCoin] = useState<"btc" | "eth">("btc")
  const [mode, setMode] = useState<"dca" | "lump">("dca")
  const [amount, setAmount] = useState("50")
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("monthly")
  const [start, setStart] = useState("2022-01-01")

  const result = useMemo(() => backtest(closes[coin], Number(amount), start, mode, frequency), [amount, coin, frequency, mode, start])

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Replay a regular buy of Bitcoin or Ethereum, or a single lump sum on the start date. Prices are daily closes bundled with this site, not a live feed. {closes.source}. Series as of {closes.asOf}. Dollars are US dollars, matching the price series.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-[13px]">
          Coin
          <select className={selectClass} value={coin} onChange={(event) => setCoin(event.target.value as "btc" | "eth")}>
            <option value="btc">BTC</option>
            <option value="eth">ETH</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          Mode
          <select className={selectClass} value={mode} onChange={(event) => setMode(event.target.value as "dca" | "lump")}>
            <option value="dca">Regular buys</option>
            <option value="lump">Lump sum</option>
          </select>
        </label>
        <NumberField label={mode === "lump" ? "Amount on the start date" : "Each buy"} value={amount} onChange={setAmount} suffix="USD" />
        {mode === "dca" ? (
          <label className="flex flex-col gap-2 text-[13px]">
            Frequency
            <select className={selectClass} value={frequency} onChange={(event) => setFrequency(event.target.value as "weekly" | "monthly")}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        ) : null}
        <label className="flex flex-col gap-2 text-[13px]">
          Start date
          <input type="date" value={start} onChange={(event) => setStart(event.target.value)} className={selectClass} />
        </label>
      </div>
      {result ? (
        <>
          <div className="flex flex-wrap gap-10">
            <Stat label="Invested" value={usd(result.invested)} />
            <Stat label="Value at last close" value={usd(result.value)} />
            <Stat label="Result" value={usd(result.value - result.invested)} />
          </div>
          <p className="text-sm text-[var(--nb-secondary)]">
            {num(result.coins, 6)} {coin.toUpperCase()} from {result.startDate} to {result.endDate}. Last close {usd(result.endPrice)}.
          </p>
          <Line points={result.chart} />
        </>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Pick a start date inside the series and an amount above zero.</p>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-[var(--nb-secondary)]">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-[-0.04em] tabular-nums">{value}</div>
    </div>
  )
}

function usd(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "USD" }).format(value)
}

function Line({ points }: { points: number[] }) {
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const drawn = points
    .map((value, index) => {
      const x = points.length === 1 ? 160 : (index / (points.length - 1)) * 320
      const y = 140 - ((value - min) / (max - min || 1)) * 120
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg viewBox="0 0 320 160" className="w-full text-[var(--nb-primary)]" role="img" aria-label="Value over time">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={drawn} />
    </svg>
  )
}

function backtest(points: Point[], amount: number, start: string, mode: "dca" | "lump", frequency: "weekly" | "monthly") {
  if (!amount || amount <= 0 || !start) return null
  const rows = points.filter(([date]) => date >= start)
  if (!rows.length) return null
  let coins = 0
  let invested = 0
  let next = rows[0][0]
  const chart: number[] = []
  rows.forEach(([date, price], index) => {
    const due = mode === "lump" ? date === rows[0][0] : date >= next
    if (due) {
      coins += amount / price
      invested += amount
      if (mode === "dca") next = addPeriod(date, frequency)
    }
    if (index % 7 === 0 || index === rows.length - 1) chart.push(coins * price)
  })
  const end = rows[rows.length - 1]
  return { invested, coins, value: coins * end[1], chart, startDate: rows[0][0], endDate: end[0], endPrice: end[1] }
}

function addPeriod(iso: string, frequency: "weekly" | "monthly") {
  const date = new Date(`${iso}T00:00:00Z`)
  if (frequency === "weekly") date.setUTCDate(date.getUTCDate() + 7)
  else date.setUTCMonth(date.getUTCMonth() + 1)
  return date.toISOString().slice(0, 10)
}
