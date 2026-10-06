"use client"

import { ActionBar, CopyReset, GamingToolShell, MetricCard, Note } from "@/components/gaming/kit"
import { NumberField, TextArea } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { advanceBracket, championOf, parseNames, seedBracket } from "@/lib/gaming/bracket"
import { lootOdds, sumAmounts } from "@/lib/gaming/play"
import { money, num } from "@/lib/tools/format"
import { cn } from "@/lib/utils"
import { useState } from "react"

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function LootBoxCalculator() {
  const [cost, setCost] = useState("2")
  const [pulls, setPulls] = useState("10")
  const [focus, setFocus] = useState("2")
  const [tiers, setTiers] = useState([
    { id: uid(), name: "Common", rate: "80", value: "0.2" },
    { id: uid(), name: "Rare", rate: "18", value: "2" },
    { id: uid(), name: "Legendary", rate: "2", value: "40" },
  ])
  const parsed = tiers.map((tier) => ({ name: tier.name, rate: Number(tier.rate), value: Number(tier.value) }))
  const result = lootOdds(parsed, Number(cost) || 0, Number(pulls) || 0, Number(focus) || 0)

  return (
    <GamingToolShell>
      <Note>
        Expected value is the average return of one pull if you could repeat it many times — not the next pull. Independent
        pulls, no pity. This is for reading the odds, not a reason to spend.
      </Note>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Cost per pull" value={cost} onChange={setCost} suffix="AUD" />
        <NumberField label="Pulls" value={pulls} onChange={setPulls} min={1} />
      </div>
      {tiers.map((tier, index) => (
        <div key={tier.id} className="grid gap-2 sm:grid-cols-[1fr_6rem_6rem_auto]">
          <Input value={tier.name} aria-label="Rarity" onChange={(event) => setTiers((current) => current.map((item) => (item.id === tier.id ? { ...item, name: event.target.value } : item)))} />
          <Input inputMode="decimal" value={tier.rate} aria-label="Drop rate percent" placeholder="Rate %" onChange={(event) => setTiers((current) => current.map((item) => (item.id === tier.id ? { ...item, rate: event.target.value } : item)))} />
          <Input inputMode="decimal" value={tier.value} aria-label="Value" placeholder="Value" onChange={(event) => setTiers((current) => current.map((item) => (item.id === tier.id ? { ...item, value: event.target.value } : item)))} />
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
        <select className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm" value={focus} onChange={(event) => setFocus(event.target.value)}>
          {tiers.map((tier, index) => (
            <option key={tier.id} value={index}>
              {tier.name || `Tier ${index + 1}`}
            </option>
          ))}
        </select>
      </label>
      <MetricCard
        label="Expected value vs cost"
        value={money(result.versusCost)}
        note={`EV ${money(result.ev)} against ${money(Number(cost) || 0)} per pull.`}
      />
      <div className="flex flex-wrap gap-10">
        <MetricCard label="EV per pull" value={money(result.ev)} />
        <MetricCard label={`≥1 ${result.focusName || "focus"} in ${result.n}`} value={`${num(result.chance * 100)}%`} />
      </div>
      <Note>
        Drop rates add up to {num(result.rateSum)}%. {result.complete ? "They cover the full pull." : "They do not sum to 100, so the expected value is only as complete as the tiers you listed."}
      </Note>
      <CopyReset
        text={`EV ${money(result.ev)} vs cost ${money(Number(cost) || 0)} (${money(result.versusCost)}). Chance of ${result.focusName} in ${result.n}: ${num(result.chance * 100)}%.`}
        onReset={() => {
          setCost("2")
          setPulls("10")
          setFocus("2")
        }}
      />
    </GamingToolShell>
  )
}

const partDefaults = [
  { id: "gpu", name: "GPU", amount: "700" },
  { id: "cpu", name: "CPU", amount: "400" },
  { id: "ram", name: "RAM", amount: "150" },
  { id: "storage", name: "Storage", amount: "120" },
  { id: "case", name: "Case", amount: "110" },
  { id: "psu", name: "PSU", amount: "130" },
  { id: "monitor", name: "Monitor", amount: "280" },
]

export function PcBuildCostEstimator() {
  const [parts, setParts] = useState(partDefaults)
  const total = sumAmounts(parts.map((part) => Number(part.amount) || 0))

  return (
    <GamingToolShell>
      <Note>There is no live price list. Type what you would actually pay. Leave a part at 0 if you already own it.</Note>
      {parts.map((part) => (
        <div key={part.id} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
          <Input
            value={part.name}
            aria-label="Part"
            onChange={(event) => setParts((current) => current.map((item) => (item.id === part.id ? { ...item, name: event.target.value } : item)))}
          />
          <NumberField
            label="Price"
            value={part.amount}
            suffix="AUD"
            onChange={(value) => setParts((current) => current.map((item) => (item.id === part.id ? { ...item, amount: value } : item)))}
          />
          <Button type="button" variant="outline" className="h-10 self-end" onClick={() => setParts((current) => current.filter((item) => item.id !== part.id))}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="h-10 w-fit" onClick={() => setParts((current) => [...current, { id: uid(), name: "", amount: "0" }])}>
        Add part
      </Button>
      <MetricCard label="Build total" value={total !== null ? money(total) : "—"} note={`${parts.filter((part) => Number(part.amount) > 0).length} priced parts.`} />
      <CopyReset
        text={total !== null ? parts.map((part) => `${part.name}: ${money(Number(part.amount) || 0)}`).concat(`Total ${money(total)}`).join("\n") : ""}
        onReset={() => setParts(partDefaults.map((part) => ({ ...part, id: uid() })))}
      />
    </GamingToolShell>
  )
}

export function SteamLibraryCalculator() {
  const [rows, setRows] = useState([
    { id: uid(), name: "Hades", price: "20" },
    { id: uid(), name: "Stardew Valley", price: "15" },
  ])
  const total = rows.reduce((sum, row) => sum + (Number(row.price) || 0), 0)
  const count = rows.filter((row) => row.name.trim() || Number(row.price)).length

  return (
    <GamingToolShell>
      <Note>No Steam login and no sale-price lookup. A gift or a bundle is whatever figure you type. This is what you spent, not what the library is worth today.</Note>
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
      <MetricCard label="Total spent" value={money(total)} note={`${count} games on this list.`} />
      <CopyReset
        text={rows.map((row) => `${row.name}: ${money(Number(row.price) || 0)}`).concat(`Total ${money(total)}`).join("\n")}
        onReset={() =>
          setRows([
            { id: uid(), name: "Hades", price: "20" },
            { id: uid(), name: "Stardew Valley", price: "15" },
          ])
        }
      />
    </GamingToolShell>
  )
}

export function BracketGenerator() {
  const [text, setText] = useState("North\nSouth\nEast\nWest")
  const [rounds, setRounds] = useState(() => seedBracket(parseNames("North\nSouth\nEast\nWest")))
  const champion = championOf(rounds)

  return (
    <GamingToolShell>
      <Note>Single elimination. Click a name to send them through. Byes fill an uneven list. The tree lives on this page only.</Note>
      <TextArea label="Names, one per line" value={text} onChange={setText} rows={6} />
      <ActionBar>
        <Button type="button" className="h-10" onClick={() => setRounds(seedBracket(parseNames(text)))}>
          Build bracket
        </Button>
        <Button type="button" variant="outline" className="h-10" onClick={() => setRounds(seedBracket(parseNames(text)))}>
          Reset results
        </Button>
      </ActionBar>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {rounds.map((column, round) => (
          <div key={round} className="flex min-w-40 flex-col justify-around gap-3">
            <p className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">
              {column.length === 1 ? "Final" : `Round ${round + 1}`}
            </p>
            {column.map((match, index) => (
              <div key={`${round}-${index}`} className="flex flex-col gap-1 rounded-xl border border-border p-2">
                {(["a", "b"] as const).map((side) => {
                  const name = match[side]
                  const label = name ?? (round === 0 ? "Bye" : "Waiting")
                  const active = Boolean(name) && match.winner === name
                  return (
                    <button
                      key={side}
                      type="button"
                      disabled={!name}
                      aria-pressed={active}
                      onClick={() => name && setRounds((current) => advanceBracket(current, round, index, name))}
                      className={cn(
                        "rounded-lg px-2 py-1.5 text-left text-sm",
                        active ? "bg-[var(--nb-accent)] text-[var(--nb-primary)]" : "text-[var(--nb-secondary)]",
                      )}
                    >
                      {label}
                      {active ? " ✓" : ""}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
      {champion ? <MetricCard label="Winner" value={champion} /> : null}
      <CopyReset
        text={champion ?? ""}
        onReset={() => {
          setText("North\nSouth\nEast\nWest")
          setRounds(seedBracket(parseNames("North\nSouth\nEast\nWest")))
        }}
      />
    </GamingToolShell>
  )
}
