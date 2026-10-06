"use client"

import { CalculatorCard } from "@/components/calculators/CalculatorCard"
import { CalculatorPrivacy } from "@/components/calculators/CalculatorResult"
import { ToolGuide } from "@/components/tools/ToolGuide"
import { PageShell } from "@/components/site/PageShell"
import type { PercentagePageContent } from "@/lib/calculators/content"
import { formatResult, usePercentage } from "@/lib/calculators/usePercentage"
import { money } from "@/lib/tools/format"

const reveal =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 ease-out motion-reduce:animate-none"

const discountPresets = [
  { label: "10%", value: "10" },
  { label: "15%", value: "15" },
  { label: "20%", value: "20" },
  { label: "25%", value: "25" },
  { label: "50%", value: "50" },
]

export function PercentageClusterView({ page }: { page: PercentagePageContent }) {
  const calc = usePercentage(page.mode)

  return (
    <PageShell backHref="/category/calculators" width="tool">
      <header className={`mb-10 flex flex-col gap-3 ${reveal}`}>
        <h1 className="text-3xl leading-[1.1] font-semibold tracking-[-0.03em] text-[var(--nb-primary)] sm:text-4xl">
          {page.title}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--nb-secondary)]">{page.lede}</p>
      </header>

      {page.mode === "basic" ? <BasicCards calc={calc} /> : null}
      {page.mode === "increase" ? <IncreaseCards calc={calc} /> : null}
      {page.mode === "decrease" ? <DecreaseCards calc={calc} /> : null}
      {page.mode === "discount" ? <DiscountCards calc={calc} /> : null}

      <div className="mt-6">
        <CalculatorPrivacy />
      </div>
      <ToolGuide slug={page.slug} />
    </PageShell>
  )
}

type Calc = ReturnType<typeof usePercentage>

function BasicCards({ calc }: { calc: Calc }) {
  const part = calc.values.part ?? ""
  const whole = calc.values.whole ?? ""
  const percent = calc.values.percent ?? ""
  const of = calc.values.of ?? ""
  const shareContext =
    calc.whatPercent === null
      ? whole.trim() === "0"
        ? "A number can’t be a percentage of zero."
        : undefined
      : `${part} is ${formatResult(calc.whatPercent)}% of ${whole}.`
  const ofContext =
    calc.percentOf === null ? undefined : `${percent}% of ${of} = ${formatResult(calc.percentOf)}.`

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <CalculatorCard
        title="X is what percent of Y"
        description="Find the share one number is of another."
        delay={80}
        fields={[
          { label: "Part (X)", value: part, onChange: (value) => calc.set("part", value), placeholder: "25" },
          { label: "Whole (Y)", value: whole, onChange: (value) => calc.set("whole", value), placeholder: "200" },
        ]}
        primary={{ label: "Result", value: calc.whatPercent, suffix: "%" }}
        context={shareContext}
        formula={calc.whatPercent === null ? undefined : `${part} ÷ ${whole} × 100 = ${formatResult(calc.whatPercent)}%`}
        copyText={shareContext}
        share
        onReset={calc.reset}
      />
      <CalculatorCard
        title="What is X% of Y"
        description="Take a percentage of a number."
        delay={140}
        fields={[
          { label: "Percent (X)", value: percent, onChange: (value) => calc.set("percent", value), placeholder: "15", suffix: "%" },
          { label: "Amount (Y)", value: of, onChange: (value) => calc.set("of", value), placeholder: "200" },
        ]}
        primary={{ label: "Result", value: calc.percentOf }}
        context={ofContext}
        formula={calc.percentOf === null ? undefined : `${percent}% × ${of} = ${formatResult(calc.percentOf)}`}
        copyText={ofContext}
        share
      />
    </div>
  )
}

function IncreaseCards({ calc }: { calc: Calc }) {
  const percent = calc.values.percent ?? ""
  const original = calc.values.of ?? ""
  const from = calc.values.from ?? ""
  const to = calc.values.to ?? ""
  const applyContext =
    calc.next === null ? undefined : `${original} increased by ${percent}% is ${formatResult(calc.next)}.`
  const measured = calc.measured.percent
  const measuredContext =
    measured === null
      ? calc.measured.from === 0
        ? "Enter an original amount other than 0."
        : undefined
      : measured < 0
        ? `${from} to ${to} is a ${formatResult(Math.abs(measured))}% decrease.`
        : `${from} increased to ${to} is a ${formatResult(measured)}% increase.`

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <CalculatorCard
        title="Increase by a percent"
        description="Starting amount and the percent it grows by."
        fields={[
          { label: "Original amount", value: original, onChange: (value) => calc.set("of", value), placeholder: "50" },
          { label: "Increase", value: percent, onChange: (value) => calc.set("percent", value), placeholder: "20", suffix: "%" },
        ]}
        primary={{ label: "New amount", value: calc.next }}
        secondary={[
          { label: "Original", value: original === "" ? null : original },
          { label: "Increase", value: calc.delta },
        ]}
        context={applyContext}
        formula={calc.next === null ? undefined : `${original} × (1 + ${percent} ÷ 100) = ${formatResult(calc.next)}`}
        copyText={applyContext}
        share
        onReset={calc.reset}
      />
      <CalculatorCard
        title="Find the percentage increase"
        description="Original value and the new value."
        delay={140}
        fields={[
          { label: "Original value", value: from, onChange: (value) => calc.set("from", value), placeholder: "50" },
          { label: "New value", value: to, onChange: (value) => calc.set("to", value), placeholder: "60" },
        ]}
        primary={{ label: "Percentage increase", value: measured, suffix: "%" }}
        secondary={[
          { label: "Original", value: from === "" ? null : from },
          { label: "New", value: to === "" ? null : to },
          { label: "Increase", value: calc.measured.delta },
        ]}
        context={measuredContext}
        formula={measured === null ? undefined : `(${to} − ${from}) ÷ ${from} × 100 = ${formatResult(measured)}%`}
        copyText={measuredContext}
        share
      />
    </div>
  )
}

function DecreaseCards({ calc }: { calc: Calc }) {
  const percent = calc.values.percent ?? ""
  const original = calc.values.of ?? ""
  const from = calc.values.from ?? ""
  const to = calc.values.to ?? ""
  const applyContext =
    calc.next === null ? undefined : `${original} decreased by ${percent}% is ${formatResult(calc.next)}.`
  const measured = calc.measured.percent
  const drop = measured === null ? null : -measured
  const measuredContext =
    measured === null
      ? calc.measured.from === 0
        ? "Enter an original amount other than 0."
        : undefined
      : measured > 0
        ? `${from} to ${to} is a ${formatResult(measured)}% increase.`
        : `${from} decreased to ${to} is a ${formatResult(Math.abs(measured))}% decrease.`

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <CalculatorCard
        title="Decrease by a percent"
        description="Starting amount and the percent it shrinks by."
        fields={[
          { label: "Original amount", value: original, onChange: (value) => calc.set("of", value), placeholder: "80" },
          { label: "Decrease", value: percent, onChange: (value) => calc.set("percent", value), placeholder: "15", suffix: "%" },
        ]}
        primary={{ label: "Amount remaining", value: calc.next }}
        secondary={[
          { label: "Original", value: original === "" ? null : original },
          { label: "Decrease", value: calc.delta },
        ]}
        context={applyContext}
        formula={calc.next === null ? undefined : `${original} × (1 − ${percent} ÷ 100) = ${formatResult(calc.next)}`}
        copyText={applyContext}
        share
        onReset={calc.reset}
      />
      <CalculatorCard
        title="Find the percentage decrease"
        description="Original value and the new value."
        delay={140}
        fields={[
          { label: "Original value", value: from, onChange: (value) => calc.set("from", value), placeholder: "80" },
          { label: "New value", value: to, onChange: (value) => calc.set("to", value), placeholder: "68" },
        ]}
        primary={{ label: "Percentage decrease", value: drop, suffix: "%" }}
        secondary={[
          { label: "Original", value: from === "" ? null : from },
          { label: "New", value: to === "" ? null : to },
          { label: "Decrease", value: calc.measured.delta === null ? null : Math.abs(calc.measured.delta) },
        ]}
        context={measuredContext}
        formula={drop === null ? undefined : `(${from} − ${to}) ÷ ${from} × 100 = ${formatResult(drop)}%`}
        copyText={measuredContext}
        share
      />
    </div>
  )
}

function DiscountCards({ calc }: { calc: Calc }) {
  const percent = calc.values.percent ?? ""
  const original = calc.values.of ?? ""
  const from = calc.values.from ?? ""
  const to = calc.values.to ?? ""
  const originalAmount = Number(original)
  const sale = calc.next
  const saved = calc.delta
  const applyContext =
    sale === null || saved === null || !Number.isFinite(originalAmount)
      ? undefined
      : `${percent}% off ${money(originalAmount)} is ${money(sale)}. You save ${money(saved)}.`
  const measured = calc.measured.percent
  const off = measured === null ? null : -measured
  const fromAmount = calc.measured.from
  const toAmount = calc.measured.to
  const measuredContext =
    off === null || fromAmount === null || toAmount === null
      ? fromAmount === 0
        ? "Enter an original price other than 0."
        : undefined
      : off < 0
        ? "The sale price is higher than the original."
        : `${money(fromAmount)} to ${money(toAmount)} is ${formatResult(off)}% off. You save ${money(fromAmount - toAmount)}.`

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <CalculatorCard
        title="Apply a discount"
        description="Sticker price and the percent off."
        fields={[
          { label: "Original price", value: original, onChange: (value) => calc.set("of", value), placeholder: "120", suffix: "AUD" },
          { label: "Discount", value: percent, onChange: (value) => calc.set("percent", value), placeholder: "25", suffix: "%" },
        ]}
        presets={{
          label: "Common discounts",
          values: discountPresets,
          current: percent,
          onSelect: (value) => calc.set("percent", value),
        }}
        primary={{ label: "Final price", value: sale === null ? null : money(sale) }}
        secondary={[
          { label: "You save", value: saved === null ? null : money(saved) },
          { label: "Original", value: Number.isFinite(originalAmount) && original !== "" ? money(originalAmount) : null },
        ]}
        context={applyContext}
        formula={sale === null ? undefined : `${original} × (1 − ${percent} ÷ 100) = ${formatResult(sale)}`}
        copyText={applyContext}
        share
        onReset={calc.reset}
      />
      <CalculatorCard
        title="What percent off was this?"
        description="Original price and the sale price."
        delay={140}
        fields={[
          { label: "Original price", value: from, onChange: (value) => calc.set("from", value), placeholder: "120", suffix: "AUD" },
          { label: "Sale price", value: to, onChange: (value) => calc.set("to", value), placeholder: "90", suffix: "AUD" },
        ]}
        primary={{ label: "Discount", value: off, suffix: "%" }}
        secondary={[
          {
            label: "You save",
            value: fromAmount === null || toAmount === null ? null : money(fromAmount - toAmount),
          },
        ]}
        context={measuredContext}
        formula={off === null ? undefined : `(${from} − ${to}) ÷ ${from} × 100 = ${formatResult(off)}%`}
        copyText={measuredContext}
        share
      />
    </div>
  )
}
