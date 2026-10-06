"use client"

import { CalculatorExample, CalculatorPrivacy, CalculatorResult } from "@/components/calculators/CalculatorResult"
import { CopyButton, NumberField, TextArea } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toolSpecs, type SpecField, type SpecResult, type ToolSpec } from "@/lib/tools/specs"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"

const controlClass =
  "h-11 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-10"

export function BoundSpec({ slug }: { slug: string }) {
  const spec = toolSpecs[slug]
  if (!spec) return null
  return <SpecTool spec={spec} />
}

export function SpecTool({ spec }: { spec: ToolSpec }) {
  const [values, setValues] = useState(() => Object.fromEntries(spec.fields.map((field) => [field.key, field.default])))
  const [nonce, setNonce] = useState(0)
  const [asyncResult, setAsyncResult] = useState<SpecResult | null>(null)

  const result = useMemo(() => {
    if (spec.random || spec.runAsync) return null
    try {
      return spec.run(values)
    } catch (error) {
      return { note: error instanceof Error ? error.message : "Could not calculate that." }
    }
  }, [spec, values])

  useEffect(() => {
    if (!spec.random && !spec.runAsync) return
    let cancel = false
    const apply = (next: SpecResult | null) => {
      if (!cancel) setAsyncResult(next)
    }
    if (spec.runAsync) {
      spec
        .runAsync(values)
        .then(apply)
        .catch((error: unknown) => apply({ note: error instanceof Error ? error.message : "Could not calculate that." }))
    } else {
      try {
        apply(spec.run(values))
      } catch (error) {
        apply({ note: error instanceof Error ? error.message : "Could not calculate that." })
      }
    }
    return () => {
      cancel = true
    }
  }, [spec, values, nonce])

  const shown = spec.random || spec.runAsync ? asyncResult : result
  const primary = shown?.stats?.find((item) => item.primary)
  const secondary = shown?.stats?.filter((item) => item !== primary)
  const copyText = shown?.copy ?? shown?.text ?? shown?.stats?.map((item) => `${item.label}: ${item.value}`).join("\n") ?? ""
  const dirty = spec.fields.some((field) => (values[field.key] ?? "") !== field.default)

  function set(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function reset() {
    setValues(Object.fromEntries(spec.fields.map((field) => [field.key, field.default])))
  }

  return (
    <div className="flex flex-col gap-8">
      {spec.intro ? <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">{spec.intro}</p> : null}
      {spec.fields.length ? (
        <div className={cn("grid gap-4", spec.columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {spec.fields.map((field) => (
            <SpecControl key={field.key} field={field} value={values[field.key] ?? ""} onChange={(value) => set(field.key, value)} />
          ))}
        </div>
      ) : null}
      {spec.example ? <CalculatorExample label={spec.example.label} onClick={() => setValues({ ...values, ...spec.example?.values })} /> : null}
      {spec.action || dirty ? (
        <div className="flex flex-wrap gap-2">
          {spec.action ? (
            <Button type="button" className="h-10" onClick={() => setNonce((current) => current + 1)}>
              {spec.action}
            </Button>
          ) : null}
          {dirty ? (
            <Button type="button" variant="outline" className="h-10" onClick={reset}>
              Reset
            </Button>
          ) : null}
        </div>
      ) : null}
      {primary ? (
        <CalculatorResult
          primary={primary}
          secondary={secondary}
          context={shown?.copy}
          formula={shown?.formula}
          note={shown?.note}
          copyText={copyText}
        />
      ) : (
        <div className="flex flex-col gap-4" aria-live="polite">
          {shown?.demo ? (
            <div className="grid h-32 place-items-center rounded-xl border border-border">
              <div className="size-16 bg-[var(--nb-accent)]" style={shown.demo} />
            </div>
          ) : null}
          {shown?.stats?.length ? (
            <div className="flex flex-wrap gap-x-10 gap-y-6">
              {shown.stats.map((item) => (
                <div key={item.label}>
                  <div className="text-xs font-medium text-[var(--nb-secondary)]">{item.label}</div>
                  <div
                    className={cn(
                      "mt-1 max-w-xl font-semibold tracking-[-0.04em] text-[var(--nb-primary)] tabular-nums",
                      item.value.length > 18 ? "text-base leading-snug font-medium break-all" : "text-2xl leading-tight sm:text-3xl",
                    )}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {shown?.formula ? <p className="font-mono text-[13px] text-[var(--nb-secondary)]">{shown.formula}</p> : null}
          {shown?.text ? (
            <pre className="overflow-x-auto rounded-xl border border-border bg-[var(--nb-accent)] p-4 text-sm leading-relaxed whitespace-pre-wrap text-[var(--nb-primary)]">
              {shown.text}
            </pre>
          ) : null}
          {shown?.note ? <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">{shown.note}</p> : null}
          {!shown && !spec.random && !spec.runAsync ? (
            <p className="text-sm text-[var(--nb-secondary)]">Enter the figures to see a result.</p>
          ) : null}
          {copyText ? <CopyButton text={copyText} label="Copy result" /> : null}
        </div>
      )}
      {spec.privacy ? <CalculatorPrivacy /> : null}
    </div>
  )
}

function SpecControl({ field, value, onChange }: { field: SpecField; value: string; onChange: (value: string) => void }) {
  if (field.kind === "number") {
    return (
      <NumberField
        label={field.label}
        value={value}
        onChange={onChange}
        suffix={field.suffix}
        min={field.min}
        step={field.step}
        placeholder={field.placeholder}
      />
    )
  }
  if (field.kind === "textarea") {
    return (
      <div className="sm:col-span-full">
        <TextArea label={field.label} value={value} onChange={onChange} placeholder={field.placeholder} rows={field.rows} />
      </div>
    )
  }
  if (field.kind === "check") {
    return (
      <label className="flex items-center gap-2 self-end pb-2 text-sm text-[var(--nb-primary)]">
        <input
          type="checkbox"
          checked={value === "yes"}
          onChange={(event) => onChange(event.target.checked ? "yes" : "")}
          className="size-4 accent-[var(--nb-primary)]"
        />
        {field.label}
      </label>
    )
  }
  if (field.kind === "select") {
    const options = field.options ?? []
    const hasGroups = options.some((option) => option.group)
    const groups = new Map<string, { value: string; label: string }[]>()
    if (hasGroups) {
      for (const option of options) {
        const group = option.group ?? "Other"
        const list = groups.get(group) ?? []
        list.push(option)
        groups.set(group, list)
      }
    }
    return (
      <label className="flex flex-col gap-2 text-[13px] text-[var(--nb-primary)]">
        {field.label}
        <select className={controlClass} value={value} onChange={(event) => onChange(event.target.value)}>
          {hasGroups
            ? [...groups.entries()].map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))
            : options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
        </select>
      </label>
    )
  }
  if (field.kind === "color") {
    return (
      <label className="flex flex-col gap-2 text-[13px] text-[var(--nb-primary)]">
        {field.label}
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full cursor-pointer rounded-lg border border-input bg-transparent p-1 sm:h-10" />
      </label>
    )
  }
  return (
    <label className="flex flex-col gap-2 text-[13px] text-[var(--nb-primary)]">
      {field.label}
      <Input
        value={value}
        placeholder={field.placeholder}
        type={field.kind === "date" ? "date" : "text"}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 sm:h-10"
      />
    </label>
  )
}
