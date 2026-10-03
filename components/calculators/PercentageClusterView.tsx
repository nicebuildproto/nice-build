"use client"

import { CalculatorCard } from "@/components/calculators/CalculatorCard"
import { ToolGuide } from "@/components/tools/ToolGuide"
import { PageShell } from "@/components/site/PageShell"
import type { PercentagePageContent } from "@/lib/calculators/content"
import { usePercentage } from "@/lib/calculators/usePercentage"

const reveal =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 ease-out motion-reduce:animate-none"

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

      {page.mode === "basic" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <CalculatorCard
            title="X is what percent of Y"
            description="Find the share one number is of another."
            delay={80}
            fields={[
              { label: "X", value: calc.part, onChange: calc.setPart, placeholder: "25" },
              { label: "Y", value: calc.whole, onChange: calc.setWhole, placeholder: "200" },
            ]}
            results={[{ label: "Result", value: calc.whatPercent, suffix: "%" }]}
          />
          <CalculatorCard
            title="What is X% of Y"
            description="Take a percentage of a number."
            delay={140}
            fields={[
              {
                label: "X",
                value: calc.percent,
                onChange: calc.setPercent,
                placeholder: "15",
                suffix: "%",
              },
              { label: "Y", value: calc.ofValue, onChange: calc.setOfValue, placeholder: "80" },
            ]}
            results={[{ label: "Result", value: calc.percentOf }]}
          />
        </div>
      ) : (
        <div className="max-w-xl">
          <CalculatorCard
            title={
              page.mode === "increase"
                ? "Increase an amount"
                : page.mode === "decrease"
                  ? "Decrease an amount"
                  : "Apply a discount"
            }
            description={
              page.mode === "discount"
                ? "Sticker price and the percent off."
                : "Starting amount and the percent change."
            }
            fields={[
              {
                label: page.mode === "discount" ? "Discount" : page.mode === "increase" ? "Increase" : "Decrease",
                value: calc.percent,
                onChange: calc.setPercent,
                placeholder: page.mode === "increase" ? "20" : page.mode === "decrease" ? "15" : "25",
                suffix: "%",
              },
              {
                label: page.mode === "discount" ? "Original price" : "Original amount",
                value: calc.ofValue,
                onChange: calc.setOfValue,
                placeholder: page.mode === "increase" ? "50" : page.mode === "decrease" ? "80" : "120",
              },
            ]}
            results={[
              {
                label:
                  page.mode === "discount"
                    ? "Sale price"
                    : page.mode === "increase"
                      ? "New amount"
                      : "Amount remaining",
                value: calc.next,
              },
              {
                label: page.mode === "discount" ? "You save" : page.mode === "increase" ? "Increase" : "Decrease",
                value: calc.delta,
              },
            ]}
          />
        </div>
      )}

      <ToolGuide slug={page.slug} />
    </PageShell>
  )
}
