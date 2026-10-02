"use client"

import { CalculatorCard } from "@/components/calculators/CalculatorCard"
import { RelatedCalculators } from "@/components/calculators/RelatedCalculators"
import { NiceLogo } from "@/components/NiceLogo"
import { buttonVariants } from "@/components/ui/button"
import type { PercentagePageContent } from "@/lib/calculators/content"
import { usePercentage } from "@/lib/calculators/usePercentage"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const reveal =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 ease-out motion-reduce:animate-none"

export function PercentageClusterView({ page }: { page: PercentagePageContent }) {
  const calc = usePercentage(page.mode)

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pt-10 pb-24 sm:pt-14">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2.5 w-fit text-[var(--nb-secondary)] hover:text-[var(--nb-primary)]"
        )}
      >
        <ArrowLeft />
        <NiceLogo className="h-5" />
      </Link>

      <header className={`mt-10 mb-10 flex flex-col gap-3 ${reveal}`}>
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

      <section className="mt-16 flex max-w-2xl flex-col gap-3">
        <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
          Worked example
        </h2>
        <p className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">{page.example}</p>
      </section>

      <section className="mt-12 flex max-w-2xl flex-col gap-5">
        <h2 className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
          FAQ
        </h2>
        <dl className="flex flex-col gap-5">
          {page.faqs.map((faq) => (
            <div key={faq.question} className="flex flex-col gap-1.5">
              <dt className="text-[15px] font-medium tracking-[-0.01em] text-[var(--nb-primary)]">
                {faq.question}
              </dt>
              <dd className="text-[13px] leading-relaxed text-[var(--nb-secondary)]">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <RelatedCalculators currentSlug={page.slug} />
    </main>
  )
}
