"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { StyleSettings } from "@/lib/sankey/types"

export function CustomizePanel({
  style,
  onChange,
}: {
  style: StyleSettings
  onChange: (next: Partial<StyleSettings>) => void
}) {
  return (
    <Tabs defaultValue="appearance" className="w-full">
      <TabsList variant="line" className="w-full">
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="layout">Layout</TabsTrigger>
        <TabsTrigger value="type">Type</TabsTrigger>
      </TabsList>

      <TabsContent value="appearance" className="flex flex-col gap-5 pt-5">
        <ColorField
          label="Node colour"
          value={style.nodeColor}
          onChange={(nodeColor) => onChange({ nodeColor })}
        />
        <ColorField
          label="Flow colour"
          value={style.flowColor}
          onChange={(flowColor) => onChange({ flowColor })}
        />
        <ColorField
          label="Background"
          value={style.background}
          onChange={(background) => onChange({ background })}
        />
        <ColorField
          label="Label colour"
          value={style.labelColor}
          onChange={(labelColor) => onChange({ labelColor })}
        />
        <ToggleField
          label="Show values"
          checked={style.showValues}
          onChange={(showValues) => onChange({ showValues })}
        />
        <ToggleField
          label="Show labels"
          checked={style.showLabels}
          onChange={(showLabels) => onChange({ showLabels })}
        />
      </TabsContent>

      <TabsContent value="layout" className="flex flex-col gap-5 pt-5">
        <SliderField
          label="Node width"
          value={style.nodeWidth}
          min={8}
          max={36}
          onChange={(nodeWidth) => onChange({ nodeWidth })}
        />
        <SliderField
          label="Node spacing"
          value={style.nodeSpacing}
          min={8}
          max={48}
          onChange={(nodeSpacing) => onChange({ nodeSpacing })}
        />
        <SliderField
          label="Minimum height"
          value={style.minNodeHeight}
          min={8}
          max={40}
          onChange={(minNodeHeight) => onChange({ minNodeHeight })}
        />
        <SliderField
          label="Flow opacity"
          value={Math.round(style.flowOpacity * 100)}
          min={8}
          max={80}
          onChange={(value) => onChange({ flowOpacity: value / 100 })}
        />
        <ToggleField
          label="Automatic layout"
          checked={style.autoLayout}
          onChange={(autoLayout) => onChange({ autoLayout })}
        />
        <fieldset className="flex flex-col gap-2">
          <Label className="text-[13px] font-medium text-[var(--nb-primary)]">Label position</Label>
          <div className="flex gap-2">
            {(["outside", "inside"] as const).map((position) => (
              <button
                key={position}
                type="button"
                onClick={() => onChange({ labelPosition: position })}
                className={`h-8 rounded-lg px-2.5 text-[13px] capitalize ${
                  style.labelPosition === position
                    ? "bg-[var(--nb-primary)] text-white"
                    : "bg-[var(--nb-accent)] text-[var(--nb-primary)]"
                }`}
              >
                {position}
              </button>
            ))}
          </div>
        </fieldset>
      </TabsContent>

      <TabsContent value="type" className="flex flex-col gap-5 pt-5">
        <SliderField
          label="Label size"
          value={style.labelSize}
          min={10}
          max={18}
          onChange={(labelSize) => onChange({ labelSize })}
        />
        <SliderField
          label="Value size"
          value={style.valueSize}
          min={9}
          max={16}
          onChange={(valueSize) => onChange({ valueSize })}
        />
        <fieldset className="flex flex-col gap-2">
          <Label className="text-[13px] font-medium text-[var(--nb-primary)]">Weight</Label>
          <div className="flex gap-2">
            {([400, 500, 600] as const).map((weight) => (
              <button
                key={weight}
                type="button"
                onClick={() => onChange({ labelWeight: weight })}
                className={`h-8 rounded-lg px-2.5 text-[13px] ${
                  style.labelWeight === weight
                    ? "bg-[var(--nb-primary)] text-white"
                    : "bg-[var(--nb-accent)] text-[var(--nb-primary)]"
                }`}
              >
                {weight === 400 ? "Regular" : weight === 500 ? "Medium" : "Semibold"}
              </button>
            ))}
          </div>
        </fieldset>
      </TabsContent>
    </Tabs>
  )
}

function ColorField({
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

function ToggleField({
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

function SliderField({
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
