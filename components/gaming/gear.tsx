"use client"

import { CopyReset, GameSelector, GamingToolShell, MetricCard, Note } from "@/components/gaming/kit"
import { NumberField } from "@/components/tools/ui"
import { batteryRuntime, devicePixels, monitorPresets, panelMetrics } from "@/lib/gaming/display"
import { num } from "@/lib/tools/format"
import { useEffect, useState } from "react"

export function MonitorPpiCalculator() {
  const [width, setWidth] = useState("2560")
  const [height, setHeight] = useState("1440")
  const [diagonal, setDiagonal] = useState("27")
  const [preset, setPreset] = useState("1440p 27\"")
  const metrics = panelMetrics(Number(width), Number(height), Number(diagonal))

  return (
    <GamingToolShell>
      <Note>
        PPI is the pixel diagonal divided by the panel diagonal. Use the glass size, not the stand. This is sharpness,
        not perceived quality.
      </Note>
      <GameSelector
        label="Common panels"
        games={monitorPresets.map((item) => ({ id: item.label, name: item.label }))}
        value={preset}
        onChange={(id) => {
          const next = monitorPresets.find((item) => item.label === id)
          if (!next) return
          setPreset(id)
          setWidth(String(next.width))
          setHeight(String(next.height))
          setDiagonal(String(next.diagonal))
        }}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="Width" value={width} onChange={setWidth} suffix="px" min={1} />
        <NumberField label="Height" value={height} onChange={setHeight} suffix="px" min={1} />
        <NumberField label="Diagonal" value={diagonal} onChange={setDiagonal} suffix="in" min={1} />
      </div>
      <MetricCard label="PPI" value={metrics ? num(metrics.ppi, 1) : "—"} note={metrics ? `${num(metrics.megapixels, 2)} MP · ${num(metrics.pitchMm, 3)} mm pixel pitch` : undefined} />
      <CopyReset
        text={metrics ? `${width}×${height} at ${diagonal}" is ${num(metrics.ppi, 1)} PPI` : ""}
        onReset={() => {
          setWidth("2560")
          setHeight("1440")
          setDiagonal("27")
          setPreset("1440p 27\"")
        }}
      />
    </GamingToolShell>
  )
}

export function ScreenPpiCalculator() {
  const [width, setWidth] = useState("1512")
  const [height, setHeight] = useState("982")
  const [diagonal, setDiagonal] = useState("14")
  const [ratio, setRatio] = useState<number | null>(null)

  useEffect(() => {
    setRatio(window.devicePixelRatio || 1)
    setWidth(String(window.screen.width))
    setHeight(String(window.screen.height))
  }, [])

  const cssWidth = Number(width)
  const cssHeight = Number(height)
  const size = Number(diagonal)
  const device = ratio ? devicePixels(cssWidth, cssHeight, ratio) : null
  const metrics = device && size ? panelMetrics(device.width, device.height, size) : null

  return (
    <GamingToolShell>
      <Note>
        CSS pixels are multiplied by this screen’s device pixel ratio ({ratio ?? "—"}). That is how this browser reports
        the display, not a calibrated meter. Enter the physical diagonal yourself — the browser does not know it.
      </Note>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="CSS width" value={width} onChange={setWidth} suffix="px" />
        <NumberField label="CSS height" value={height} onChange={setHeight} suffix="px" />
        <NumberField label="Diagonal" value={diagonal} onChange={setDiagonal} suffix="in" />
      </div>
      <MetricCard
        label="PPI"
        value={metrics ? num(metrics.ppi, 1) : "—"}
        note={device ? `${num(device.width, 0)} × ${num(device.height, 0)} device pixels` : undefined}
      />
      <CopyReset
        text={metrics && ratio ? `This screen, ratio ${num(ratio, 2)}, ${diagonal}": ${num(metrics.ppi, 1)} PPI` : ""}
      />
    </GamingToolShell>
  )
}

export function BatteryRuntimeCalculator() {
  const [capacity, setCapacity] = useState("3000")
  const [load, setLoad] = useState("250")
  const result = batteryRuntime(Number(capacity), Number(load))

  return (
    <GamingToolShell>
      <Note>
        Runtime is capacity ÷ load. Real packs sag, devices cut out before empty, and the draw is not constant. No
        voltage is used, so this is not watt-hours.
      </Note>
      <div className="grid max-w-md gap-4 sm:grid-cols-2">
        <NumberField label="Capacity" value={capacity} onChange={setCapacity} suffix="mAh" min={0} />
        <NumberField label="Load" value={load} onChange={setLoad} suffix="mA" min={0} />
      </div>
      <MetricCard label="Runtime" value={result ? result.label : "—"} note={result ? `${num(result.hours, 2)} hours at a steady load` : "Enter capacity and load."} />
      <CopyReset
        text={result ? `${capacity} mAh at ${load} mA lasts ${result.label}` : ""}
        onReset={() => {
          setCapacity("3000")
          setLoad("250")
        }}
      />
    </GamingToolShell>
  )
}
