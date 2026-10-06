"use client"

import { ActionRow, CreativeShell, CssBlock, PresetRow, PreviewCanvas } from "@/components/design/kit"
import { CopyButton, NumberField, ResetButton, selectClass } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { cellCount, defaultGrid, gridCss, gridPresets, type GridAlign, type GridConfig, type GridJustify } from "@/lib/tools/css-grid"
import { useMemo, useState } from "react"

const aligns: GridAlign[] = ["start", "center", "end", "stretch"]
const justifies: GridJustify[] = ["start", "center", "end", "stretch", "space-between"]

export function CssGridGenerator() {
  const [config, setConfig] = useState<GridConfig>(defaultGrid)
  const css = useMemo(() => gridCss(config), [config])
  const cells = cellCount(config)

  function patch(next: Partial<GridConfig>) {
    setConfig((current) => ({ ...current, ...next }))
  }

  return (
    <CreativeShell>
      <PresetRow>
        {gridPresets.map((preset) => (
          <Button key={preset.id} type="button" variant="outline" className="h-10" onClick={() => setConfig({ ...defaultGrid, ...preset.config })}>
            {preset.label}
          </Button>
        ))}
      </PresetRow>
      <PreviewCanvas label="CSS grid preview">
        <div
          className="min-h-56 p-4"
          style={{
            display: "grid",
            gridTemplateColumns: config.templateColumns.trim() || `repeat(${config.columns}, minmax(0, 1fr))`,
            gridTemplateRows: config.templateRows.trim() || `repeat(${config.rows}, minmax(72px, auto))`,
            gap: `${config.rowGap}px ${config.columnGap}px`,
            justifyItems: config.justifyItems,
            alignItems: config.alignItems,
            justifyContent: config.justifyContent,
            alignContent: config.alignContent,
            gridTemplateAreas: config.useAreas && config.areas.trim() ? config.areas : undefined,
          }}
        >
          {Array.from({ length: Math.min(cells, 24) }, (_, index) => (
            <div key={index} className="flex min-h-12 items-center justify-center rounded-lg bg-[var(--nb-accent)] text-[12px] text-[var(--nb-secondary)]">
              {index + 1}
            </div>
          ))}
        </div>
      </PreviewCanvas>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Columns" value={String(config.columns)} onChange={(value) => patch({ columns: Math.max(1, Math.min(12, Number(value) || 1)) })} min={1} step="1" />
        <NumberField label="Rows" value={String(config.rows)} onChange={(value) => patch({ rows: Math.max(1, Math.min(8, Number(value) || 1)) })} min={1} step="1" />
        <NumberField label="Column gap" value={String(config.columnGap)} onChange={(value) => patch({ columnGap: Number(value) || 0 })} suffix="px" min={0} />
        <NumberField label="Row gap" value={String(config.rowGap)} onChange={(value) => patch({ rowGap: Number(value) || 0 })} suffix="px" min={0} />
        <Select label="Justify items" value={config.justifyItems} options={aligns} onChange={(justifyItems) => patch({ justifyItems: justifyItems as GridAlign })} />
        <Select label="Align items" value={config.alignItems} options={aligns} onChange={(alignItems) => patch({ alignItems: alignItems as GridAlign })} />
        <Select label="Justify content" value={config.justifyContent} options={justifies} onChange={(justifyContent) => patch({ justifyContent: justifyContent as GridJustify })} />
        <Select label="Align content" value={config.alignContent} options={justifies} onChange={(alignContent) => patch({ alignContent: alignContent as GridJustify })} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={config.useAreas} onChange={(event) => patch({ useAreas: event.target.checked })} />
        Named areas
      </label>
      {config.useAreas ? (
        <textarea
          value={config.areas}
          rows={4}
          onChange={(event) => patch({ areas: event.target.value })}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm"
          placeholder={`"header header"\n"nav main"`}
        />
      ) : null}
      <CssBlock code={css} />
      <ActionRow>
        <CopyButton text={css} label="Copy CSS" />
        <ResetButton onClick={() => setConfig(defaultGrid)} />
      </ActionRow>
    </CreativeShell>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-2 text-[13px]">
      {label}
      <select className={selectClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
