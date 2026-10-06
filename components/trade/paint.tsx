"use client"

import {
  ActionBar,
  CopyButton,
  DownloadButton,
  ExampleButton,
  IssueList,
  JobSummary,
  MeasureField,
  ModeTabs,
  PrintButton,
  PrivacyNote,
  QtyField,
  ResetButton,
  ResultCard,
  Section,
  StickyResult,
  TradeShell,
  WasteSelector,
} from "@/components/trade/kit"
import { num } from "@/lib/tools/format"
import {
  AREA_UNITS,
  DEFAULT_DOOR_M2,
  DEFAULT_WINDOW_M2,
  LENGTH_UNITS,
  describeTins,
  nonNegative,
  paintEstimate,
  parseArea,
  parseLength,
  parseNumber,
  positive,
  type AreaUnit,
  type LengthUnit,
} from "@/lib/trade/math"
import { useMemo, useState } from "react"

const coveragePresets = ["8", "10", "12", "14", "16"]

const simpleExample = {
  length: "3.5",
  width: "4",
  height: "2.4",
  coats: "2",
  coverage: "10",
  ceiling: true,
  doors: "0",
  windows: "0",
  extra: "0",
  waste: "0",
  unit: "m" as LengthUnit,
}

export function PaintCalculator() {
  const [mode, setMode] = useState("simple")
  const [unit, setUnit] = useState<LengthUnit>("m")
  const [length, setLength] = useState("4.2")
  const [width, setWidth] = useState("3.6")
  const [height, setHeight] = useState("2.7")
  const [coats, setCoats] = useState("2")
  const [coverage, setCoverage] = useState("10")
  const [ceiling, setCeiling] = useState(true)
  const [doors, setDoors] = useState("1")
  const [windows, setWindows] = useState("2")
  const [extra, setExtra] = useState("0")
  const [extraUnit, setExtraUnit] = useState<AreaUnit>("m2")
  const [waste, setWaste] = useState("0")
  const precise = mode === "precise"

  const parsed = useMemo(() => {
    const lengthM = parseLength(length, unit)
    const widthM = parseLength(width, unit)
    const heightM = parseLength(height, unit)
    const coatCount = parseNumber(coats)
    const cover = parseNumber(coverage)
    const doorCount = precise ? (parseNumber(doors) ?? 0) : 0
    const windowCount = precise ? (parseNumber(windows) ?? 0) : 0
    const extraM2 = precise ? (parseArea(extra, extraUnit) ?? 0) : 0
    const wastePercent = precise ? (parseNumber(waste) ?? 0) : 0
    const issues = [
      positive(lengthM, "a room length"),
      positive(widthM, "a room width"),
      positive(heightM, "a wall height"),
      positive(coatCount, "the number of coats"),
      positive(cover, "coverage in m² per litre"),
      precise ? nonNegative(parseNumber(doors) ?? 0, "the number of doors") : null,
      precise ? nonNegative(parseNumber(windows) ?? 0, "the number of windows") : null,
      precise ? nonNegative(parseArea(extra, extraUnit) ?? 0, "extra openings") : null,
      precise ? nonNegative(parseNumber(waste) ?? 0, "a waste percent") : null,
    ].filter((issue): issue is string => Boolean(issue))

    if (coatCount !== null && coatCount > 6) issues.push("Coats above 6 is unusual — check the tin, not the calculator.")
    if (cover !== null && (cover < 4 || cover > 20)) issues.push("Coverage is usually 8–16 m²/L. Use the figure on the tin.")
    if (heightM !== null && heightM > 6) issues.push("Wall height above 6 m is unusual for a house. Check the unit.")
    if (lengthM !== null && lengthM > 40) issues.push("Room length above 40 m is a large space — check the unit.")

    if (issues.length || lengthM === null || widthM === null || heightM === null || coatCount === null || cover === null) {
      return { issues, result: null }
    }

    const result = paintEstimate({
      lengthM,
      widthM,
      heightM,
      coats: coatCount,
      coverage: cover,
      includeCeiling: ceiling,
      doors: doorCount,
      doorAreaM2: DEFAULT_DOOR_M2,
      windows: windowCount,
      windowAreaM2: DEFAULT_WINDOW_M2,
      extraOpeningsM2: extraM2,
      wastePercent,
    })
    if (result.openingsExceedWalls) issues.push("Openings are larger than the wall area. Check the door and window counts.")
    return { issues, result, cover, coatCount }
  }, [length, width, height, unit, coats, coverage, ceiling, doors, windows, extra, extraUnit, waste, precise])

  const result = parsed.result
  const litres = result ? num(result.total, 1) : null
  const summary = result
    ? [
        `Paint needed: ${num(result.total, 1)} L`,
        `Suggested purchase: ${describeTins(result.tins)} (${num(result.tins.purchased, 0)} L)`,
        `Paintable area: ${num(result.area, 1)} m²`,
        `Walls: ${num(result.walls, 1)} m²`,
        result.ceiling ? `Ceiling: ${num(result.ceiling, 1)} m²` : "Ceiling: not included",
        `Openings subtracted: ${num(result.openings, 1)} m²`,
        `Coats: ${num(parsed.coatCount ?? 0, 0)}`,
        `Coverage: ${num(parsed.cover ?? 0, 1)} m²/L`,
        result.wastePercent ? `Waste: ${num(result.wastePercent, 0)}% (${num(result.waste, 1)} L)` : "Waste: none added",
        "Coverage varies by paint, surface, and how you apply it. Confirm the tin size at the supplier.",
      ].join("\n")
    : ""

  function applyExample() {
    setMode("simple")
    setUnit(simpleExample.unit)
    setLength(simpleExample.length)
    setWidth(simpleExample.width)
    setHeight(simpleExample.height)
    setCoats(simpleExample.coats)
    setCoverage(simpleExample.coverage)
    setCeiling(simpleExample.ceiling)
    setDoors(simpleExample.doors)
    setWindows(simpleExample.windows)
    setExtra(simpleExample.extra)
    setWaste(simpleExample.waste)
  }

  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        How much paint do you need? Measure the room, set the coats, and use the coverage on the tin. The result is litres to buy — not a paint specification.
      </p>
      <ModeTabs
        label="How precise?"
        value={mode}
        onChange={setMode}
        options={[
          { id: "simple", label: "Room" },
          { id: "precise", label: "Doors, windows & waste" },
        ]}
      />
      <Section title="Measure" hint="Type metres, or add mm / ft on the number — 4200 mm is fine.">
        <div className="grid gap-4 sm:grid-cols-3">
          <MeasureField
            label="Room length"
            value={length}
            onChange={setLength}
            unit={unit}
            onUnitChange={(next) => setUnit(next as LengthUnit)}
            units={LENGTH_UNITS}
          />
          <MeasureField
            label="Room width"
            value={width}
            onChange={setWidth}
            unit={unit}
            onUnitChange={(next) => setUnit(next as LengthUnit)}
            units={LENGTH_UNITS}
          />
          <MeasureField
            label="Wall height"
            value={height}
            onChange={setHeight}
            unit={unit}
            onUnitChange={(next) => setUnit(next as LengthUnit)}
            units={LENGTH_UNITS}
          />
        </div>
        <label className="flex items-center gap-2 text-[13px] text-[var(--nb-primary)]">
          <input type="checkbox" checked={ceiling} onChange={(event) => setCeiling(event.target.checked)} />
          Include the ceiling
        </label>
      </Section>
      <Section title="Paint" hint="Coverage is on the tin. 10 m²/L is a conservative starting point for walls.">
        <div className="grid gap-4 sm:grid-cols-2">
          <QtyField label="Coats" value={coats} onChange={setCoats} min={1} hint="Most walls need two." />
          <QtyField label="Coverage" value={coverage} onChange={setCoverage} suffix="m²/L" hint="Use the number on the tin if you have it." />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Coverage presets">
          {coveragePresets.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={coverage === item}
              className={`h-9 rounded-lg border px-3 text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
                coverage === item
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-[var(--nb-primary)] hover:bg-muted"
              }`}
              onClick={() => setCoverage(item)}
            >
              {item} m²/L
            </button>
          ))}
        </div>
      </Section>
      {precise ? (
        <Section
          title="Openings"
          hint={`Each door is counted as ${DEFAULT_DOOR_M2} m², each window as ${DEFAULT_WINDOW_M2} m². Add extra area for large sliders.`}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <QtyField label="Doors" value={doors} onChange={setDoors} optional hint="Count, not area." />
            <QtyField label="Windows" value={windows} onChange={setWindows} optional hint="Count, not area." />
            <MeasureField
              label="Extra openings"
              value={extra}
              onChange={setExtra}
              unit={extraUnit}
              onUnitChange={(next) => setExtraUnit(next as AreaUnit)}
              units={AREA_UNITS}
              optional
              hint="Large sliders, hatches, or extra area to skip."
            />
          </div>
          <WasteSelector value={waste} onChange={setWaste} />
        </Section>
      ) : null}
      <ExampleButton label="a 3.5 m × 4 m room, 2.4 m high, two coats" onClick={applyExample} />
      <IssueList issues={parsed.issues} />
      {result && litres ? (
        <>
          <ResultCard
            label="Paint needed"
            value={`${litres} L`}
            note={`About ${litres} L for ${num(result.area, 1)} m² at ${num(parsed.cover ?? 0, 1)} m²/L over ${num(parsed.coatCount ?? 0, 0)} coat${(parsed.coatCount ?? 0) === 1 ? "" : "s"}. Paint is sold in tins, so buy the next pack that covers it.`}
            rows={[
              { label: "Paintable area", value: `${num(result.area, 1)} m²` },
              { label: "Calculated", value: `${num(result.total, 1)} L` },
              { label: "Suggested purchase", value: `${describeTins(result.tins)} · ${num(result.tins.purchased, 0)} L` },
            ]}
            assumptions={[
              `Based on ${num(parsed.coatCount ?? 0, 0)} coat${(parsed.coatCount ?? 0) === 1 ? "" : "s"} and ${num(parsed.cover ?? 0, 1)} m²/L coverage.`,
              ceiling ? `Ceiling included (${num(result.ceiling, 1)} m²).` : "Ceiling not included.",
              result.openings > 0
                ? `Openings subtracted: ${num(result.openings, 1)} m².`
                : "No doors or windows subtracted.",
              result.wastePercent > 0
                ? `${num(result.wastePercent, 0)}% waste added (${num(result.waste, 1)} L).`
                : "No waste allowance added.",
              "Coverage varies by surface, paint, and application. This is not a specification.",
            ]}
          />
          <Section title="Job summary">
            <JobSummary
              rows={[
                { label: "Room", value: `${num(result.floorArea, 1)} m² floor, ${num(result.wallArea, 1)} m² walls` },
                { label: "Paintable", value: `${num(result.area, 1)} m²` },
                { label: "Coats", value: num(parsed.coatCount ?? 0, 0) },
                { label: "Coverage", value: `${num(parsed.cover ?? 0, 1)} m²/L` },
                { label: "Paint required", value: `${num(result.total, 1)} L` },
                { label: "Recommended purchase", value: `${describeTins(result.tins)} (${num(result.tins.purchased, 0)} L)` },
              ]}
            />
          </Section>
          <StickyResult label="Paint needed" value={`${litres} L`} />
        </>
      ) : null}
      <ActionBar>
        {summary ? <CopyButton text={summary} label="Copy summary" /> : null}
        {summary ? <DownloadButton text={summary} filename="paint-estimate.txt" label="Download" /> : null}
        {summary ? <PrintButton title="Paint estimate" text={summary} /> : null}
        <ResetButton
          onClick={() => {
            setMode("simple")
            setUnit("m")
            setLength("4.2")
            setWidth("3.6")
            setHeight("2.7")
            setCoats("2")
            setCoverage("10")
            setCeiling(true)
            setDoors("1")
            setWindows("2")
            setExtra("0")
            setWaste("0")
          }}
        />
      </ActionBar>
      <PrivacyNote />
    </TradeShell>
  )
}
