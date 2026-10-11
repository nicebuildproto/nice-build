"use client"

import { MetaFields, Segmented, SliderField, ToggleField } from "@/components/viz/fields"
import { defaultVizStyle, type VizStyle } from "@/lib/viz/style"
import { vizThemes, type StageTone, type VizThemeId } from "@/lib/viz/themes"
import type { VizMeta } from "@/lib/viz/style"
import type { ReactNode } from "react"

export function VizCustomize({
  style,
  meta,
  onStyle,
  onMeta,
  extra,
  afterTheme,
  omit = [],
}: {
  style: VizStyle
  meta: VizMeta
  onStyle: (next: Partial<VizStyle>) => void
  onMeta: (next: Partial<VizMeta>) => void
  extra?: ReactNode
  /** Rendered directly under the theme control. */
  afterTheme?: ReactNode
  omit?: Array<"theme" | "values" | "labels" | "percent" | "grid" | "legend">
}) {
  return (
    <div className="flex flex-col gap-6">
      <Segmented
        label="Stage"
        value={style.stage}
        options={[
          { id: "white", label: "White" },
          { id: "dusk", label: "Dusk" },
        ]}
        onChange={(stage: StageTone) => onStyle({ stage })}
      />
      {omit.includes("theme") ? null : (
        <Segmented
          label="Theme"
          value={style.theme}
          options={Object.values(vizThemes).map((theme) => ({ id: theme.id, label: theme.label }))}
          onChange={(theme: VizThemeId) => onStyle({ theme })}
        />
      )}
      {afterTheme}
      {omit.includes("values") ? null : (
        <ToggleField label="Show values" checked={style.showValues} onChange={(showValues) => onStyle({ showValues })} />
      )}
      {omit.includes("labels") ? null : (
        <ToggleField label="Show labels" checked={style.showLabels} onChange={(showLabels) => onStyle({ showLabels })} />
      )}
      {omit.includes("percent") ? null : (
        <ToggleField
          label="Show percentages"
          checked={style.showPercent}
          onChange={(showPercent) => onStyle({ showPercent })}
        />
      )}
      {omit.includes("grid") ? null : (
        <ToggleField label="Gridlines" checked={style.showGrid} onChange={(showGrid) => onStyle({ showGrid })} />
      )}
      {omit.includes("legend") ? null : (
        <Segmented
          label="Legend"
          value={style.legend}
          options={[
            { id: "bottom", label: "Bottom" },
            { id: "right", label: "Right" },
            { id: "none", label: "Hidden" },
          ]}
          onChange={(legend) => onStyle({ legend, showLegend: legend !== "none" })}
        />
      )}
      <SliderField
        label="Label size"
        value={style.labelSize}
        min={10}
        max={16}
        onChange={(labelSize) => onStyle({ labelSize })}
      />
      <SliderField
        label="Value size"
        value={style.valueSize}
        min={9}
        max={16}
        onChange={(valueSize) => onStyle({ valueSize })}
      />
      <SliderField label="Padding" value={style.padding} min={12} max={40} onChange={(padding) => onStyle({ padding })} />
      {extra}
      <div>
        <h3 className="mb-3 text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">
          Title
        </h3>
        <MetaFields meta={meta} onChange={onMeta} />
      </div>
    </div>
  )
}

export function useVizChrome(initialTitle = "") {
  return {
    style: { ...defaultVizStyle },
    meta: { title: initialTitle, subtitle: "", source: "" },
  }
}
