"use client"

import {
  ActionBar,
  CopyButton,
  DownloadButton,
  ExampleButton,
  IssueList,
  JobSummary,
  MeasureField,
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
import { money, num } from "@/lib/tools/format"
import {
  AREA_UNITS,
  DEPTH_UNITS,
  LENGTH_UNITS,
  PREMIX_20KG_M3,
  boardFeet,
  concreteBags,
  coveringCount,
  deckBoards,
  estimateLines,
  estimatePrice,
  fenceParts,
  gravelMass,
  gutterParts,
  hvacLoad,
  litreBags,
  nonNegative,
  parseArea,
  parseLength,
  parseNumber,
  pitchFrom,
  plasterSheets,
  positive,
  roofArea,
  roundUp,
  slabVolume,
  stairStringer,
  studCount,
  type AreaUnit,
  type DepthUnit,
  type LengthUnit,
} from "@/lib/trade/math"
import { useMemo, useState } from "react"

function Actions({
  summary,
  filename,
  title,
  onReset,
}: {
  summary: string
  filename: string
  title: string
  onReset: () => void
}) {
  return (
    <>
      <ActionBar>
        <CopyButton text={summary} label="Copy summary" />
        <DownloadButton text={summary} filename={filename} label="Download" />
        <PrintButton title={title} text={summary} />
        <ResetButton onClick={onReset} />
      </ActionBar>
      <PrivacyNote />
    </>
  )
}

function VolumeTool({
  intro,
  defaultLength,
  defaultWidth,
  defaultDepth,
  defaultWaste,
  exampleLabel,
  density,
  bagLitres,
  showBags,
  filename,
  title,
  extraAssumptions,
  extraRows,
}: {
  intro: string
  defaultLength: string
  defaultWidth: string
  defaultDepth: string
  defaultWaste: string
  exampleLabel: string
  density?: number
  bagLitres?: number
  showBags?: boolean
  filename: string
  title: string
  extraAssumptions?: string[]
  extraRows?: (volume: number) => { label: string; value: string }[]
}) {
  const [unit, setUnit] = useState<LengthUnit>("m")
  const [depthUnit, setDepthUnit] = useState<DepthUnit>("mm")
  const [length, setLength] = useState(defaultLength)
  const [width, setWidth] = useState(defaultWidth)
  const [depth, setDepth] = useState(defaultDepth)
  const [waste, setWaste] = useState(defaultWaste)

  const parsed = useMemo(() => {
    const lengthM = parseLength(length, unit)
    const widthM = parseLength(width, unit)
    const depthM = parseLength(depth, depthUnit)
    const wastePercent = parseNumber(waste) ?? 0
    const issues = [
      positive(lengthM, "a length"),
      positive(widthM, "a width"),
      positive(depthM, "a depth"),
      nonNegative(parseNumber(waste), "a waste percent"),
    ].filter((issue): issue is string => Boolean(issue))
    if (issues.length || lengthM === null || widthM === null || depthM === null) return { issues, result: null }
    if (depthM > 3) issues.push("Depth above 3 m is unusual for this calculator. Check the unit — 100 mm is 100, not 0.1 m.")
    const slab = slabVolume(lengthM, widthM, depthM, wastePercent)
    const bags = showBags ? concreteBags(slab.total, PREMIX_20KG_M3) : null
    const tonnes = density ? gravelMass(slab.total, density) : null
    const bags25 = bagLitres ? litreBags(slab.total, bagLitres) : null
    const truck = showBags ? roundUp(slab.total, 0.2) : null
    return { issues, result: { ...slab, bags, tonnes, bags25, truck, lengthM, widthM, depthM } }
  }, [length, width, depth, unit, depthUnit, waste, density, bagLitres, showBags])

  const result = parsed.result
  const summary = result
    ? [
        `${title}`,
        `Area: ${num(result.area, 1)} m²`,
        `Depth: ${num(result.depthM * 1000, 0)} mm`,
        `Volume: ${num(result.volume, 2)} m³`,
        result.wastePercent ? `Waste: ${num(result.wastePercent, 0)}% (${num(result.waste, 2)} m³)` : "Waste: none",
        `To order: ${num(result.total, 2)} m³`,
        result.truck !== null ? `If ordering a truck, round to 0.2 m³: ${num(result.truck, 1)} m³` : "",
        result.bags !== null ? `20 kg pre-mix bags: ${num(result.bags, 0)}` : "",
        result.tonnes !== null ? `Weight at ${density} t/m³: ${num(result.tonnes, 2)} t` : "",
        result.bags25 !== null ? `${bagLitres} L bags: ${num(result.bags25, 0)}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : ""

  function reset() {
    setUnit("m")
    setDepthUnit("mm")
    setLength(defaultLength)
    setWidth(defaultWidth)
    setDepth(defaultDepth)
    setWaste(defaultWaste)
  }

  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">{intro}</p>
      <Section title="Measure" hint="Length and width default to metres. Depth defaults to millimetres — 100 mm, not 0.1 m.">
        <div className="grid gap-4 sm:grid-cols-3">
          <MeasureField label="Length" value={length} onChange={setLength} unit={unit} onUnitChange={(next) => setUnit(next as LengthUnit)} units={LENGTH_UNITS} />
          <MeasureField label="Width" value={width} onChange={setWidth} unit={unit} onUnitChange={(next) => setUnit(next as LengthUnit)} units={LENGTH_UNITS} />
          <MeasureField label="Depth" value={depth} onChange={setDepth} unit={depthUnit} onUnitChange={(next) => setDepthUnit(next as DepthUnit)} units={DEPTH_UNITS} />
        </div>
        <WasteSelector value={waste} onChange={setWaste} />
      </Section>
      <ExampleButton label={exampleLabel} onClick={reset} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Required material"
            value={`${num(result.total, 2)} m³`}
            note={`You need approximately ${num(result.total, 2)} m³${result.wastePercent ? ` including ${num(result.wastePercent, 0)}% waste` : ""}. Volume is length × width × depth.`}
            rows={[
              { label: "Base volume", value: `${num(result.volume, 2)} m³` },
              { label: "Waste", value: result.wastePercent ? `${num(result.wastePercent, 0)}% · ${num(result.waste, 2)} m³` : "None" },
              { label: "To order", value: `${num(result.total, 2)} m³` },
              ...(result.truck !== null ? [{ label: "Truck (0.2 m³)", value: `${num(result.truck, 1)} m³` }] : []),
              ...(result.bags !== null ? [{ label: "20 kg bags", value: num(result.bags, 0) }] : []),
              ...(result.tonnes !== null ? [{ label: "Weight", value: `${num(result.tonnes, 2)} t` }] : []),
              ...(result.bags25 !== null ? [{ label: `${bagLitres} L bags`, value: num(result.bags25, 0) }] : []),
              ...(extraRows ? extraRows(result.total) : []),
            ]}
            assumptions={[
              `${num(result.lengthM, 2)} m × ${num(result.widthM, 2)} m × ${num(result.depthM * 1000, 0)} mm.`,
              result.wastePercent ? `${num(result.wastePercent, 0)}% waste is included.` : "No waste allowance added.",
              ...(extraAssumptions ?? []),
              "Confirm the order against how the supplier sells it — truck, bulk bag, or bagged.",
            ]}
          />
          <Section title="Job summary">
            <JobSummary
              rows={[
                { label: "Area", value: `${num(result.area, 1)} m²` },
                { label: "Depth", value: `${num(result.depthM * 1000, 0)} mm` },
                { label: "Volume", value: `${num(result.volume, 2)} m³` },
                { label: "Order", value: `${num(result.total, 2)} m³` },
              ]}
            />
          </Section>
          <StickyResult label="To order" value={`${num(result.total, 2)} m³`} />
          <Actions summary={summary} filename={filename} title={title} onReset={reset} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function ConcreteCalculator() {
  return (
    <VolumeTool
      title="Concrete estimate"
      filename="concrete-estimate.txt"
      intro="Volume of a slab or footing from the length, width, and depth you measure. Bag count is for 20 kg pre-mix, at about 0.01 m³ a bag. A truck is usually ordered in 0.2 m³ steps."
      defaultLength="4"
      defaultWidth="3"
      defaultDepth="100"
      defaultWaste="5"
      exampleLabel="a 4 m × 3 m slab, 100 mm thick"
      showBags
      extraAssumptions={[
        "A 20 kg bag of pre-mix is taken as 0.01 m³ (100 bags per m³), rounded up.",
        "If ordering ready-mix, use the cubic metres — not the bag count.",
      ]}
    />
  )
}

export function GravelCalculator() {
  return (
    <VolumeTool
      title="Gravel estimate"
      filename="gravel-estimate.txt"
      intro="Volume and tonnes of gravel from the area and depth you measure. Density defaults to 1.5 t/m³ for loose gravel — ask the yard if theirs differs."
      defaultLength="6"
      defaultWidth="2"
      defaultDepth="50"
      defaultWaste="10"
      exampleLabel="a 6 m × 2 m path, 50 mm deep"
      density={1.5}
      extraAssumptions={[
        "Uses 1.5 tonnes per cubic metre, a typical loose-gravel density.",
        "Wet or compacted gravel can be heavier. Compaction is not calculated separately — use waste if you expect it to settle.",
      ]}
    />
  )
}

export function MulchCalculator() {
  return (
    <VolumeTool
      title="Mulch estimate"
      filename="mulch-estimate.txt"
      intro="Volume of mulch for a garden bed. Depth is millimetres — 70 mm is a common garden depth. Bags are 25 L, a usual garden-centre size."
      defaultLength="5"
      defaultWidth="1.2"
      defaultDepth="70"
      defaultWaste="5"
      exampleLabel="a 5 m × 1.2 m bed, 70 mm deep"
      bagLitres={25}
      extraAssumptions={["25 L bags are a common garden-centre size. Divide litres by the bag you actually buy if it differs."]}
      extraRows={(volume) => [{ label: "Litres", value: num(volume * 1000, 0) }]}
    />
  )
}

export function RoofPitchCalculator() {
  const [unit, setUnit] = useState<LengthUnit>("mm")
  const [rise, setRise] = useState("300")
  const [run, setRun] = useState("1000")
  const parsed = useMemo(() => {
    const riseM = parseLength(rise, unit)
    const runM = parseLength(run, unit)
    const issues = [positive(riseM, "a rise"), positive(runM, "a run")].filter((issue): issue is string => Boolean(issue))
    if (issues.length || riseM === null || runM === null) return { issues, result: null }
    const result = pitchFrom(riseM, runM)
    return { issues, result, riseMm: riseM * 1000, runMm: runM * 1000 }
  }, [rise, run, unit])
  const result = parsed.result
  const summary = result
    ? `Roof pitch\nRise: ${num(parsed.riseMm ?? 0, 0)} mm\nRun: ${num(parsed.runMm ?? 0, 0)} mm\nPitch: ${num(result.angle, 1)}°\nRafter: ${num(result.rafter * 1000, 0)} mm\nSlope factor: ${num(result.factor, 3)}`
    : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        Pitch angle and rafter length from the rise and run you measure. The slope factor turns a plan length into a sloped length.
      </p>
      <Section title="Measure">
        <div className="grid gap-4 sm:grid-cols-2">
          <MeasureField label="Rise" value={rise} onChange={setRise} unit={unit} onUnitChange={(next) => setUnit(next as LengthUnit)} units={LENGTH_UNITS} hint="Vertical height." />
          <MeasureField label="Run" value={run} onChange={setRun} unit={unit} onUnitChange={(next) => setUnit(next as LengthUnit)} units={LENGTH_UNITS} hint="Horizontal distance." />
        </div>
      </Section>
      <ExampleButton label="300 mm rise over 1000 mm run" onClick={() => { setUnit("mm"); setRise("300"); setRun("1000") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Pitch"
            value={`${num(result.angle, 1)}°`}
            note={`A rise of ${num(parsed.riseMm ?? 0, 0)} mm over ${num(parsed.runMm ?? 0, 0)} mm is ${num(result.angle, 1)}°. The rafter along that triangle is ${num(result.rafter * 1000, 0)} mm.`}
            rows={[
              { label: "Rafter", value: `${num(result.rafter * 1000, 0)} mm` },
              { label: "Slope factor", value: num(result.factor, 3) },
            ]}
            assumptions={["Multiply a plan length by the slope factor to get the sloped length.", "This is geometry, not a structural design."]}
          />
          <StickyResult label="Pitch" value={`${num(result.angle, 1)}°`} />
          <Actions summary={summary} filename="roof-pitch.txt" title="Roof pitch" onReset={() => { setUnit("mm"); setRise("300"); setRun("1000") }} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function TileCalculator() {
  const [unit, setUnit] = useState<LengthUnit>("m")
  const [tileUnit, setTileUnit] = useState<LengthUnit>("mm")
  const [length, setLength] = useState("4.2")
  const [width, setWidth] = useState("3.1")
  const [tileLength, setTileLength] = useState("600")
  const [tileWidth, setTileWidth] = useState("600")
  const [waste, setWaste] = useState("10")
  const parsed = useMemo(() => {
    const lengthM = parseLength(length, unit)
    const widthM = parseLength(width, unit)
    const tileLM = parseLength(tileLength, tileUnit)
    const tileWM = parseLength(tileWidth, tileUnit)
    const wastePercent = parseNumber(waste) ?? 0
    const issues = [
      positive(lengthM, "a room length"),
      positive(widthM, "a room width"),
      positive(tileLM, "tile length"),
      positive(tileWM, "tile width"),
      nonNegative(parseNumber(waste), "a waste percent"),
    ].filter((issue): issue is string => Boolean(issue))
    if (issues.length || lengthM === null || widthM === null || tileLM === null || tileWM === null) return { issues, result: null }
    const area = lengthM * widthM
    const piece = tileLM * tileWM
    const result = coveringCount(area, piece, wastePercent)
    return { issues, result, lengthM, widthM, tileLM, tileWM }
  }, [length, width, tileLength, tileWidth, unit, tileUnit, waste])
  const result = parsed.result
  const summary = result
    ? `Tile estimate\nRoom: ${num(parsed.lengthM ?? 0, 2)} m × ${num(parsed.widthM ?? 0, 2)} m (${num(result.area, 1)} m²)\nTile: ${num((parsed.tileLM ?? 0) * 1000, 0)} × ${num((parsed.tileWM ?? 0) * 1000, 0)} mm\nWaste: ${num(result.wastePercent, 0)}%\nTiles: ${num(result.count, 0)}`
    : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        How many tiles a floor needs, including waste you can change. Rectangular tiles are fine — enter both sides.
      </p>
      <Section title="Room">
        <div className="grid gap-4 sm:grid-cols-2">
          <MeasureField label="Room length" value={length} onChange={setLength} unit={unit} onUnitChange={(next) => setUnit(next as LengthUnit)} units={LENGTH_UNITS} />
          <MeasureField label="Room width" value={width} onChange={setWidth} unit={unit} onUnitChange={(next) => setUnit(next as LengthUnit)} units={LENGTH_UNITS} />
        </div>
      </Section>
      <Section title="Tile" hint="Use the actual tile face, not the box size.">
        <div className="grid gap-4 sm:grid-cols-2">
          <MeasureField label="Tile length" value={tileLength} onChange={setTileLength} unit={tileUnit} onUnitChange={(next) => setTileUnit(next as LengthUnit)} units={LENGTH_UNITS} />
          <MeasureField label="Tile width" value={tileWidth} onChange={setTileWidth} unit={tileUnit} onUnitChange={(next) => setTileUnit(next as LengthUnit)} units={LENGTH_UNITS} />
        </div>
        <WasteSelector
          value={waste}
          onChange={setWaste}
          options={[
            { id: "8", label: "8%" },
            { id: "10", label: "10%" },
            { id: "15", label: "15%" },
            { id: "20", label: "20% diagonal" },
          ]}
        />
      </Section>
      <ExampleButton label="a 4.2 m × 3.1 m room of 600 mm tiles" onClick={() => { setUnit("m"); setTileUnit("mm"); setLength("4.2"); setWidth("3.1"); setTileLength("600"); setTileWidth("600"); setWaste("10") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Tiles to order"
            value={num(result.count, 0)}
            note={`You need ${num(result.count, 0)} tiles for ${num(result.area, 1)} m², including ${num(result.wastePercent, 0)}% waste. Better a few spare than a short box.`}
            rows={[
              { label: "Floor area", value: `${num(result.area, 1)} m²` },
              { label: "Waste", value: `${num(result.wastePercent, 0)}% · ${num(result.waste, 1)} m²` },
              { label: "With waste", value: `${num(result.total, 1)} m²` },
            ]}
            assumptions={[
              `${num((parsed.tileLM ?? 0) * 1000, 0)} × ${num((parsed.tileWM ?? 0) * 1000, 0)} mm tiles.`,
              "Joints are not subtracted. Wide grout lines mean a slightly lower count.",
              "Measure the floor you will actually tile.",
            ]}
          />
          <StickyResult label="Tiles" value={num(result.count, 0)} />
          <Actions summary={summary} filename="tile-estimate.txt" title="Tile estimate" onReset={() => { setLength("4.2"); setWidth("3.1"); setTileLength("600"); setTileWidth("600"); setWaste("10") }} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function DrywallCalculator() {
  const [unit, setUnit] = useState<LengthUnit>("m")
  const [length, setLength] = useState("6")
  const [height, setHeight] = useState("2.7")
  const [waste, setWaste] = useState("10")
  const parsed = useMemo(() => {
    const lengthM = parseLength(length, unit)
    const heightM = parseLength(height, unit)
    const wastePercent = parseNumber(waste) ?? 0
    const issues = [positive(lengthM, "a length"), positive(heightM, "a height"), nonNegative(parseNumber(waste), "a waste percent")].filter((issue): issue is string => Boolean(issue))
    if (issues.length || lengthM === null || heightM === null) return { issues, result: null }
    return { issues, result: plasterSheets(lengthM, heightM, wastePercent) }
  }, [length, height, unit, waste])
  const result = parsed.result
  const summary = result ? `Plasterboard\nArea: ${num(result.area, 1)} m²\nWaste: ${num(result.wastePercent, 0)}%\nSheets: ${num(result.sheets, 0)} × 2400 × 1200 mm` : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        How many 2400 × 1200 mm plasterboard sheets a wall needs, with waste you can change.
      </p>
      <Section title="Measure">
        <div className="grid gap-4 sm:grid-cols-2">
          <MeasureField label="Wall length" value={length} onChange={setLength} unit={unit} onUnitChange={(next) => setUnit(next as LengthUnit)} units={LENGTH_UNITS} />
          <MeasureField label="Wall height" value={height} onChange={setHeight} unit={unit} onUnitChange={(next) => setUnit(next as LengthUnit)} units={LENGTH_UNITS} />
        </div>
        <WasteSelector value={waste} onChange={setWaste} />
      </Section>
      <ExampleButton label="a 6 m × 2.7 m wall" onClick={() => { setUnit("m"); setLength("6"); setHeight("2.7"); setWaste("10") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Sheets to order"
            value={num(result.sheets, 0)}
            note={`You need ${num(result.sheets, 0)} sheets of 2400 × 1200 mm for ${num(result.area, 1)} m², including ${num(result.wastePercent, 0)}% waste.`}
            rows={[
              { label: "Wall area", value: `${num(result.area, 1)} m²` },
              { label: "Waste", value: `${num(result.wastePercent, 0)}% · ${num(result.waste, 1)} m²` },
            ]}
            assumptions={["This is one face. Double the length for both sides of a wall.", "Openings still need sheets for the cuts around them — waste covers some of that."]}
          />
          <StickyResult label="Sheets" value={num(result.sheets, 0)} />
          <Actions summary={summary} filename="drywall-estimate.txt" title="Drywall estimate" onReset={() => { setLength("6"); setHeight("2.7"); setWaste("10") }} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function FenceCalculator() {
  const [unit, setUnit] = useState<LengthUnit>("m")
  const [length, setLength] = useState("18")
  const [spacing, setSpacing] = useState("2.4")
  const [rails, setRails] = useState("2")
  const parsed = useMemo(() => {
    const lengthM = parseLength(length, unit)
    const spacingM = parseLength(spacing, "m")
    const railRows = parseNumber(rails)
    const issues = [positive(lengthM, "a run length"), positive(spacingM, "post spacing"), positive(railRows, "rail rows")].filter((issue): issue is string => Boolean(issue))
    if (issues.length || lengthM === null || spacingM === null || railRows === null) return { issues, result: null }
    return { issues, result: { ...fenceParts(lengthM, spacingM, railRows), lengthM, spacingM, railRows } }
  }, [length, spacing, rails, unit])
  const result = parsed.result
  const summary = result ? `Fence\nRun: ${num(result.lengthM, 1)} m\nPost spacing: ${num(result.spacingM, 2)} m\nPosts: ${num(result.posts, 0)}\nBays: ${num(result.bays, 0)}\nRails: ${num(result.rails, 0)} (${num(result.railRows, 0)} rows)` : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        Posts and rails for a run of fence. Palings, mesh, and gates are not counted — add those from the plan.
      </p>
      <Section title="Measure">
        <div className="grid gap-4 sm:grid-cols-3">
          <MeasureField label="Run length" value={length} onChange={setLength} unit={unit} onUnitChange={(next) => setUnit(next as LengthUnit)} units={LENGTH_UNITS} />
          <QtyField label="Post spacing" value={spacing} onChange={setSpacing} suffix="m" hint="2.4 m is a common bay." />
          <QtyField label="Rail rows" value={rails} onChange={setRails} hint="Horizontal rails on each bay." />
        </div>
      </Section>
      <ExampleButton label="an 18 m run at 2.4 m" onClick={() => { setUnit("m"); setLength("18"); setSpacing("2.4"); setRails("2") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Posts"
            value={num(result.posts, 0)}
            note={`An ${num(result.lengthM, 1)} m run with posts every ${num(result.spacingM, 2)} m needs ${num(result.posts, 0)} posts, counting both ends, and ${num(result.rails, 0)} rails across ${num(result.bays, 0)} bays.`}
            rows={[
              { label: "Bays", value: num(result.bays, 0) },
              { label: "Rails", value: num(result.rails, 0) },
            ]}
            assumptions={["Posts include both ends.", "Palings, mesh, concrete, and gates are not included."]}
          />
          <StickyResult label="Posts" value={num(result.posts, 0)} />
          <Actions summary={summary} filename="fence-estimate.txt" title="Fence estimate" onReset={() => { setLength("18"); setSpacing("2.4"); setRails("2") }} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function DeckCalculator() {
  const [unit, setUnit] = useState<LengthUnit>("m")
  const [length, setLength] = useState("4.8")
  const [width, setWidth] = useState("3.6")
  const [board, setBoard] = useState("90")
  const [gap, setGap] = useState("5")
  const [waste, setWaste] = useState("10")
  const parsed = useMemo(() => {
    const lengthM = parseLength(length, unit)
    const widthM = parseLength(width, unit)
    const boardMm = parseNumber(board)
    const gapMm = parseNumber(gap)
    const wastePercent = parseNumber(waste) ?? 0
    const issues = [
      positive(lengthM, "a length"),
      positive(widthM, "a width"),
      positive(boardMm, "board width"),
      nonNegative(gapMm, "a gap"),
      nonNegative(parseNumber(waste), "a waste percent"),
    ].filter((issue): issue is string => Boolean(issue))
    if (issues.length || lengthM === null || widthM === null || boardMm === null || gapMm === null) return { issues, result: null }
    return { issues, result: { ...deckBoards(lengthM, widthM, boardMm, gapMm, wastePercent), boardMm, gapMm } }
  }, [length, width, board, gap, waste, unit])
  const result = parsed.result
  const summary = result
    ? `Deck boards\nDeck: ${num(result.eachM, 2)} m × boards across\nBoard: ${num(result.boardMm, 0)} mm + ${num(result.gapMm, 0)} mm gap\nBoards: ${num(result.boards, 0)} × ${num(result.eachM, 2)} m\nLinear: ${num(result.linearM, 1)} m`
    : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        How many deck boards you need. Boards run along the length; the width is divided by the board plus the gap.
      </p>
      <Section title="Deck">
        <div className="grid gap-4 sm:grid-cols-2">
          <MeasureField label="Length (board run)" value={length} onChange={setLength} unit={unit} onUnitChange={(next) => setUnit(next as LengthUnit)} units={LENGTH_UNITS} />
          <MeasureField label="Width" value={width} onChange={setWidth} unit={unit} onUnitChange={(next) => setUnit(next as LengthUnit)} units={LENGTH_UNITS} />
          <QtyField label="Board width" value={board} onChange={setBoard} suffix="mm" />
          <QtyField label="Gap" value={gap} onChange={setGap} suffix="mm" />
        </div>
        <WasteSelector value={waste} onChange={setWaste} />
      </Section>
      <ExampleButton label="a 4.8 m × 3.6 m deck, 90 mm boards" onClick={() => { setUnit("m"); setLength("4.8"); setWidth("3.6"); setBoard("90"); setGap("5"); setWaste("10") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Boards to order"
            value={num(result.boards, 0)}
            note={`${num(result.boards, 0)} boards, each ${num(result.eachM, 2)} m, including ${num(result.wastePercent, 0)}% waste. That is ${num(result.linearM, 1)} m of decking.`}
            rows={[
              { label: "Across the width", value: num(result.across, 0) },
              { label: "Each board", value: `${num(result.eachM, 2)} m` },
              { label: "Linear metres", value: `${num(result.linearM, 1)} m` },
            ]}
            assumptions={["Joists, posts, and fixings are not included.", "Buy boards in the lengths the yard actually sells, then cut to the run."]}
          />
          <StickyResult label="Boards" value={num(result.boards, 0)} />
          <Actions summary={summary} filename="deck-estimate.txt" title="Deck estimate" onReset={() => { setLength("4.8"); setWidth("3.6"); setBoard("90"); setGap("5"); setWaste("10") }} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function PaverCalculator() {
  const [area, setArea] = useState("24")
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("m2")
  const [length, setLength] = useState("200")
  const [width, setWidth] = useState("100")
  const [waste, setWaste] = useState("10")
  const parsed = useMemo(() => {
    const areaM2 = parseArea(area, areaUnit)
    const lengthM = parseLength(length, "mm")
    const widthM = parseLength(width, "mm")
    const wastePercent = parseNumber(waste) ?? 0
    const issues = [positive(areaM2, "an area"), positive(lengthM, "paver length"), positive(widthM, "paver width"), nonNegative(parseNumber(waste), "a waste percent")].filter((issue): issue is string => Boolean(issue))
    if (issues.length || areaM2 === null || lengthM === null || widthM === null) return { issues, result: null }
    return { issues, result: coveringCount(areaM2, lengthM * widthM, wastePercent), lengthM, widthM }
  }, [area, areaUnit, length, width, waste])
  const result = parsed.result
  const summary = result ? `Pavers\nArea: ${num(result.area, 1)} m²\nPaver: ${num((parsed.lengthM ?? 0) * 1000, 0)} × ${num((parsed.widthM ?? 0) * 1000, 0)} mm\nWaste: ${num(result.wastePercent, 0)}%\nPavers: ${num(result.count, 0)}` : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        How many pavers cover an area, with waste you can change. Rectangular pavers are the usual case.
      </p>
      <Section title="Measure">
        <div className="grid gap-4 sm:grid-cols-3">
          <MeasureField label="Area" value={area} onChange={setArea} unit={areaUnit} onUnitChange={(next) => setAreaUnit(next as AreaUnit)} units={AREA_UNITS} />
          <QtyField label="Paver length" value={length} onChange={setLength} suffix="mm" />
          <QtyField label="Paver width" value={width} onChange={setWidth} suffix="mm" />
        </div>
        <WasteSelector value={waste} onChange={setWaste} />
      </Section>
      <ExampleButton label="24 m² of 200 × 100 mm pavers" onClick={() => { setArea("24"); setLength("200"); setWidth("100"); setWaste("10") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Pavers to order"
            value={num(result.count, 0)}
            note={`You need ${num(result.count, 0)} pavers for ${num(result.area, 1)} m², including ${num(result.wastePercent, 0)}% waste.`}
            rows={[
              { label: "Area", value: `${num(result.area, 1)} m²` },
              { label: "Waste", value: `${num(result.wastePercent, 0)}%` },
            ]}
            assumptions={["Joint gaps are not subtracted.", "Confirm the paver size on the pack — some are sold by the m²."]}
          />
          <StickyResult label="Pavers" value={num(result.count, 0)} />
          <Actions summary={summary} filename="paver-estimate.txt" title="Paver estimate" onReset={() => { setArea("24"); setLength("200"); setWidth("100"); setWaste("10") }} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function RoofingCalculator() {
  const [area, setArea] = useState("80")
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("m2")
  const [rise, setRise] = useState("300")
  const [run, setRun] = useState("1000")
  const [waste, setWaste] = useState("10")
  const parsed = useMemo(() => {
    const plan = parseArea(area, areaUnit)
    const riseMm = parseLength(rise, "mm")
    const runMm = parseLength(run, "mm")
    const wastePercent = parseNumber(waste) ?? 0
    const issues = [positive(plan, "a plan area"), positive(riseMm, "a rise"), positive(runMm, "a run"), nonNegative(parseNumber(waste), "a waste percent")].filter((issue): issue is string => Boolean(issue))
    if (issues.length || plan === null || riseMm === null || runMm === null) return { issues, result: null }
    const roof = roofArea(plan, riseMm, runMm)
    const order = roof.area * (1 + wastePercent / 100)
    return { issues, result: { ...roof, plan, wastePercent, order } }
  }, [area, areaUnit, rise, run, waste])
  const result = parsed.result
  const summary = result ? `Roof area\nPlan: ${num(result.plan, 1)} m²\nPitch: ${num(result.angle, 1)}°\nSlope factor: ${num(result.factor, 3)}\nRoof: ${num(result.area, 1)} m²\nWith ${num(result.wastePercent, 0)}% waste: ${num(result.order, 1)} m²` : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        Sloped roof area from the plan (footprint) area and the pitch. Add waste before you order sheets or tiles.
      </p>
      <Section title="Measure">
        <div className="grid gap-4 sm:grid-cols-3">
          <MeasureField label="Plan area" value={area} onChange={setArea} unit={areaUnit} onUnitChange={(next) => setAreaUnit(next as AreaUnit)} units={AREA_UNITS} hint="The flat footprint, not the slope." />
          <QtyField label="Rise" value={rise} onChange={setRise} suffix="mm" />
          <QtyField label="Run" value={run} onChange={setRun} suffix="mm" />
        </div>
        <WasteSelector value={waste} onChange={setWaste} />
      </Section>
      <ExampleButton label="80 m² plan, 300 mm rise over 1000 mm" onClick={() => { setArea("80"); setRise("300"); setRun("1000"); setWaste("10") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Roof area"
            value={`${num(result.area, 1)} m²`}
            note={`The sloped area is ${num(result.area, 1)} m². With ${num(result.wastePercent, 0)}% waste, order about ${num(result.order, 1)} m².`}
            rows={[
              { label: "Plan area", value: `${num(result.plan, 1)} m²` },
              { label: "Pitch", value: `${num(result.angle, 1)}°` },
              { label: "With waste", value: `${num(result.order, 1)} m²` },
            ]}
            assumptions={["Eaves are included only if they are in the plan area.", "Hips, valleys, and ridge need extra — that is what waste is for."]}
          />
          <StickyResult label="Roof area" value={`${num(result.area, 1)} m²`} />
          <Actions summary={summary} filename="roof-area.txt" title="Roof area" onReset={() => { setArea("80"); setRise("300"); setRun("1000"); setWaste("10") }} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function RoofingShingleCalculator() {
  const [area, setArea] = useState("90")
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("m2")
  const [cover, setCover] = useState("3")
  const [waste, setWaste] = useState("10")
  const parsed = useMemo(() => {
    const roof = parseArea(area, areaUnit)
    const coverM2 = parseNumber(cover)
    const wastePercent = parseNumber(waste) ?? 0
    const issues = [positive(roof, "a roof area"), positive(coverM2, "cover per bundle"), nonNegative(parseNumber(waste), "a waste percent")].filter((issue): issue is string => Boolean(issue))
    if (issues.length || roof === null || coverM2 === null) return { issues, result: null }
    const result = coveringCount(roof, coverM2, wastePercent)
    return { issues, result, coverM2 }
  }, [area, areaUnit, cover, waste])
  const result = parsed.result
  const summary = result ? `Shingles\nRoof: ${num(result.area, 1)} m²\nCover per bundle: ${num(parsed.coverM2 ?? 0, 2)} m²\nWaste: ${num(result.wastePercent, 0)}%\nBundles: ${num(result.count, 0)}` : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        Bundles of shingles from the roof area and the cover per bundle on the wrapping. Starter strips and ridge are extra.
      </p>
      <Section title="Measure">
        <div className="grid gap-4 sm:grid-cols-2">
          <MeasureField label="Roof area" value={area} onChange={setArea} unit={areaUnit} onUnitChange={(next) => setAreaUnit(next as AreaUnit)} units={AREA_UNITS} />
          <QtyField label="Cover per bundle" value={cover} onChange={setCover} suffix="m²" hint="Printed on the wrapping." />
        </div>
        <WasteSelector value={waste} onChange={setWaste} />
      </Section>
      <ExampleButton label="90 m² at 3 m² a bundle" onClick={() => { setArea("90"); setCover("3"); setWaste("10") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Bundles to order"
            value={num(result.count, 0)}
            note={`You need ${num(result.count, 0)} bundles for ${num(result.area, 1)} m², including ${num(result.wastePercent, 0)}% waste.`}
            rows={[{ label: "Roof area", value: `${num(result.area, 1)} m²` }, { label: "With waste", value: `${num(result.total, 1)} m²` }]}
            assumptions={["Starter strips, hips, and ridge are not included.", "3 m² a bundle is a starting point — use the product label."]}
          />
          <StickyResult label="Bundles" value={num(result.count, 0)} />
          <Actions summary={summary} filename="shingle-estimate.txt" title="Shingle estimate" onReset={() => { setArea("90"); setCover("3"); setWaste("10") }} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function GutterCalculator() {
  const [unit, setUnit] = useState<LengthUnit>("m")
  const [length, setLength] = useState("22")
  const parsed = useMemo(() => {
    const lengthM = parseLength(length, unit)
    const issues = [positive(lengthM, "a gutter length")].filter((issue): issue is string => Boolean(issue))
    if (issues.length || lengthM === null) return { issues, result: null }
    return { issues, result: gutterParts(lengthM) }
  }, [length, unit])
  const result = parsed.result
  const summary = result ? `Gutter\nLength: ${num(result.lengthM, 1)} m\nDownpipes: ${num(result.downpipes, 0)}\n(one every 8 m — a spacing guide, not a drainage design)` : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        Gutter length and a rough downpipe count. One downpipe every 8 metres is a starting point — rainfall and local rules can ask for closer spacing.
      </p>
      <Section title="Measure">
        <MeasureField label="Gutter length" value={length} onChange={setLength} unit={unit} onUnitChange={(next) => setUnit(next as LengthUnit)} units={LENGTH_UNITS} hint="Total run, including each side you are guttering." />
      </Section>
      <ExampleButton label="22 m of gutter" onClick={() => { setUnit("m"); setLength("22") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Gutter"
            value={`${num(result.lengthM, 1)} m`}
            note={`${num(result.lengthM, 1)} m of gutter, with a rough ${num(result.downpipes, 0)} downpipe${result.downpipes === 1 ? "" : "s"} at one every 8 m.`}
            rows={[{ label: "Downpipes", value: num(result.downpipes, 0) }]}
            assumptions={["Corners, outlets, and stop ends are not counted.", "This is a spacing guide, not a stormwater design."]}
          />
          <StickyResult label="Gutter" value={`${num(result.lengthM, 1)} m`} />
          <Actions summary={summary} filename="gutter-estimate.txt" title="Gutter estimate" onReset={() => setLength("22")} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function HvacBtuCalculator() {
  const [area, setArea] = useState("40")
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("m2")
  const parsed = useMemo(() => {
    const areaM2 = parseArea(area, areaUnit)
    const issues = [positive(areaM2, "a floor area")].filter((issue): issue is string => Boolean(issue))
    if (issues.length || areaM2 === null) return { issues, result: null }
    return { issues, result: { ...hvacLoad(areaM2), areaM2 } }
  }, [area, areaUnit])
  const result = parsed.result
  const summary = result
    ? `Cooling load (rough)\nFloor: ${num(result.areaM2, 1)} m²\nMid: ${num(result.btu, 0)} BTU/h · ${num(result.kw, 2)} kW\nRange: ${num(result.lowKw, 1)}–${num(result.highKw, 1)} kW\nThis is a rule of thumb, not a heat load.`
    : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        A rough cooling load from floor area — about 430 BTU per square metre. It is a range to get in the right band, not a specification. Have a technician size the real system.
      </p>
      <Section title="Measure">
        <MeasureField label="Floor area" value={area} onChange={setArea} unit={areaUnit} onUnitChange={(next) => setAreaUnit(next as AreaUnit)} units={AREA_UNITS} />
      </Section>
      <ExampleButton label="a 40 m² room" onClick={() => { setArea("40"); setAreaUnit("m2") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Rough cooling load"
            value={`${num(result.kw, 1)} kW`}
            note={`About ${num(result.btu, 0)} BTU/h (${num(result.kw, 2)} kW) for ${num(result.areaM2, 1)} m². A sensible band is ${num(result.lowKw, 1)}–${num(result.highKw, 1)} kW. Glass, insulation, and climate will move this.`}
            rows={[
              { label: "BTU/h", value: num(result.btu, 0) },
              { label: "Range", value: `${num(result.lowKw, 1)}–${num(result.highKw, 1)} kW` },
            ]}
            assumptions={["Uses ~430 BTU per m² (about 40 BTU/ft²).", "Not a certified heat load. Do not buy a unit from this number alone."]}
          />
          <StickyResult label="Rough load" value={`${num(result.kw, 1)} kW`} />
          <Actions summary={summary} filename="hvac-estimate.txt" title="HVAC estimate" onReset={() => setArea("40")} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function BoardFootCalculator() {
  const [thickness, setThickness] = useState("25")
  const [width, setWidth] = useState("150")
  const [length, setLength] = useState("2.4")
  const [count, setCount] = useState("8")
  const parsed = useMemo(() => {
    const thicknessMm = parseNumber(thickness)
    const widthMm = parseNumber(width)
    const lengthM = parseLength(length, "m")
    const pieces = parseNumber(count)
    const issues = [positive(thicknessMm, "thickness"), positive(widthMm, "width"), positive(lengthM, "length"), positive(pieces, "the number of pieces")].filter((issue): issue is string => Boolean(issue))
    if (issues.length || thicknessMm === null || widthMm === null || lengthM === null || pieces === null) return { issues, result: null }
    return { issues, result: { ...boardFeet(thicknessMm, widthMm, lengthM, pieces), thicknessMm, widthMm, lengthM, pieces } }
  }, [thickness, width, length, count])
  const result = parsed.result
  const summary = result
    ? `Board feet\n${num(result.pieces, 0)} pcs, ${num(result.thicknessMm, 0)} × ${num(result.widthMm, 0)} mm × ${num(result.lengthM, 2)} m\nBoard feet: ${num(result.total, 1)}\nVolume: ${num(result.m3, 3)} m³`
    : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        Board feet from thickness, width, and length. Timber here is millimetres and metres; board feet are the imperial volume used in some price lists.
      </p>
      <Section title="Measure">
        <div className="grid gap-4 sm:grid-cols-2">
          <QtyField label="Thickness" value={thickness} onChange={setThickness} suffix="mm" />
          <QtyField label="Width" value={width} onChange={setWidth} suffix="mm" />
          <QtyField label="Length" value={length} onChange={setLength} suffix="m" />
          <QtyField label="Pieces" value={count} onChange={setCount} />
        </div>
      </Section>
      <ExampleButton label="eight 25 × 150 mm × 2.4 m pieces" onClick={() => { setThickness("25"); setWidth("150"); setLength("2.4"); setCount("8") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Board feet"
            value={num(result.total, 1)}
            note={`${num(result.pieces, 0)} pieces of ${num(result.thicknessMm, 0)} × ${num(result.widthMm, 0)} mm × ${num(result.lengthM, 2)} m is ${num(result.total, 1)} board feet (${num(result.m3, 3)} m³).`}
            rows={[
              { label: "Each", value: `${num(result.each, 2)} bf` },
              { label: "Volume", value: `${num(result.m3, 3)} m³` },
            ]}
            assumptions={["A board foot is 12 × 12 × 1 inch.", "Waste is not included. Count the pieces you will cut from, not the finished count, if offcuts matter."]}
          />
          <StickyResult label="Board feet" value={num(result.total, 1)} />
          <Actions summary={summary} filename="board-feet.txt" title="Board feet" onReset={() => { setThickness("25"); setWidth("150"); setLength("2.4"); setCount("8") }} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function StairStringerCalculator() {
  const [rise, setRise] = useState("2700")
  const [riser, setRiser] = useState("175")
  const [going, setGoing] = useState("250")
  const parsed = useMemo(() => {
    const totalRise = parseNumber(rise)
    const target = parseNumber(riser)
    const goingMm = parseNumber(going)
    const issues = [positive(totalRise, "total rise"), positive(target, "a target riser"), positive(goingMm, "a going")].filter((issue): issue is string => Boolean(issue))
    if (issues.length || totalRise === null || target === null || goingMm === null) return { issues, result: null }
    const result = stairStringer(totalRise, target, goingMm)
    return { issues, result }
  }, [rise, riser, going])
  const result = parsed.result
  const inBand = result ? result.twoRPlusG >= 700 && result.twoRPlusG <= 750 : false
  const summary = result
    ? `Stair stringer (estimate)\nTotal rise: ${rise} mm\nRisers: ${num(result.risers, 0)} × ${num(result.riserMm, 0)} mm\nTreads: ${num(result.treads, 0)} × ${num(result.goingMm, 0)} mm\n2R+G: ${num(result.twoRPlusG, 0)} mm\nStringer: ${num(result.stringerM, 2)} m\nNot a code check — confirm against the rules that apply.`
    : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        Risers, goings, and a stringer length for a total rise. This is geometry so you can cut a stringer to try — it is not a building-code certificate.
      </p>
      <Section title="Measure">
        <div className="grid gap-4 sm:grid-cols-3">
          <QtyField label="Total rise" value={rise} onChange={setRise} suffix="mm" hint="Floor to floor." />
          <QtyField label="Target riser" value={riser} onChange={setRiser} suffix="mm" hint="Often around 170–180 mm." />
          <QtyField label="Going" value={going} onChange={setGoing} suffix="mm" hint="Tread depth, nosing aside." />
        </div>
      </Section>
      <ExampleButton label="2700 mm rise, 175 mm riser, 250 mm going" onClick={() => { setRise("2700"); setRiser("175"); setGoing("250") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Stringer length"
            value={`${num(result.stringerM, 2)} m`}
            note={`${num(result.risers, 0)} risers of ${num(result.riserMm, 0)} mm and ${num(result.treads, 0)} treads of ${num(result.goingMm, 0)} mm. 2R+G is ${num(result.twoRPlusG, 0)} mm${inBand ? " — inside the 700–750 mm band many Australian guides use" : " — outside the 700–750 mm band many Australian guides use"}.`}
            rows={[
              { label: "Risers", value: `${num(result.risers, 0)} × ${num(result.riserMm, 0)} mm` },
              { label: "Treads", value: num(result.treads, 0) },
              { label: "2R+G", value: `${num(result.twoRPlusG, 0)} mm` },
            ]}
            assumptions={["Not a certified stair design. Check the code that applies before you build.", "Stringer length is the hypotenuse of one riser and going, times the number of risers."]}
          />
          <StickyResult label="Stringer" value={`${num(result.stringerM, 2)} m`} />
          <Actions summary={summary} filename="stair-stringer.txt" title="Stair stringer" onReset={() => { setRise("2700"); setRiser("175"); setGoing("250") }} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function StudWallCalculator() {
  const [unit, setUnit] = useState<LengthUnit>("m")
  const [length, setLength] = useState("4.8")
  const [spacing, setSpacing] = useState("450")
  const [extra, setExtra] = useState("0")
  const parsed = useMemo(() => {
    const lengthM = parseLength(length, unit)
    const spacingMm = parseNumber(spacing)
    const extraStuds = parseNumber(extra) ?? 0
    const issues = [positive(lengthM, "a wall length"), positive(spacingMm, "centres"), nonNegative(parseNumber(extra) ?? 0, "extra studs")].filter((issue): issue is string => Boolean(issue))
    if (issues.length || lengthM === null || spacingMm === null) return { issues, result: null }
    const count = studCount(lengthM, spacingMm, extraStuds)
    if (count === null) return { issues: ["Enter centres greater than 0."], result: null }
    return { issues, result: { count, lengthM, spacingMm, extraStuds } }
  }, [length, spacing, extra, unit])
  const result = parsed.result
  const summary = result ? `Stud wall\nLength: ${num(result.lengthM, 2)} m\nCentres: ${num(result.spacingMm, 0)} mm\nExtra: ${num(result.extraStuds, 0)}\nStuds: ${num(result.count, 0)}` : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        How many studs a straight wall needs at the spacing you set, counting both ends. Add extras for corners, doors, and windows.
      </p>
      <Section title="Measure">
        <div className="grid gap-4 sm:grid-cols-3">
          <MeasureField label="Wall length" value={length} onChange={setLength} unit={unit} onUnitChange={(next) => setUnit(next as LengthUnit)} units={LENGTH_UNITS} />
          <QtyField label="Centres" value={spacing} onChange={setSpacing} suffix="mm" hint="450 mm or 600 mm." />
          <QtyField label="Extra studs" value={extra} onChange={setExtra} optional hint="Corners, doors, windows." />
        </div>
      </Section>
      <ExampleButton label="4.8 m at 450 mm centres" onClick={() => { setUnit("m"); setLength("4.8"); setSpacing("450"); setExtra("0") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Studs"
            value={num(result.count, 0)}
            note={`A ${num(result.lengthM, 2)} m wall at ${num(result.spacingMm, 0)} mm centres needs ${num(result.count, 0)} studs, counting both ends.`}
            rows={[
              { label: "Centres", value: `${num(result.spacingMm, 0)} mm` },
              { label: "Extra", value: num(result.extraStuds, 0) },
            ]}
            assumptions={["Plates and noggins are not included.", "This is a straight run. Junctions and openings need extra studs."]}
          />
          <StickyResult label="Studs" value={num(result.count, 0)} />
          <Actions summary={summary} filename="stud-wall.txt" title="Stud wall" onReset={() => { setLength("4.8"); setSpacing("450"); setExtra("0") }} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}

export function ConstructionEstimateGenerator() {
  const [lines, setLines] = useState("Demolition, 800\nFraming, 2400\nFixing, 1600")
  const [margin, setMargin] = useState("15")
  const parsed = useMemo(() => {
    const estimate = estimateLines(lines)
    const markupPercent = parseNumber(margin)
    const issues = [...estimate.issues]
    const marginIssue = nonNegative(markupPercent, "a markup percent")
    if (marginIssue) issues.push(marginIssue)
    if (estimate.rows.length === 0 && !estimate.issues.length) issues.push("Add at least one line — a name, then an amount.")
    if (issues.length || markupPercent === null) return { issues, result: null }
    const priced = estimatePrice(estimate.cost, markupPercent)
    return { issues, result: { ...priced, rows: estimate.rows } }
  }, [lines, margin])
  const result = parsed.result
  const summary = result
    ? [`Construction estimate`, ...result.rows.map((row) => `${row.name}: ${money(row.amount)}`), `Cost: ${money(result.cost)}`, `Markup ${num(result.markupPercent, 0)}%: ${money(result.markup)}`, `Price: ${money(result.price)}`, `Markup is added on top of cost. It is not margin on the selling price.`].join("\n")
    : ""
  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        Add up line costs and apply a markup on top. One line each: a name, then the amount. Example: Framing, 2400.
      </p>
      <Section title="Lines">
        <label className="flex flex-col gap-2">
          <span className="text-[13px] text-[var(--nb-primary)]">Cost lines</span>
          <textarea
            value={lines}
            onChange={(event) => setLines(event.target.value)}
            rows={8}
            className="min-h-36 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
        <QtyField label="Markup" value={margin} onChange={setMargin} suffix="%" hint="Added on top of cost, not taken from the selling price." />
      </Section>
      <ExampleButton label="demolition, framing, and fixing at 15%" onClick={() => { setLines("Demolition, 800\nFraming, 2400\nFixing, 1600"); setMargin("15") }} />
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard
            label="Price"
            value={money(result.price)}
            note={`${money(result.cost)} of cost plus ${num(result.markupPercent, 0)}% markup (${money(result.markup)}) is ${money(result.price)}.`}
            rows={[
              { label: "Cost", value: money(result.cost) },
              { label: "Markup", value: money(result.markup) },
            ]}
            assumptions={["This is markup on cost, not margin on the selling price.", "Not a quote document — use Quote Builder if you need to send one."]}
          >
            <ul className="flex flex-col gap-1 text-[13px] text-[var(--nb-secondary)]">
              {result.rows.map((row) => (
                <li key={row.name} className="flex justify-between gap-4">
                  <span>{row.name}</span>
                  <span className="tabular-nums text-[var(--nb-primary)]">{money(row.amount)}</span>
                </li>
              ))}
            </ul>
          </ResultCard>
          <StickyResult label="Price" value={money(result.price)} />
          <Actions summary={summary} filename="construction-estimate.txt" title="Construction estimate" onReset={() => { setLines("Demolition, 800\nFraming, 2400\nFixing, 1600"); setMargin("15") }} />
        </>
      ) : (
        <PrivacyNote />
      )}
    </TradeShell>
  )
}
