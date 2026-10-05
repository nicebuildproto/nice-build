"use client"

import { CopyButton, NumberField, ResetButton, Stat, ToolNote, parseAmount, selectClass } from "@/components/tools/ui"
import { num } from "@/lib/tools/format"
import { aspectPresets, fovFromScreen, fovPresets, horizontalFromVertical, verticalFromHorizontal } from "@/lib/tools/fov"
import { useMemo, useState } from "react"

export function FovCalculator() {
  const [mode, setMode] = useState<"horizontal" | "vertical">("horizontal")
  const [fov, setFov] = useState("103")
  const [aspectId, setAspectId] = useState("16:9")
  const [customAspect, setCustomAspect] = useState("1.777")
  const [distance, setDistance] = useState("")
  const [width, setWidth] = useState("")
  const aspect = aspectId === "custom" ? parseAmount(customAspect) ?? 16 / 9 : aspectPresets.find((item) => item.id === aspectId)?.value ?? 16 / 9
  const input = parseAmount(fov)
  const h = input === null ? null : mode === "horizontal" ? input : horizontalFromVertical(input, aspect)
  const v = input === null ? null : mode === "vertical" ? input : verticalFromHorizontal(input, aspect)
  const fromScreen = useMemo(() => {
    const d = parseAmount(distance)
    const w = parseAmount(width)
    if (d === null || w === null) return null
    return fovFromScreen(d, w)
  }, [distance, width])

  return (
    <div className="flex flex-col gap-6">
      <ToolNote>Convert horizontal and vertical field of view at a given aspect ratio. Game presets use the game’s advertised FOV, not a measured camera.</ToolNote>
      <div className="flex flex-wrap gap-2">
        {fovPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="h-10 rounded-lg border border-border px-3 text-sm"
            onClick={() => {
              if ("horizontal" in preset && preset.horizontal) {
                setMode("horizontal")
                setFov(String(preset.horizontal))
              } else if ("vertical" in preset && preset.vertical) {
                setMode("vertical")
                setFov(String(preset.vertical))
              }
              const match = aspectPresets.find((item) => Math.abs(item.value - preset.aspect) < 0.01)
              setAspectId(match?.id ?? "custom")
              setCustomAspect(String(Number(preset.aspect.toFixed(3))))
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-[13px]">
          Input
          <select className={selectClass} value={mode} onChange={(event) => setMode(event.target.value as "horizontal" | "vertical")}>
            <option value="horizontal">Horizontal FOV</option>
            <option value="vertical">Vertical FOV</option>
          </select>
        </label>
        <NumberField label="Degrees" value={fov} onChange={setFov} suffix="°" min={1} />
        <label className="flex flex-col gap-2 text-[13px]">
          Aspect ratio
          <select className={selectClass} value={aspectId} onChange={(event) => setAspectId(event.target.value)}>
            {aspectPresets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </label>
        {aspectId === "custom" ? <NumberField label="Width / height" value={customAspect} onChange={setCustomAspect} min={0.1} /> : null}
      </div>
      <div className="flex flex-wrap gap-10" aria-live="polite">
        <Stat label="Horizontal" value={h === null ? "—" : `${num(h, 1)}°`} />
        <Stat label="Vertical" value={v === null ? "—" : `${num(v, 1)}°`} />
      </div>
      {h !== null ? <FovPreview horizontal={h} aspect={aspect} /> : null}
      <div className="grid max-w-lg gap-4 sm:grid-cols-2">
        <NumberField label="Viewing distance (optional)" value={distance} onChange={setDistance} suffix="cm" min={0} />
        <NumberField label="Screen width (optional)" value={width} onChange={setWidth} suffix="cm" min={0} />
      </div>
      {fromScreen !== null ? (
        <p className="text-sm text-[var(--nb-secondary)]">A screen that wide at that distance subtends about {num(fromScreen, 1)}° horizontally.</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {h !== null && v !== null ? <CopyButton text={`HFOV ${num(h, 1)}° · VFOV ${num(v, 1)}° · aspect ${num(aspect, 3)}`} label="Copy result" /> : null}
        <ResetButton onClick={() => setFov("")} />
      </div>
    </div>
  )
}

function FovPreview({ horizontal, aspect }: { horizontal: number; aspect: number }) {
  const half = (horizontal * Math.PI) / 360
  const depth = 90
  const halfW = Math.tan(half) * depth
  const halfH = halfW / aspect
  const cx = 160
  const cy = 90
  return (
    <svg viewBox="0 0 320 180" className="h-40 w-full max-w-md rounded-xl border border-border bg-[var(--nb-accent)]/40" role="img" aria-label="FOV wedge">
      <polygon
        points={`${cx - 8},${cy} ${cx + halfW},${cy - halfH} ${cx + halfW},${cy + halfH}`}
        fill="currentColor"
        className="text-[var(--nb-primary)]"
        opacity={0.12}
      />
      <line x1={cx - 8} y1={cy} x2={cx + halfW} y2={cy - halfH} stroke="currentColor" />
      <line x1={cx - 8} y1={cy} x2={cx + halfW} y2={cy + halfH} stroke="currentColor" />
      <rect x={cx + halfW - 4} y={cy - halfH} width={8} height={halfH * 2} rx={1} fill="currentColor" opacity={0.35} />
    </svg>
  )
}
