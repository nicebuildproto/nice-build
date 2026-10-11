"use client"

import {
  CopyButton,
  CopyResetShare,
  EverydayToolShell,
  Note,
  ResetButton,
  ResultDisplay,
} from "@/components/everyday/kit"
import { NumberField, Stat, TextArea } from "@/components/tools/ui"
import { Input } from "@/components/ui/input"
import { ageDetails, formatAge, localDateValue } from "@/lib/everyday/age"
import { carbonEstimate, parseHourField, screenKeys, screenLabels, screenTime, type ScreenKey } from "@/lib/everyday/audit"
import { batteryQuestions, batteryRead } from "@/lib/everyday/battery"
import { sampleRecipe, scaledRecipe } from "@/lib/everyday/recipe"
import { num } from "@/lib/tools/format"
import { useEffect, useMemo, useState } from "react"

export function AgeCalculator() {
  const [dob, setDob] = useState("1994-06-12")
  const [asOf, setAsOf] = useState("")
  useEffect(() => {
    setAsOf(localDateValue())
  }, [])
  const result = ageDetails(dob, asOf)
  const copy = result
    ? `${formatAge(result)}. ${result.totalDays.toLocaleString("en-AU")} days. Next birthday ${result.nextBirthdayLabel}${result.daysUntilBirthday === 0 ? " — that’s today." : ` in ${result.daysUntilBirthday} days.`}`
    : ""

  return (
    <EverydayToolShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-[13px]">
          Date of birth
          <Input type="date" value={dob} onChange={(event) => setDob(event.target.value)} className="h-10" />
        </label>
        <label className="flex flex-col gap-2 text-[13px]">
          As of
          <Input type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} className="h-10" />
        </label>
      </div>
      <div className="flex flex-col gap-4" aria-live="polite">
        <div className="flex flex-wrap gap-10">
          <Stat label="Years" value={result ? String(result.years) : "—"} />
          <Stat label="Months" value={result ? String(result.months) : "—"} />
          <Stat label="Days" value={result ? String(result.days) : "—"} />
        </div>
        {result ? (
          <div className="flex flex-col gap-2 text-sm text-[var(--nb-secondary)]">
            <p>Born on a {result.weekdayBorn}.</p>
            <p>{result.totalDays.toLocaleString("en-AU")} days in total.</p>
            <p>
              Next birthday {result.nextBirthdayLabel}
              {result.daysUntilBirthday === 0 ? " — that’s today." : ` · ${result.daysUntilBirthday} days.`}
            </p>
          </div>
        ) : (
          <Note>{asOf ? "The as-of date has to be on or after the date of birth." : "Setting today’s date…"}</Note>
        )}
      </div>
      <CopyResetShare
        text={copy}
        title="Age"
        onReset={() => {
          setDob("1994-06-12")
          setAsOf(localDateValue())
        }}
      />
    </EverydayToolShell>
  )
}

export function RecipeScaler() {
  const [from, setFrom] = useState("4")
  const [to, setTo] = useState("6")
  const [recipe, setRecipe] = useState(sampleRecipe)
  const fromN = Number(from)
  const toN = Number(to)
  const scaled = useMemo(() => scaledRecipe(recipe, fromN, toN), [recipe, fromN, toN])

  return (
    <EverydayToolShell>
      <div className="grid max-w-md gap-4 sm:grid-cols-2">
        <NumberField label="Current serves" value={from} onChange={setFrom} min={0} />
        <NumberField label="New serves" value={to} onChange={setTo} min={0} />
      </div>
      <TextArea label="Recipe" value={recipe} onChange={setRecipe} rows={8} />
      <Note>A quantity at the start of a line is scaled. Fractions such as 1/2 or 1 1/2 are read.</Note>
      <pre
        tabIndex={0}
        aria-label="Scaled recipe"
        className="min-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border px-4 py-3 text-base leading-relaxed sm:text-sm"
      >
        {scaled ?? "Enter a current serve count above zero."}
      </pre>
      <CopyResetShare
        text={scaled ?? ""}
        title="Recipe"
        onReset={() => {
          setFrom("4")
          setTo("6")
          setRecipe(sampleRecipe)
        }}
      />
    </EverydayToolShell>
  )
}

export function SocialBatteryCheckin() {
  const [answers, setAnswers] = useState<boolean[]>([])
  const step = answers.length
  const done = step >= batteryQuestions.length
  const rests = answers.filter(Boolean).length

  if (done) {
    const copy = batteryRead(rests)
    return (
      <EverydayToolShell>
        <ResultDisplay>{copy.title}</ResultDisplay>
        <Note>{copy.note}</Note>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton text={`${copy.title} ${copy.note}`} />
          <ResetButton
            onClick={() => setAnswers([])}
            label="Start again"
          />
          <button
            type="button"
            className="text-sm text-[var(--nb-secondary)] underline-offset-4 hover:underline"
            onClick={() => setAnswers((current) => current.slice(0, -1))}
          >
            Back
          </button>
        </div>
      </EverydayToolShell>
    )
  }

  const question = batteryQuestions[step]
  return (
    <EverydayToolShell>
      <Note>Three short questions about how social plans feel right now. The reply is a light nudge, not a score.</Note>
      <p className="text-sm text-[var(--nb-secondary)]" aria-live="polite">
        {step + 1} of {batteryQuestions.length}
      </p>
      <h2 className="text-2xl font-semibold tracking-[-0.03em]">{question.prompt}</h2>
      <div className="flex flex-col gap-2" role="group" aria-label={question.prompt}>
        {question.options.map((option) => (
          <button
            key={option.label}
            type="button"
            className="rounded-xl border border-border px-4 py-3 text-left text-[15px] outline-none hover:bg-[var(--nb-accent)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => setAnswers((current) => [...current, option.rest])}
          >
            {option.label}
          </button>
        ))}
      </div>
      {step > 0 ? (
        <button
          type="button"
          className="w-fit text-sm text-[var(--nb-secondary)] underline-offset-4 hover:underline"
          onClick={() => setAnswers((current) => current.slice(0, -1))}
        >
          Back
        </button>
      ) : null}
    </EverydayToolShell>
  )
}

const screenDefaults: Record<ScreenKey, string> = {
  social: "1.5",
  video: "1",
  games: "0.5",
  work: "6",
  other: "0.5",
}

export function ScreenTimeAudit() {
  const [values, setValues] = useState(screenDefaults)
  const parsed = screenKeys.map((key) => parseHourField(values[key]))
  const hoursOk = parsed.every((value): value is number => value !== null)
  const hours = Object.fromEntries(screenKeys.map((key, index) => [key, parsed[index] ?? 0])) as Record<ScreenKey, number>
  const result = hoursOk ? screenTime(hours) : null
  const copy = result
    ? `${num(result.day)} hours a day · ${num(result.week)} hours a week · ${num(result.year, 0)} hours a year (${num(result.yearDays, 0)} twenty-four-hour days).`
    : ""

  return (
    <EverydayToolShell>
      <Note>Hours a day by category. Weekly is that day times 7. Yearly is the day times 365. Nothing is read from the device.</Note>
      <div className="grid gap-4 sm:grid-cols-2">
        {screenKeys.map((key) => (
          <NumberField
            key={key}
            label={screenLabels[key]}
            value={values[key]}
            onChange={(value) => setValues((current) => ({ ...current, [key]: value }))}
            suffix="h"
            min={0}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-10" aria-live="polite">
        <Stat label="A day" value={result ? `${num(result.day)} h` : "—"} />
        <Stat label="A week" value={result ? `${num(result.week)} h` : "—"} />
        <Stat label="A year" value={result ? `${num(result.year, 0)} h` : "—"} />
      </div>
      {result ? (
        <Note>
          That’s about {num(result.percentDay, 0)}% of a 24-hour day, or {num(result.yearDays, 0)} full days across a year.
        </Note>
      ) : (
        <Note>Use hours as numbers, including decimals. Blank counts as zero.</Note>
      )}
      <CopyResetShare
        text={copy}
        title="Screen time"
        onReset={() => setValues(screenDefaults)}
      />
    </EverydayToolShell>
  )
}

export function CarbonFootprintEstimator() {
  const [streaming, setStreaming] = useState("7")
  const [prompts, setPrompts] = useState("20")
  const result = carbonEstimate(Number(streaming), Number(prompts))
  const copy = result
    ? `Streaming about ${num(result.streamYearG, 0)} g CO2 a year. AI prompts about ${num(result.aiYearG, 0)} g. Combined ${num(result.combinedKg)} kg. Illustrative factors only.`
    : ""

  return (
    <EverydayToolShell>
      <Note>
        Rough estimates from published third-party research, not a measurement of your devices or your grid. Streaming
        uses the IEA’s 36 g CO2 per hour of video on a global average grid (commentary, December 2020). Each AI text
        prompt uses 0.03 g CO2e, Google’s median Gemini Apps text prompt from May 2025.
      </Note>
      <div className="grid max-w-md gap-4 sm:grid-cols-2">
        <NumberField label="Streaming hours a week" value={streaming} onChange={setStreaming} suffix="h" min={0} />
        <NumberField label="AI prompts a day" value={prompts} onChange={setPrompts} min={0} />
      </div>
      <div className="flex flex-wrap gap-10" aria-live="polite">
        <Stat label="Streaming, a year" value={result ? `${num(result.streamYearG, 0)} g` : "—"} />
        <Stat label="AI prompts, a year" value={result ? `${num(result.aiYearG, 0)} g` : "—"} />
        <Stat label="Combined, a year" value={result ? `${num(result.combinedKg)} kg` : "—"} />
      </div>
      <Note>Illustrative factors only. Not a precise footprint.</Note>
      <CopyResetShare
        text={copy}
        title="Carbon estimate"
        onReset={() => {
          setStreaming("7")
          setPrompts("20")
        }}
      />
    </EverydayToolShell>
  )
}
