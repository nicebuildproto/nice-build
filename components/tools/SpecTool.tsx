"use client"

import { CopyButton, NumberField, TextArea } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toolSpecs, type SpecField, type SpecResult, type ToolSpec } from "@/lib/tools/specs"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"

const controlClass = "h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm"

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
  const copyText = shown?.text ?? shown?.stats?.map((item) => `${item.label}: ${item.value}`).join("\n") ?? ""

  function set(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
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
      {spec.action ? (
        <Button type="button" className="w-fit" onClick={() => setNonce((current) => current + 1)}>
          {spec.action}
        </Button>
      ) : null}
      {shown?.demo ? (
        <div className="grid h-32 place-items-center rounded-xl border border-border">
          <div className="size-16 bg-[var(--nb-accent)]" style={shown.demo} />
        </div>
      ) : null}
      {shown?.stats?.length ? (
        <div className="flex flex-wrap gap-10">
          {shown.stats.map((item) => (
            <div key={item.label}>
              <div className="text-xs font-medium text-[var(--nb-secondary)]">{item.label}</div>
              <div className="mt-1 max-w-xl text-2xl leading-tight font-semibold tracking-[-0.04em] text-[var(--nb-primary)] tabular-nums">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {shown?.text ? (
        <pre className="overflow-x-auto rounded-xl border border-border bg-[var(--nb-accent)] p-4 text-sm leading-relaxed whitespace-pre-wrap text-[var(--nb-primary)]">
          {shown.text}
        </pre>
      ) : null}
      {shown?.note ? <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">{shown.note}</p> : null}
      {!shown && !spec.random && !spec.runAsync ? (
        <p className="text-sm text-[var(--nb-secondary)]">Add the figures above.</p>
      ) : null}
      {copyText ? <CopyButton text={copyText} /> : null}
    </div>
  )
}

function SpecControl({ field, value, onChange }: { field: SpecField; value: string; onChange: (value: string) => void }) {
  if (field.kind === "number") {
    return <NumberField label={field.label} value={value} onChange={onChange} suffix={field.suffix} min={field.min} step={field.step} />
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
    return (
      <label className="flex flex-col gap-2 text-[13px] text-[var(--nb-primary)]">
        {field.label}
        <select className={controlClass} value={value} onChange={(event) => onChange(event.target.value)}>
          {field.options?.map((option) => (
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
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-input bg-transparent p-1" />
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
        className="h-10"
      />
    </label>
  )
}
