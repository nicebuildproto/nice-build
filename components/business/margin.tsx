"use client"

import {
  ActionBar,
  BusinessShell,
  CopyButton,
  ModeTabs,
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
import {
  explainMargin,
  marginFromPrices,
  money,
  parseMoney,
  percent,
  priceFromMargin,
  priceFromMarkup,
} from "@/lib/business/money"
import { useMemo, useState } from "react"

type Mode = "from-prices" | "from-margin" | "from-markup"

const EXAMPLE = { mode: "from-prices" as Mode, cost: "40", price: "65", margin: "40", markup: "62.5" }

function parseSearch(search: string) {
  const params = new URLSearchParams(search)
  const mode = params.get("mode")
  return {
    mode: mode === "from-prices" || mode === "from-margin" || mode === "from-markup" ? mode : EXAMPLE.mode,
    cost: params.get("cost") ?? EXAMPLE.cost,
    price: params.get("price") ?? EXAMPLE.price,
    margin: params.get("margin") ?? EXAMPLE.margin,
    markup: params.get("markup") ?? EXAMPLE.markup,
  }
}

export function MarginCalculator() {
  const search = useBrowserSearch()
  const path = useBrowserPath()
  const fromUrl = parseSearch(search)
  const [local, setLocal] = useState<Partial<typeof EXAMPLE>>({})
  const mode = local.mode ?? fromUrl.mode
  const cost = local.cost ?? fromUrl.cost
  const price = local.price ?? fromUrl.price
  const margin = local.margin ?? fromUrl.margin
  const markup = local.markup ?? fromUrl.markup

  const parsed = useMemo(() => {
    const costValue = parseMoney(cost)
    if (costValue === null || costValue < 0) {
      return { error: cost.trim() ? "Enter a cost of $0 or more." : "Enter the cost." } as const
    }
    if (mode === "from-prices") {
      const priceValue = parseMoney(price)
      if (priceValue === null || priceValue < 0) {
        return { error: price.trim() ? "Enter a selling price of $0 or more." : "Enter the selling price." } as const
      }
      return { error: null, result: marginFromPrices(costValue, priceValue) } as const
    }
    if (mode === "from-margin") {
      const marginValue = parseMoney(margin)
      if (marginValue === null) return { error: "Enter the margin you want, as a percent." } as const
      if (marginValue >= 100) return { error: "Margin has to be below 100% — at 100% the selling price would be infinite." } as const
      const selling = priceFromMargin(costValue, marginValue)
      if (selling === null) return { error: "That margin doesn’t produce a selling price." } as const
      return { error: null, result: marginFromPrices(costValue, selling) } as const
    }
    const markupValue = parseMoney(markup)
    if (markupValue === null) return { error: "Enter the markup you want, as a percent." } as const
    const selling = priceFromMarkup(costValue, markupValue)
    if (selling === null) return { error: "That markup doesn’t produce a selling price." } as const
    return { error: null, result: marginFromPrices(costValue, selling) } as const
  }, [cost, price, margin, markup, mode])

  const shareParams = new URLSearchParams()
  shareParams.set("mode", mode)
  if (cost) shareParams.set("cost", cost)
  if (mode === "from-prices" && price) shareParams.set("price", price)
  if (mode === "from-margin" && margin) shareParams.set("margin", margin)
  if (mode === "from-markup" && markup) shareParams.set("markup", markup)
  const share = path ? `${path}?${shareParams.toString()}` : ""

  const result = parsed.error === null ? parsed.result : null
  const copyText = result
    ? [
        `Cost ${money(result.cost)}`,
        `Selling price ${money(result.price)}`,
        `Gross profit ${money(result.profit)}`,
        `Margin ${result.margin === null ? "—" : percent(result.margin)}`,
        `Markup ${result.markup === null ? "—" : percent(result.markup)}`,
        explainMargin(result),
      ].join("\n")
    : ""

  return (
    <BusinessShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        Margin is profit as a percent of the selling price. Markup is the same dollars as a percent of cost. Use whichever number you already have.
      </p>
      <ModeTabs
        label="What do you know?"
        value={mode}
        onChange={(id) => setLocal((current) => ({ ...current, mode: id as Mode }))}
        options={[
          { id: "from-prices", label: "Cost and selling price" },
          { id: "from-margin", label: "Cost and margin" },
          { id: "from-markup", label: "Cost and markup" },
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyField label="Cost" value={cost} onChange={(value) => setLocal((current) => ({ ...current, cost: value }))} hint="What it costs you, in AUD." />
        {mode === "from-prices" ? (
          <MoneyField
            label="Selling price"
            value={price}
            onChange={(value) => setLocal((current) => ({ ...current, price: value }))}
            hint="What the customer pays, in AUD."
          />
        ) : null}
        {mode === "from-margin" ? (
          <PercentField
            label="Desired margin"
            value={margin}
            onChange={(value) => setLocal((current) => ({ ...current, margin: value }))}
            hint="Gross profit ÷ selling price. Must be below 100%."
          />
        ) : null}
        {mode === "from-markup" ? (
          <PercentField
            label="Desired markup"
            value={markup}
            onChange={(value) => setLocal((current) => ({ ...current, markup: value }))}
            hint="Gross profit ÷ cost."
          />
        ) : null}
      </div>
      {parsed.error ? (
        <p className="text-[13px] text-destructive">{parsed.error}</p>
      ) : result ? (
        <>
          <ResultHero label="Selling price" value={money(result.price)} note={explainMargin(result)} />
          <StatRow
            items={[
              { label: "Gross profit", value: money(result.profit) },
              { label: "Margin", value: result.margin === null ? "—" : percent(result.margin) },
              { label: "Markup", value: result.markup === null ? "—" : percent(result.markup) },
            ]}
          />
        </>
      ) : null}
      <ActionBar>
        {result ? <CopyButton text={copyText} label="Copy result" /> : null}
        {share ? <ShareUrlButton href={share} /> : null}
        <ResetButton onClick={() => setLocal(EXAMPLE)} label="Try an example" />
      </ActionBar>
      <PrivacyNote>Numbers stay in this browser. The share link only includes cost, price, and rates — never names or invoices.</PrivacyNote>
    </BusinessShell>
  )
}
