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
  LENGTH_UNITS,
  flooringPacks,
  nonNegative,
  parseLength,
  parseNumber,
  plasterSheets,
  positive,
  studCount,
  type LengthUnit,
} from "@/lib/trade/math"
import { useMemo, useState } from "react"

type Kind = "plaster" | "studs" | "floor"

const defaults = {
  plaster: { length: "6", height: "2.7", waste: "10" },
  studs: { length: "4.8", spacing: "450", extra: "0" },
  floor: { length: "4", width: "3", coverage: "2.4", waste: "10" },
}

export function MaterialEstimator() {
  const [kind, setKind] = useState<Kind>("plaster")
  const [unit, setUnit] = useState<LengthUnit>("m")
  const [length, setLength] = useState(defaults.plaster.length)
  const [height, setHeight] = useState(defaults.plaster.height)
  const [width, setWidth] = useState(defaults.floor.width)
  const [spacing, setSpacing] = useState(defaults.studs.spacing)
  const [extra, setExtra] = useState(defaults.studs.extra)
  const [coverage, setCoverage] = useState(defaults.floor.coverage)
  const [waste, setWaste] = useState(defaults.plaster.waste)

  function switchKind(next: string) {
    const id = next as Kind
    setKind(id)
    if (id === "plaster") {
      setLength(defaults.plaster.length)
      setHeight(defaults.plaster.height)
      setWaste(defaults.plaster.waste)
    }
    if (id === "studs") {
      setLength(defaults.studs.length)
      setSpacing(defaults.studs.spacing)
      setExtra(defaults.studs.extra)
    }
    if (id === "floor") {
      setLength(defaults.floor.length)
      setWidth(defaults.floor.width)
      setCoverage(defaults.floor.coverage)
      setWaste(defaults.floor.waste)
    }
  }

  const parsed = useMemo(() => {
    const lengthM = parseLength(length, unit)
    const heightM = parseLength(height, unit)
    const widthM = parseLength(width, unit)
    const spacingMm = parseNumber(spacing)
    const extraStuds = parseNumber(extra) ?? 0
    const packM2 = parseNumber(coverage)
    const wastePercent = parseNumber(waste) ?? 0

    const issues: string[] = []
    const lengthIssue = positive(lengthM, kind === "studs" ? "a wall length" : "a length")
    if (lengthIssue) issues.push(lengthIssue)

    if (kind === "plaster") {
      const heightIssue = positive(heightM, "a wall height")
      if (heightIssue) issues.push(heightIssue)
      const wasteIssue = nonNegative(parseNumber(waste), "a waste percent")
      if (wasteIssue) issues.push(wasteIssue)
      if (issues.length || lengthM === null || heightM === null) return { issues, result: null }
      const sheets = plasterSheets(lengthM, heightM, wastePercent)
      return {
        issues,
        result: {
          kind,
          hero: `${num(sheets.sheets, 0)} sheets`,
          note: `You need ${num(sheets.sheets, 0)} sheets of 2400 × 1200 mm plasterboard for ${num(sheets.area, 1)} m², including ${num(wastePercent, 0)}% waste.`,
          rows: [
            { label: "Wall area", value: `${num(sheets.area, 1)} m²` },
            { label: "Waste", value: `${num(wastePercent, 0)}% · ${num(sheets.waste, 1)} m²` },
            { label: "Order", value: `${num(sheets.sheets, 0)} × 2400 × 1200 mm` },
          ],
          assumptions: [
            "Sheets are 2400 × 1200 mm (2.88 m²).",
            `${num(wastePercent, 0)}% waste is included for cuts.`,
            "This is one face of the wall. Double the length if you are lining both sides.",
            "Openings, corners, and offcuts on site will change the real order.",
          ],
          summary: [
            "Material: plasterboard",
            `Wall: ${num(lengthM, 2)} m × ${num(heightM, 2)} m (${num(sheets.area, 1)} m²)`,
            `Waste: ${num(wastePercent, 0)}% (${num(sheets.waste, 1)} m²)`,
            `Sheets: ${num(sheets.sheets, 0)} of 2400 × 1200 mm`,
          ].join("\n"),
          job: [
            { label: "Material", value: "Plasterboard 2400 × 1200 mm" },
            { label: "Area", value: `${num(sheets.area, 1)} m²` },
            { label: "Waste", value: `${num(wastePercent, 0)}%` },
            { label: "Order", value: `${num(sheets.sheets, 0)} sheets` },
          ],
        },
      }
    }

    if (kind === "studs") {
      const spacingIssue = positive(spacingMm, "stud spacing")
      if (spacingIssue) issues.push(spacingIssue)
      const extraIssue = nonNegative(parseNumber(extra) ?? 0, "extra studs")
      if (extraIssue) issues.push(extraIssue)
      if (issues.length || lengthM === null || spacingMm === null) return { issues, result: null }
      const count = studCount(lengthM, spacingMm, extraStuds)
      if (count === null) return { issues: ["Enter stud spacing greater than 0."], result: null }
      return {
        issues,
        result: {
          kind,
          hero: `${num(count, 0)} studs`,
          note: `A ${num(lengthM, 2)} m wall at ${num(spacingMm, 0)} mm centres needs ${num(count, 0)} studs, counting both ends${extraStuds ? ` and ${num(extraStuds, 0)} extra` : ""}.`,
          rows: [
            { label: "Centres", value: `${num(spacingMm, 0)} mm` },
            { label: "Extra", value: num(extraStuds, 0) },
            { label: "Studs", value: num(count, 0) },
          ],
          assumptions: [
            "Count includes a stud at each end.",
            "Plates, noggins, and lintels are not included.",
            "Add extra studs for corners, doors, and windows.",
          ],
          summary: [
            "Material: timber studs",
            `Wall length: ${num(lengthM, 2)} m`,
            `Centres: ${num(spacingMm, 0)} mm`,
            `Studs: ${num(count, 0)}`,
          ].join("\n"),
          job: [
            { label: "Material", value: "Timber studs" },
            { label: "Wall", value: `${num(lengthM, 2)} m` },
            { label: "Centres", value: `${num(spacingMm, 0)} mm` },
            { label: "Order", value: `${num(count, 0)} studs` },
          ],
        },
      }
    }

    const widthIssue = positive(widthM, "a width")
    if (widthIssue) issues.push(widthIssue)
    const coverIssue = positive(packM2, "coverage per pack")
    if (coverIssue) issues.push(coverIssue)
    const wasteIssue = nonNegative(parseNumber(waste), "a waste percent")
    if (wasteIssue) issues.push(wasteIssue)
    if (issues.length || lengthM === null || widthM === null || packM2 === null) return { issues, result: null }
    const packs = flooringPacks(lengthM, widthM, packM2, wastePercent)
    return {
      issues,
      result: {
        kind,
        hero: `${num(packs.packs, 0)} packs`,
        note: `You need ${num(packs.packs, 0)} packs for ${num(packs.area, 1)} m², including ${num(wastePercent, 0)}% waste, at ${num(packM2, 2)} m² per pack.`,
        rows: [
          { label: "Floor area", value: `${num(packs.area, 1)} m²` },
          { label: "With waste", value: `${num(packs.total, 1)} m²` },
          { label: "Order", value: `${num(packs.packs, 0)} packs` },
        ],
        assumptions: [
          `${num(wastePercent, 0)}% waste is included for cuts.`,
          `Each pack covers ${num(packM2, 2)} m² — use the figure on the carton.`,
          "Confirm pack coverage and laying pattern with the supplier.",
        ],
        summary: [
          "Material: flooring packs",
          `Area: ${num(packs.area, 1)} m²`,
          `Waste: ${num(wastePercent, 0)}% (${num(packs.waste, 1)} m²)`,
          `To order: ${num(packs.total, 1)} m² · ${num(packs.packs, 0)} packs`,
        ].join("\n"),
        job: [
          { label: "Material", value: "Flooring" },
          { label: "Area", value: `${num(packs.area, 1)} m²` },
          { label: "Waste", value: `${num(wastePercent, 0)}%` },
          { label: "Order", value: `${num(packs.packs, 0)} packs` },
        ],
      },
    }
  }, [kind, unit, length, height, width, spacing, extra, coverage, waste])

  const result = parsed.result

  return (
    <TradeShell>
      <p className="max-w-xl text-[13px] leading-relaxed text-[var(--nb-secondary)]">
        Ballpark the sheets, studs, or flooring packs for a job from measurements you already have. Take the order quantity to a supplier — then confirm pack sizes on the shelf.
      </p>
      <ModeTabs
        label="What are you estimating?"
        value={kind}
        onChange={switchKind}
        options={[
          { id: "plaster", label: "Plasterboard" },
          { id: "studs", label: "Timber studs" },
          { id: "floor", label: "Flooring packs" },
        ]}
      />
      <Section title="Measure">
        <div className="grid gap-4 sm:grid-cols-3">
          <MeasureField
            label={kind === "studs" ? "Wall length" : "Length"}
            value={length}
            onChange={setLength}
            unit={unit}
            onUnitChange={(next) => setUnit(next as LengthUnit)}
            units={LENGTH_UNITS}
          />
          {kind === "plaster" ? (
            <MeasureField
              label="Height"
              value={height}
              onChange={setHeight}
              unit={unit}
              onUnitChange={(next) => setUnit(next as LengthUnit)}
              units={LENGTH_UNITS}
            />
          ) : null}
          {kind === "floor" ? (
            <MeasureField
              label="Width"
              value={width}
              onChange={setWidth}
              unit={unit}
              onUnitChange={(next) => setUnit(next as LengthUnit)}
              units={LENGTH_UNITS}
            />
          ) : null}
          {kind === "studs" ? (
            <QtyField label="Stud spacing" value={spacing} onChange={setSpacing} suffix="mm" hint="450 mm and 600 mm are common." />
          ) : null}
          {kind === "studs" ? (
            <QtyField label="Extra studs" value={extra} onChange={setExtra} optional hint="Corners, doors, windows." />
          ) : null}
          {kind === "floor" ? (
            <QtyField label="Coverage per pack" value={coverage} onChange={setCoverage} suffix="m²" hint="Printed on the carton." />
          ) : null}
        </div>
        {kind !== "studs" ? <WasteSelector value={waste} onChange={setWaste} /> : null}
      </Section>
      {kind === "plaster" ? (
        <ExampleButton
          label="a 6 m × 2.7 m wall"
          onClick={() => {
            setKind("plaster")
            setUnit("m")
            setLength("6")
            setHeight("2.7")
            setWaste("10")
          }}
        />
      ) : null}
      {kind === "studs" ? (
        <ExampleButton
          label="4.8 m at 450 mm centres"
          onClick={() => {
            setKind("studs")
            setUnit("m")
            setLength("4.8")
            setSpacing("450")
            setExtra("0")
          }}
        />
      ) : null}
      {kind === "floor" ? (
        <ExampleButton
          label="a 4 m × 3 m floor"
          onClick={() => {
            setKind("floor")
            setUnit("m")
            setLength("4")
            setWidth("3")
            setCoverage("2.4")
            setWaste("10")
          }}
        />
      ) : null}
      <IssueList issues={parsed.issues} />
      {result ? (
        <>
          <ResultCard label="Required material" value={result.hero} note={result.note} rows={result.rows} assumptions={result.assumptions} />
          <Section title="Job summary">
            <JobSummary rows={result.job} />
          </Section>
          <StickyResult label="Order" value={result.hero} />
        </>
      ) : null}
      <ActionBar>
        {result ? <CopyButton text={result.summary} label="Copy summary" /> : null}
        {result ? <DownloadButton text={result.summary} filename="material-estimate.txt" label="Download" /> : null}
        {result ? <PrintButton title="Material estimate" text={result.summary} /> : null}
        <ResetButton onClick={() => switchKind(kind)} />
      </ActionBar>
      <PrivacyNote />
    </TradeShell>
  )
}
