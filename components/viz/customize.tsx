"use client"

import { ColorField, MetaFields, Segmented, SliderField, ToggleField } from "@/components/viz/fields"
import { defaultVizStyle, type VizStyle } from "@/lib/viz/style"
import { vizThemes, type VizThemeId } from "@/lib/viz/themes"
import type { VizMeta } from "@/lib/viz/style"
import type { ReactNode } from "react"

export function VizCustomize({
  style,
  meta,
  onStyle,
  onMeta,
  extra,
}: {
  style: VizStyle
  meta: VizMeta
  onStyle: (next: Partial<VizStyle>) => void
  onMeta: (next: Partial<VizMeta>) => void
  extra?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6">
      <Segmented
        label="Theme"
        value={style.theme}
        options={Object.values(vizThemes).map((theme) => ({ id: theme.id, label: theme.label }))}
        onChange={(theme: VizThemeId) =>
          onStyle({ theme, background: theme === style.theme ? style.background : vizThemes[theme].background })
        }
      />
      <ColorField label="Background" value={style.background} onChange={(background) => onStyle({ background })} />
      <ToggleField label="Show values" checked={style.showValues} onChange={(showValues) => onStyle({ showValues })} />
      <ToggleField label="Show labels" checked={style.showLabels} onChange={(showLabels) => onStyle({ showLabels })} />
      <ToggleField
        label="Show percentages"
        checked={style.showPercent}
        onChange={(showPercent) => onStyle({ showPercent })}
      />
      <ToggleField label="Gridlines" checked={style.showGrid} onChange={(showGrid) => onStyle({ showGrid })} />
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
