"use client"

import {
  ActionBar,
  BusinessShell,
  CopyButton,
  MoneyField,
  PercentField,
  PrivacyNote,
  ResetButton,
  ResultHero,
  ShareUrlButton,
  StatRow,
  useBrowserPath,
  useBrowserSearch,
} from "@/components/business/kit"
import { breakEven, commissionOn, money, parseMoney, percent } from "@/lib/business/money"
import { num } from "@/lib/tools/format"
import { useMemo, useState } from "react"

export function BreakEvenCalculator() {
  const search = useBrowserSearch()
  const path = useBrowserPath()
  const params = new URLSearchParams(search)
  const [local, setLocal] = useState<{ fixed?: string; price?: string; variable?: string }>({})
  const fixed = local.fixed ?? params.get("fixed") ?? "8000"
  const price = local.price ?? params.get("price") ?? "120"
  const variable = local.variable ?? params.get("variable") ?? "45"

  const parsed = useMemo(() => {
    const fixedValue = parseMoney(fixed)
    const priceValue = parseMoney(price)
    const variableValue = parseMoney(variable)
    if (fixedValue === null || fixedValue < 0) return { error: "Enter fixed costs of $0 or more." } as const
    if (priceValue === null || priceValue <= 0) return { error: "Enter a selling price greater than $0." } as const
    if (variableValue === null || variableValue < 0) return { error: "Enter a variable cost of $0 or more." } as const
    return { error: null, result: breakEven(fixedValue, priceValue, variableValue), fixedValue } as const
  }, [fixed, price, variable])

  const shareQuery = new URLSearchParams()
  if (fixed) shareQuery.set("fixed", fixed)
  if (price) shareQuery.set("price", price)
  if (variable) shareQuery.set("variable", variable)
  const share = path ? `${path}?${shareQuery.toString()}` : ""

  const result = parsed.error === null ? parsed.result : null
  const copyText =
    result && result.ok
      ? `Break-even ${num(result.units, 0)} sales\nContribution ${money(result.contribution)} each\nRevenue ${money(result.revenue)}`
      : result && !result.ok
        ? result.note
        : ""

  return (
    <BusinessShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        Each sale contributes price minus variable cost. Divide fixed costs by that contribution, then round up — you can’t sell a fraction of a unit.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <MoneyField label="Fixed costs" value={fixed} onChange={(value) => setLocal((current) => ({ ...current, fixed: value }))} hint="Rent, software, salaries — costs that don’t move with each sale." />
        <MoneyField label="Selling price" value={price} onChange={(value) => setLocal((current) => ({ ...current, price: value }))} hint="What one unit sells for, in AUD." />
        <MoneyField label="Variable cost" value={variable} onChange={(value) => setLocal((current) => ({ ...current, variable: value }))} hint="What one extra sale costs you." />
      </div>
      {parsed.error ? <p className="text-[13px] text-destructive">{parsed.error}</p> : null}
      {result && !result.ok ? <p className="text-[13px] text-destructive">{result.note}</p> : null}
      {result && result.ok ? (
        <>
          <ResultHero
            label="Sales to break even"
            value={num(result.units, 0)}
            note={`Each sale contributes ${money(result.contribution)}. You cover ${money(parsed.error === null ? parsed.fixedValue : 0)} of fixed costs at ${num(result.units, 0)} sales, which is ${money(result.revenue)} of revenue.`}
          />
          <StatRow
            items={[
              { label: "Contribution each", value: money(result.contribution) },
              { label: "Break-even revenue", value: money(result.revenue) },
            ]}
          />
        </>
      ) : null}
      <ActionBar>
        {copyText ? <CopyButton text={copyText} label="Copy result" /> : null}
        {share ? <ShareUrlButton href={share} /> : null}
        <ResetButton onClick={() => setLocal({ fixed: "8000", price: "120", variable: "45" })} label="Try an example" />
      </ActionBar>
      <PrivacyNote>The numbers stay in this browser. The share link only includes the three amounts you typed.</PrivacyNote>
    </BusinessShell>
  )
}

export function CommissionCalculator() {
  const search = useBrowserSearch()
  const path = useBrowserPath()
  const params = new URLSearchParams(search)
  const [local, setLocal] = useState<{ sales?: string; rate?: string }>({})
  const sales = local.sales ?? params.get("sales") ?? "4800"
  const rate = local.rate ?? params.get("rate") ?? "8"

  const parsed = useMemo(() => {
    const salesValue = parseMoney(sales)
    const rateValue = parseMoney(rate)
    if (salesValue === null || salesValue < 0) return { error: "Enter a sales amount of $0 or more." } as const
    if (rateValue === null || rateValue < 0) return { error: "Enter a commission rate of 0% or more." } as const
    const commission = commissionOn(salesValue, rateValue)
    return { error: null, salesValue, rateValue, commission, remainder: salesValue - commission } as const
  }, [sales, rate])

  const shareQuery = new URLSearchParams()
  if (sales) shareQuery.set("sales", sales)
  if (rate) shareQuery.set("rate", rate)
  const share = path ? `${path}?${shareQuery.toString()}` : ""
  const copyText =
    parsed.error === null ? `Commission ${money(parsed.commission)} (${percent(parsed.rateValue)} of ${money(parsed.salesValue)})` : ""

  return (
    <BusinessShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        Commission is the sales amount times the rate. It doesn’t take costs or tax into account.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyField label="Sales" value={sales} onChange={(value) => setLocal((current) => ({ ...current, sales: value }))} hint="The amount the rate applies to, in AUD." />
        <PercentField label="Commission rate" value={rate} onChange={(value) => setLocal((current) => ({ ...current, rate: value }))} />
      </div>
      {parsed.error ? <p className="text-[13px] text-destructive">{parsed.error}</p> : null}
      {parsed.error === null ? (
        <ResultHero
          label="Commission"
          value={money(parsed.commission)}
          note={`${percent(parsed.rateValue)} of ${money(parsed.salesValue)} is ${money(parsed.commission)}. ${money(parsed.remainder)} remains after commission.`}
        />
      ) : null}
      <ActionBar>
        {copyText ? <CopyButton text={copyText} /> : null}
        {share ? <ShareUrlButton href={share} /> : null}
        <ResetButton onClick={() => setLocal({ sales: "4800", rate: "8" })} label="Try an example" />
      </ActionBar>
      <PrivacyNote>The numbers stay in this browser. The share link only includes the sales amount and the rate.</PrivacyNote>
    </BusinessShell>
  )
}
