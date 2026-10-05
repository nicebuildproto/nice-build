"use client"

import { CopyButton, NumberField, Stat, ToolNote, parseAmount } from "@/components/tools/ui"
import { money } from "@/lib/tools/format"
import { netWorth, type MoneyLine } from "@/lib/tools/finance"
import { useMemo, useState } from "react"

const assetSeed: MoneyLine[] = [
  { id: "cash", label: "Cash", amount: 12000 },
  { id: "invest", label: "Investments", amount: 48000 },
  { id: "property", label: "Property", amount: 620000 },
  { id: "vehicles", label: "Vehicles", amount: 18000 },
  { id: "other-a", label: "Other assets", amount: 4000 },
]

const debtSeed: MoneyLine[] = [
  { id: "mortgage", label: "Mortgage", amount: 410000 },
  { id: "loans", label: "Loans", amount: 12000 },
  { id: "cards", label: "Credit cards", amount: 3200 },
  { id: "other-d", label: "Other debts", amount: 0 },
]

export function NetWorthCalculator() {
  const [assets, setAssets] = useState(assetSeed)
  const [liabilities, setLiabilities] = useState(debtSeed)
  const result = useMemo(() => netWorth(assets, liabilities), [assets, liabilities])
  const max = Math.max(result.totalAssets, result.totalLiabilities, 1)

  return (
    <div className="flex flex-col gap-8">
      <ToolNote>Add what you own and what you owe. The total is assets minus liabilities — a snapshot, not advice.</ToolNote>
      <div className="grid gap-8 md:grid-cols-2">
        <Column title="Assets" lines={assets} onChange={setAssets} />
        <Column title="Liabilities" lines={liabilities} onChange={setLiabilities} />
      </div>
      <div className="flex flex-col gap-4" aria-live="polite">
        <div className="flex flex-wrap gap-10">
          <Stat label="Assets" value={money(result.totalAssets)} />
          <Stat label="Liabilities" value={money(result.totalLiabilities)} />
          <Stat label="Net worth" value={money(result.net)} />
        </div>
        <div className="flex flex-col gap-2">
          <Bar label="Assets" value={result.totalAssets} max={max} />
          <Bar label="Liabilities" value={result.totalLiabilities} max={max} />
        </div>
        <CopyButton
          text={`Assets: ${money(result.totalAssets)}\nLiabilities: ${money(result.totalLiabilities)}\nNet worth: ${money(result.net)}`}
          label="Copy result"
        />
      </div>
    </div>
  )
}

function Column({ title, lines, onChange }: { title: string; lines: MoneyLine[]; onChange: (lines: MoneyLine[]) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[13px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">{title}</h2>
      {lines.map((line) => (
        <NumberField
          key={line.id}
          label={line.label}
          value={String(line.amount || "")}
          suffix="AUD"
          min={0}
          onChange={(value) =>
            onChange(lines.map((item) => (item.id === line.id ? { ...item, amount: parseAmount(value) ?? 0 } : item)))
          }
        />
      ))}
    </div>
  )
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="mb-1 text-[12px] text-[var(--nb-secondary)]">{label}</div>
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <div className="h-full bg-[var(--nb-primary)]" style={{ width: `${Math.min(100, (Math.abs(value) / max) * 100)}%` }} />
      </div>
    </div>
  )
}
