"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { VizMeta } from "@/lib/viz/style"

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-[13px] font-medium text-[var(--nb-primary)]">{label}</span>
      <span className="flex items-center gap-2 text-[13px] text-[var(--nb-secondary)] tabular-nums">
        {value}
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-7 cursor-pointer rounded-md border border-black/10 bg-white p-0.5"
          aria-label={label}
        />
      </span>
    </label>
  )
}

export function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-[13px] font-medium text-[var(--nb-primary)]">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} size="sm" />
    </label>
  )
}

export function SliderField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-[13px] font-medium text-[var(--nb-primary)]">{label}</Label>
        <span className="text-[13px] text-[var(--nb-secondary)] tabular-nums">{value}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        onValueChange={(next) => {
          const resolved = Array.isArray(next) ? next[0] : next
          if (typeof resolved === "number") onChange(resolved)
        }}
      />
    </div>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <Label className="text-[13px] font-medium text-[var(--nb-primary)]">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "h-8 rounded-lg px-2.5 text-[13px]",
              value === option.id
                ? "bg-[var(--nb-primary)] text-white"
                : "bg-[var(--nb-accent)] text-[var(--nb-primary)]"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function MetaFields({
  meta,
  onChange,
}: {
  meta: VizMeta
  onChange: (next: Partial<VizMeta>) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-[var(--nb-primary)]">Title</span>
        <Input value={meta.title} onChange={(event) => onChange({ title: event.target.value })} className="h-9" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-[var(--nb-primary)]">Subtitle</span>
        <Input
          value={meta.subtitle}
          onChange={(event) => onChange({ subtitle: event.target.value })}
          className="h-9"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-[var(--nb-primary)]">Source</span>
        <Input value={meta.source} onChange={(event) => onChange({ source: event.target.value })} className="h-9" />
      </label>
    </div>
  )
}
