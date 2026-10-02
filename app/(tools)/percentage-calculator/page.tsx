"use client"

import { NiceLogo } from "@/components/NiceLogo"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useId, useMemo, useState } from "react"

const reveal =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 ease-out motion-reduce:animate-none"

function parseNumber(value: string): number | null {
  if (value.trim() === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function formatResult(value: number): string {
  return Number(value.toFixed(4)).toLocaleString("en-AU", { maximumFractionDigits: 4 })
}

export default function PercentageCalculatorPage() {
  const [part, setPart] = useState("")
  const [whole, setWhole] = useState("")
  const [percent, setPercent] = useState("")
  const [ofValue, setOfValue] = useState("")

  const whatPercent = useMemo(() => {
    const x = parseNumber(part)
    const y = parseNumber(whole)
    if (x === null || y === null || y === 0) return null
    return (x / y) * 100
  }, [part, whole])

  const percentOf = useMemo(() => {
    const x = parseNumber(percent)
    const y = parseNumber(ofValue)
    if (x === null || y === null) return null
    return (x / 100) * y
  }, [percent, ofValue])

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
          Percentage Calculator
        </h1>
        <p className="text-sm text-[var(--nb-secondary)]">Results update as you type.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <CalculatorCard
          title="X is what percent of Y"
          description="Find the share one number is of another."
          delay={80}
          fields={[
            { label: "X", value: part, onChange: setPart, placeholder: "25" },
            { label: "Y", value: whole, onChange: setWhole, placeholder: "200" },
          ]}
          result={whatPercent}
          suffix="%"
        />
        <CalculatorCard
          title="What is X% of Y"
          description="Take a percentage of a number."
          delay={140}
          fields={[
            { label: "X", value: percent, onChange: setPercent, placeholder: "15", suffix: "%" },
            { label: "Y", value: ofValue, onChange: setOfValue, placeholder: "80" },
          ]}
          result={percentOf}
        />
      </div>
    </main>
  )
}

interface Field {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  suffix?: string
}

function CalculatorCard({
  title,
  description,
  fields,
  result,
  suffix,
  delay,
}: {
  title: string
  description: string
  fields: Field[]
  result: number | null
  suffix?: string
  delay: number
}) {
  const id = useId()
  const formatted = result === null ? null : formatResult(result)

  return (
    <Card
      className={`gap-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] [--card-spacing:--spacing(6)] ${reveal}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="gap-1.5">
        <CardTitle className="text-[15px] font-medium tracking-[-0.01em] text-[var(--nb-primary)]">
          {title}
        </CardTitle>
        <CardDescription className="text-[13px] text-[var(--nb-secondary)]">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-4">
        {fields.map((field, index) => (
          <div key={field.label} className="flex flex-col gap-2">
            <Label htmlFor={`${id}-${index}`} className="text-[13px] text-[var(--nb-primary)]">
              {field.label}
            </Label>
            <div className="relative">
              <Input
                id={`${id}-${index}`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder={field.placeholder}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                className={cn("h-10 text-base tabular-nums", field.suffix && "pr-8")}
              />
              {field.suffix ? (
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[var(--nb-secondary)]">
                  {field.suffix}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>

      <CardFooter className="flex-col items-start gap-1 bg-[var(--nb-accent)]/70 py-6">
        <span className="text-xs font-medium text-[var(--nb-secondary)]">Result</span>
        <output
          aria-live="polite"
          className="flex h-14 items-baseline text-5xl leading-none font-semibold tracking-[-0.04em] text-[var(--nb-primary)] tabular-nums"
        >
          {formatted === null ? (
            <span className="text-black/15">—</span>
          ) : (
            <span
              key={formatted}
              className="animate-in fade-in zoom-in-[0.97] duration-200 ease-out motion-reduce:animate-none"
            >
              {formatted}
              {suffix ? (
                <span className="ml-0.5 text-3xl font-medium text-[var(--nb-secondary)]">
                  {suffix}
                </span>
              ) : null}
            </span>
          )}
        </output>
      </CardFooter>
    </Card>
  )
}
