"use client"

import { CalculatorPrivacy, CalculatorResult } from "@/components/calculators/CalculatorResult"
import { NumberField } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { money, num } from "@/lib/tools/format"
import { useState } from "react"

const selectClass =
  "h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function CryptoTaxCalculator() {
  const [rows, setRows] = useState([
    { id: uid(), side: "buy", coin: "BTC", date: "2024-01-15", amount: "0.1", price: "60000" },
    { id: uid(), side: "sell", coin: "BTC", date: "2024-11-01", amount: "0.04", price: "70000" },
  ])

  function patch(id: string, key: string, value: string) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)))
  }

  const realised = fifo(rows)
  const total = realised.reduce((sum, row) => sum + row.gain, 0)

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Add each buy and sell with the coin, the date, the amount, and the price. Sales are matched to the oldest buys of that coin first (FIFO). The table is an estimate of realised gain or loss. It is not tax advice, and it ignores fees, transfers, and local rules.
      </p>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.id} className="grid gap-2 sm:grid-cols-[7rem_6rem_9rem_1fr_1fr_auto]">
            <select className={selectClass} value={row.side} onChange={(event) => patch(row.id, "side", event.target.value)}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
            <Input value={row.coin} onChange={(event) => patch(row.id, "coin", event.target.value)} aria-label="Coin" />
            <Input type="date" value={row.date} onChange={(event) => patch(row.id, "date", event.target.value)} aria-label="Date" />
            <Input inputMode="decimal" value={row.amount} onChange={(event) => patch(row.id, "amount", event.target.value)} aria-label="Amount" />
            <Input inputMode="decimal" value={row.price} onChange={(event) => patch(row.id, "price", event.target.value)} aria-label="Price" />
            <Button type="button" variant="outline" className="h-10" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}>
              Remove
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => setRows((current) => [...current, { id: uid(), side: "buy", coin: "", date: "", amount: "", price: "" }])}>
        Add row
      </Button>
      {realised.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[var(--nb-secondary)]">
                <th className="p-2 font-medium">Coin</th>
                <th className="p-2 font-medium">Date</th>
                <th className="p-2 font-medium">Sold</th>
                <th className="p-2 font-medium">Proceeds</th>
                <th className="p-2 font-medium">Cost</th>
                <th className="p-2 font-medium">Gain</th>
              </tr>
            </thead>
            <tbody>
              {realised.map((row) => (
                <tr key={`${row.coin}-${row.date}-${row.amount}`} className="border-t border-border">
                  <td className="p-2">{row.coin}</td>
                  <td className="p-2">{row.date || "—"}</td>
                  <td className="p-2 tabular-nums">{num(row.amount, 6)}</td>
                  <td className="p-2 tabular-nums">{money(row.proceeds)}</td>
                  <td className="p-2 tabular-nums">{money(row.cost)}</td>
                  <td className="p-2 tabular-nums">{money(row.gain)}{row.uncovered > 0 ? " (short of buys)" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Add a sell that has an earlier buy of the same coin.</p>
      )}
      <div>
        <div className="text-xs font-medium text-[var(--nb-secondary)]">Total realised</div>
        <div className="mt-1 text-3xl font-semibold tracking-[-0.04em] tabular-nums">{money(total)}</div>
      </div>
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">Estimate only. Not tax advice.</p>
    </div>
  )
}

type Fill = { id: string; side: string; coin: string; date: string; amount: string; price: string }

function fifo(rows: Fill[]) {
  const grouped = new Map<string, Fill[]>()
  for (const row of rows) {
    const coin = row.coin.trim().toUpperCase()
    if (!coin) continue
    grouped.set(coin, [...(grouped.get(coin) ?? []), row])
  }
  const realised: { coin: string; date: string; amount: number; proceeds: number; cost: number; gain: number; uncovered: number }[] = []
  for (const [coin, list] of grouped) {
    const lots: { amount: number; price: number }[] = []
    const ordered = [...list].sort((a, b) => a.date.localeCompare(b.date))
    for (const row of ordered) {
      const amount = Number(row.amount)
      const price = Number(row.price)
      if (!Number.isFinite(amount) || !Number.isFinite(price) || amount <= 0 || price < 0) continue
      if (row.side === "buy") {
        lots.push({ amount, price })
        continue
      }
      let left = amount
      let cost = 0
      while (left > 1e-10 && lots.length) {
        const take = Math.min(lots[0].amount, left)
        cost += take * lots[0].price
        lots[0].amount -= take
        left -= take
        if (lots[0].amount <= 1e-10) lots.shift()
      }
      const sold = amount - left
      const proceeds = sold * price
      realised.push({ coin, date: row.date, amount: sold, proceeds, cost, gain: proceeds - cost, uncovered: left })
    }
  }
  return realised
}

export function SteamLibraryCalculator() {
  const [rows, setRows] = useState([
    { id: uid(), name: "Hades", price: "20" },
    { id: uid(), name: "Stardew Valley", price: "15" },
  ])
  const total = rows.reduce((sum, row) => sum + (Number(row.price) || 0), 0)
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        List each game and what you paid. The total is the sum of those prices. There is no Steam login and no sale-price lookup, so a gift or a bundle is whatever figure you type.
      </p>
      {rows.map((row) => (
        <div key={row.id} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
          <Input value={row.name} placeholder="Game" onChange={(event) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, name: event.target.value } : item)))} />
          <Input inputMode="decimal" value={row.price} aria-label="Price paid" onChange={(event) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, price: event.target.value } : item)))} />
          <Button type="button" variant="outline" className="h-10" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => setRows((current) => [...current, { id: uid(), name: "", price: "" }])}>
        Add game
      </Button>
      <div>
        <div className="text-xs font-medium text-[var(--nb-secondary)]">Total spent</div>
        <div className="mt-1 text-3xl font-semibold tracking-[-0.04em] tabular-nums">{money(total)}</div>
      </div>
    </div>
  )
}

export function SubscriptionAudit() {
  const [rows, setRows] = useState([
    { id: uid(), name: "Streaming", cost: "16" },
    { id: uid(), name: "Music", cost: "12" },
  ])
  const monthly = rows.reduce((sum, row) => sum + (Number(row.cost) || 0), 0)
  const yearly = monthly * 12
  const copyText = `Subscriptions: ${money(monthly)} a month, ${money(yearly)} a year.`
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Add each subscription and its monthly cost. The year is that month times 12, with no free months or annual discounts unless you fold them into the monthly figure.
      </p>
      {rows.map((row) => (
        <div key={row.id} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
          <Input value={row.name} placeholder="Name" onChange={(event) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, name: event.target.value } : item)))} />
          <NumberField label="Monthly" value={row.cost} suffix="AUD" onChange={(value) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, cost: value } : item)))} />
          <Button type="button" variant="outline" className="h-11 self-end sm:h-10" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => setRows((current) => [...current, { id: uid(), name: "", cost: "" }])}>
        Add subscription
      </Button>
      <CalculatorResult
        primary={{ label: "A year", value: money(yearly) }}
        context={`${money(monthly)} a month across ${rows.filter((row) => row.name.trim() || Number(row.cost)).length} subscriptions.`}
        secondary={[{ label: "A month", value: money(monthly) }]}
        copyText={copyText}
        onReset={() =>
          setRows([
            { id: uid(), name: "Streaming", cost: "16" },
            { id: uid(), name: "Music", cost: "12" },
          ])
        }
      />
      <CalculatorPrivacy />
    </div>
  )
}

export function ExpenseSplitter() {
  const [rows, setRows] = useState([
    { id: uid(), name: "Alex", paid: "80" },
    { id: uid(), name: "Sam", paid: "20" },
    { id: uid(), name: "Jordan", paid: "0" },
  ])
  const people = rows.filter((row) => row.name.trim())
  const total = people.reduce((sum, row) => sum + (Number(row.paid) || 0), 0)
  const share = people.length ? total / people.length : 0
  const nets = people.map((row) => ({ name: row.name.trim(), net: (Number(row.paid) || 0) - share }))
  const transfers = settle(nets)
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Enter each person and what they paid toward one shared bill. Everyone is assumed to owe an equal share. The settle-up is the smallest set of payments that brings the group back to even. It is not a running ledger.
      </p>
      {rows.map((row) => (
        <div key={row.id} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
          <Input value={row.name} placeholder="Name" onChange={(event) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, name: event.target.value } : item)))} />
          <NumberField label="Paid" value={row.paid} suffix="AUD" onChange={(value) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, paid: value } : item)))} />
          <Button type="button" variant="outline" className="h-10" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => setRows((current) => [...current, { id: uid(), name: "", paid: "" }])}>
        Add person
      </Button>
      <CalculatorResult
        primary={{ label: "Each share", value: money(share) }}
        context={people.length ? `${money(total)} split ${people.length} ways.` : "Add people to split the bill."}
        secondary={people.length ? [{ label: "Total", value: money(total) }] : undefined}
        copyText={
          transfers.length
            ? [`${money(total)} split ${people.length} ways is ${money(share)} each.`, ...transfers.map((item) => `${item.from} pays ${item.to} ${money(item.amount)}`)].join("\n")
            : people.length
              ? `${money(total)} split ${people.length} ways is ${money(share)} each. Nobody owes anyone.`
              : undefined
        }
      />
      {transfers.length ? (
        <ul className="flex flex-col gap-2 text-sm">
          {transfers.map((item) => (
            <li key={`${item.from}-${item.to}`}>
              {item.from} pays {item.to} {money(item.amount)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Nobody owes anyone on these figures.</p>
      )}
    </div>
  )
}

function settle(nets: { name: string; net: number }[]) {
  const debtors = nets.filter((row) => row.net < -0.005).map((row) => ({ name: row.name, left: -row.net }))
  const creditors = nets.filter((row) => row.net > 0.005).map((row) => ({ name: row.name, left: row.net }))
  const transfers: { from: string; to: string; amount: number }[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].left, creditors[j].left)
    transfers.push({ from: debtors[i].name, to: creditors[j].name, amount })
    debtors[i].left -= amount
    creditors[j].left -= amount
    if (debtors[i].left < 0.005) i += 1
    if (creditors[j].left < 0.005) j += 1
  }
  return transfers
}

export function SideHustleTracker() {
  const [rows, setRows] = useState([
    { id: uid(), kind: "income", note: "Saturday market", amount: "180" },
    { id: uid(), kind: "expense", note: "Stall fee", amount: "40" },
  ])
  const income = rows.filter((row) => row.kind === "income").reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
  const expenses = rows.filter((row) => row.kind === "expense").reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Log money in and money out for a side project. Profit is income minus expenses. The list lives in this page only, and it clears when you leave or refresh.
      </p>
      {rows.map((row) => (
        <div key={row.id} className="grid gap-2 sm:grid-cols-[8rem_1fr_8rem_auto]">
          <select className={selectClass} value={row.kind} onChange={(event) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, kind: event.target.value } : item)))}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <Input value={row.note} placeholder="Note" onChange={(event) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, note: event.target.value } : item)))} />
          <NumberField label="Amount" value={row.amount} suffix="AUD" onChange={(value) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, amount: value } : item)))} />
          <Button type="button" variant="outline" className="h-10" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => setRows((current) => [...current, { id: uid(), kind: "income", note: "", amount: "" }])}>
        Add line
      </Button>
      <CalculatorResult
        primary={{ label: "Profit", value: money(income - expenses) }}
        context={`Income ${money(income)} minus expenses ${money(expenses)}.`}
        secondary={[
          { label: "Income", value: money(income) },
          { label: "Expenses", value: money(expenses) },
        ]}
        copyText={`Profit ${money(income - expenses)} from ${money(income)} income and ${money(expenses)} expenses.`}
        onReset={() =>
          setRows([
            { id: uid(), kind: "income", note: "Saturday market", amount: "180" },
            { id: uid(), kind: "expense", note: "Stall fee", amount: "40" },
          ])
        }
      />
      <CalculatorPrivacy />
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

export function LootBoxCalculator() {
  const [cost, setCost] = useState("2")
  const [pulls, setPulls] = useState("10")
  const [focus, setFocus] = useState("0")
  const [tiers, setTiers] = useState([
    { id: uid(), name: "Common", rate: "80", value: "0.2" },
    { id: uid(), name: "Rare", rate: "18", value: "2" },
    { id: uid(), name: "Legendary", rate: "2", value: "40" },
  ])
  const parsed = tiers.map((tier) => ({ ...tier, rate: Number(tier.rate), value: Number(tier.value) }))
  const rateSum = parsed.reduce((sum, tier) => sum + (Number.isFinite(tier.rate) ? tier.rate : 0), 0)
  const ev = parsed.reduce((sum, tier) => sum + ((Number.isFinite(tier.rate) ? tier.rate : 0) / 100) * (Number.isFinite(tier.value) ? tier.value : 0), 0)
  const pullCost = Number(cost) || 0
  const n = Math.max(0, Math.floor(Number(pulls) || 0))
  const chosen = parsed[Number(focus)] ?? parsed[0]
  const p = chosen && Number.isFinite(chosen.rate) ? Math.min(1, Math.max(0, chosen.rate / 100)) : 0
  const chance = 1 - (1 - p) ** n
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Enter the cost of one pull, a drop rate for each rarity, and what that rarity is worth to you. Expected value is the probability-weighted value of one pull. The chance within N pulls assumes each pull is independent. This is for understanding the odds, not a reason to spend.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Cost per pull" value={cost} onChange={setCost} suffix="AUD" />
        <NumberField label="Pulls" value={pulls} onChange={setPulls} min={1} />
      </div>
      {tiers.map((tier) => (
        <div key={tier.id} className="grid gap-2 sm:grid-cols-[1fr_6rem_6rem_auto]">
          <Input value={tier.name} aria-label="Rarity" onChange={(event) => setTiers((current) => current.map((item) => (item.id === tier.id ? { ...item, name: event.target.value } : item)))} />
          <Input inputMode="decimal" value={tier.rate} aria-label="Drop rate percent" onChange={(event) => setTiers((current) => current.map((item) => (item.id === tier.id ? { ...item, rate: event.target.value } : item)))} />
          <Input inputMode="decimal" value={tier.value} aria-label="Value" onChange={(event) => setTiers((current) => current.map((item) => (item.id === tier.id ? { ...item, value: event.target.value } : item)))} />
          <Button type="button" variant="outline" className="h-10" onClick={() => setTiers((current) => current.filter((item) => item.id !== tier.id))}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => setTiers((current) => [...current, { id: uid(), name: "", rate: "", value: "" }])}>
        Add rarity
      </Button>
      <label className="flex max-w-xs flex-col gap-2 text-[13px]">
        Rarity to test
        <select className={selectClass} value={focus} onChange={(event) => setFocus(event.target.value)}>
          {tiers.map((tier, index) => (
            <option key={tier.id} value={index}>
              {tier.name || `Tier ${index + 1}`}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-10">
        <Stat label="Expected value per pull" value={money(ev)} />
        <Stat label="Versus the cost" value={money(ev - pullCost)} />
        <Stat label={`Chance in ${n} pulls`} value={`${num(chance * 100)}%`} />
      </div>
      <p className="max-w-xl text-sm text-[var(--nb-secondary)]">
        Drop rates add up to {num(rateSum)}%. {Math.abs(rateSum - 100) > 0.5 ? "They do not sum to 100, so the expected value is only as complete as the tiers you listed." : "They cover the full pull."}
      </p>
    </div>
  )
}

const feePresets: Record<string, string> = { ebay: "13.6", depop: "10", vinted: "0" }

export function ResaleProfitCalculator() {
  const [price, setPrice] = useState("45")
  const [cost, setCost] = useState("12")
  const [fee, setFee] = useState("13.6")
  const [shipping, setShipping] = useState("8")
  const [platform, setPlatform] = useState("ebay")
  const sale = Number(price) || 0
  const item = Number(cost) || 0
  const ship = Number(shipping) || 0
  const percent = Number(fee) || 0
  const feeAmount = sale * (percent / 100)
  const profit = sale - item - ship - feeAmount
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
        Sale price, what the item cost you, shipping you pay, and a platform fee. eBay starts at 13.6%, Depop at 10%, and Vinted at 0% because many seller fees sit with the buyer. Edit the percent to match your account. Rates change.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-[13px]">
          Platform preset
          <select
            className={selectClass}
            value={platform}
            onChange={(event) => {
              setPlatform(event.target.value)
              setFee(feePresets[event.target.value] ?? fee)
            }}
          >
            <option value="ebay">eBay</option>
            <option value="depop">Depop</option>
            <option value="vinted">Vinted</option>
          </select>
        </label>
        <NumberField label="Platform fee" value={fee} onChange={setFee} suffix="%" />
        <NumberField label="Sale price" value={price} onChange={setPrice} suffix="AUD" />
        <NumberField label="Item cost" value={cost} onChange={setCost} suffix="AUD" />
        <NumberField label="Shipping you pay" value={shipping} onChange={setShipping} suffix="AUD" />
      </div>
      <div className="flex flex-wrap gap-10">
        <Stat label="Net profit" value={money(profit)} />
        <Stat label="Fee" value={money(feeAmount)} />
        <Stat label="Margin" value={sale ? `${num((profit / sale) * 100)}%` : "—"} />
      </div>
    </div>
  )
}
