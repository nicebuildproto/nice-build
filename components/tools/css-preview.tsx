"use client"

import {
  ActionRow,
  ColourInput,
  CreativeShell,
  CssBlock,
  PresetRow,
  PreviewCanvas,
  RangeField,
} from "@/components/design/kit"
import { CopyButton, NumberField, ResetButton } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { parseHex } from "@/lib/design/colour"
import {
  aspectPresets,
  borderRadiusCss,
  borderRadiusDeclaration,
  boxShadowCss,
  boxShadowDeclaration,
  formatRem,
  pxToRem,
  radiusPresets,
  remScale,
  shadowPresets,
  solveAspect,
} from "@/lib/design/layout"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function BoxShadowGenerator() {
  const [x, setX] = useState(0)
  const [y, setY] = useState(8)
  const [blur, setBlur] = useState(24)
  const [spread, setSpread] = useState(0)
  const [colour, setColour] = useState("#111111")
  const [opacity, setOpacity] = useState(12)
  const [inset, setInset] = useState(false)
  const css = boxShadowCss(x, y, blur, spread, colour, opacity, inset)
  const declaration = boxShadowDeclaration(css)

  return (
    <CreativeShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
        <div className="flex flex-col gap-4">
          <RangeField label="X" value={x} min={-40} max={40} suffix="px" onChange={setX} />
          <RangeField label="Y" value={y} min={-40} max={40} suffix="px" onChange={setY} />
          <RangeField label="Blur" value={blur} min={0} max={80} suffix="px" onChange={setBlur} />
          <RangeField label="Spread" value={spread} min={-32} max={32} suffix="px" onChange={setSpread} />
          <RangeField label="Opacity" value={opacity} min={0} max={100} suffix="%" onChange={setOpacity} />
          <ColourInput label="Colour" value={colour} onChange={setColour} />
          <label className="flex items-center gap-2 text-sm text-[var(--nb-primary)]">
            <input type="checkbox" checked={inset} onChange={(event) => setInset(event.target.checked)} />
            Inset
          </label>
        </div>
        <PreviewCanvas className="grid min-h-64 place-items-center bg-[var(--nb-accent)]/35 p-10" label="Box shadow preview">
          <div className="size-28 rounded-2xl bg-background sm:size-36" style={{ boxShadow: css || undefined }} />
        </PreviewCanvas>
      </div>
      <PresetRow>
        {shadowPresets.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => {
              setX(preset.x)
              setY(preset.y)
              setBlur(preset.blur)
              setSpread(preset.spread)
              setColour(preset.colour)
              setOpacity(preset.opacity)
              setInset(preset.inset)
            }}
          >
            {preset.label}
          </Button>
        ))}
      </PresetRow>
      {declaration ? <CssBlock code={declaration} /> : null}
      <ActionRow>
        <CopyButton text={declaration} label="Copy CSS" />
        <ResetButton
          onClick={() => {
            setX(0)
            setY(8)
            setBlur(24)
            setSpread(0)
            setColour("#111111")
            setOpacity(12)
            setInset(false)
          }}
        />
      </ActionRow>
    </CreativeShell>
  )
}

export function BorderRadiusGenerator() {
  const [linked, setLinked] = useState(true)
  const [tl, setTl] = useState(16)
  const [tr, setTr] = useState(16)
  const [br, setBr] = useState(16)
  const [bl, setBl] = useState(16)
  const css = borderRadiusCss(tl, tr, br, bl)
  const declaration = borderRadiusDeclaration(css)

  function setAll(value: number) {
    setTl(value)
    setTr(value)
    setBr(value)
    setBl(value)
  }

  return (
    <CreativeShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm text-[var(--nb-primary)]">
            <input type="checkbox" checked={linked} onChange={(event) => setLinked(event.target.checked)} />
            Same on every corner
          </label>
          {linked ? (
            <RangeField label="Radius" value={tl} min={0} max={200} suffix="px" onChange={setAll} />
          ) : (
            <>
              <RangeField label="Top left" value={tl} min={0} max={200} suffix="px" onChange={setTl} />
              <RangeField label="Top right" value={tr} min={0} max={200} suffix="px" onChange={setTr} />
              <RangeField label="Bottom right" value={br} min={0} max={200} suffix="px" onChange={setBr} />
              <RangeField label="Bottom left" value={bl} min={0} max={200} suffix="px" onChange={setBl} />
            </>
          )}
        </div>
        <PreviewCanvas className="grid min-h-64 place-items-center bg-[var(--nb-accent)]/35 p-10" label="Border radius preview">
          <div className="size-36 bg-[var(--nb-primary)] sm:size-44" style={{ borderRadius: css }} />
        </PreviewCanvas>
      </div>
      <PresetRow>
        {radiusPresets.map((preset) => (
          <Button key={preset.id} type="button" variant="outline" className="h-10" onClick={() => { setLinked(true); setAll(preset.value) }}>
            {preset.label}
          </Button>
        ))}
      </PresetRow>
      <CssBlock code={declaration} />
      <ActionRow>
        <CopyButton text={declaration} label="Copy CSS" />
        <ResetButton
          onClick={() => {
            setLinked(true)
            setAll(16)
          }}
        />
      </ActionRow>
    </CreativeShell>
  )
}

export function AspectRatioCalculator() {
  const [width, setWidth] = useState("1920")
  const [height, setHeight] = useState("")
  const [ratioW, setRatioW] = useState("16")
  const [ratioH, setRatioH] = useState("9")
  const result = solveAspect({ width, height, ratioW, ratioH })

  return (
    <CreativeShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Width" value={width} onChange={setWidth} suffix="px" min={0} />
        <NumberField label="Height" value={height} onChange={setHeight} suffix="px" min={0} placeholder="leave blank" />
        <NumberField label="Ratio width" value={ratioW} onChange={setRatioW} min={0} />
        <NumberField label="Ratio height" value={ratioH} onChange={setRatioH} min={0} />
      </div>
      <PresetRow>
        {aspectPresets.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant="outline"
            className={cn("h-10", ratioW === preset.ratioW && ratioH === preset.ratioH && "border-[var(--nb-primary)]")}
            onClick={() => {
              setRatioW(preset.ratioW)
              setRatioH(preset.ratioH)
              setHeight("")
            }}
          >
            {preset.label}
          </Button>
        ))}
      </PresetRow>
      <PreviewCanvas className="grid min-h-56 place-items-center bg-[var(--nb-accent)]/35 p-6" label="Aspect ratio preview">
        {result ? (
          <div className="flex w-full max-w-md flex-col items-center gap-3">
            <div
              className="w-full max-h-48 bg-[var(--nb-primary)]"
              style={{ aspectRatio: `${result.ratioW} / ${result.ratioH}` }}
            />
            <p className="text-sm text-[var(--nb-secondary)]">
              {result.label}
              {result.width && result.height
                ? ` · ${formatSide(result.width)} × ${formatSide(result.height)}`
                : null}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--nb-secondary)]">Leave one side blank to solve it from the ratio.</p>
        )}
      </PreviewCanvas>
      {result ? (
        <ActionRow>
          <CopyButton text={result.label} label="Copy ratio" />
          {result.width && result.height ? (
            <CopyButton text={`${formatSide(result.width)} × ${formatSide(result.height)}`} label="Copy size" />
          ) : null}
          <ResetButton
            onClick={() => {
              setWidth("1920")
              setHeight("")
              setRatioW("16")
              setRatioH("9")
            }}
          />
        </ActionRow>
      ) : null}
    </CreativeShell>
  )
}

function formatSide(value: number) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10)
}

export function PxToRem() {
  const [px, setPx] = useState("16")
  const [root, setRoot] = useState("16")
  const pxNumber = Number(px)
  const rootNumber = Number(root)
  const rem = pxToRem(pxNumber, rootNumber)
  const parsedColour = parseHex("#111111")

  return (
    <CreativeShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Pixels" value={px} onChange={setPx} suffix="px" min={0} />
        <NumberField label="Root size" value={root} onChange={setRoot} suffix="px" min={0} />
      </div>
      <PreviewCanvas className="px-6 py-10" label="Type sample">
        {rem !== null ? (
          <p style={{ fontSize: `${pxNumber}px`, color: parsedColour ?? undefined }} className="leading-tight tracking-[-0.03em]">
            The quick brown fox
          </p>
        ) : (
          <p className="text-sm text-[var(--nb-secondary)]">Enter a pixel size and a root font size.</p>
        )}
      </PreviewCanvas>
      {rem !== null ? (
        <>
          <p className="font-mono text-2xl font-semibold tracking-[-0.03em]">{formatRem(rem)}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] text-left text-[13px]">
              <thead>
                <tr className="text-[var(--nb-secondary)]">
                  <th className="pb-2 font-medium">px</th>
                  <th className="pb-2 font-medium">rem</th>
                </tr>
              </thead>
              <tbody>
                {remScale.map((size) => {
                  const value = pxToRem(size, rootNumber)
                  return (
                    <tr key={size} className={size === pxNumber ? "font-medium" : undefined}>
                      <td className="py-1 tabular-nums">{size}</td>
                      <td className="py-1 font-mono tabular-nums">{value === null ? "—" : formatRem(value)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <ActionRow>
            <CopyButton text={formatRem(rem)} label="Copy rem" />
            <ResetButton
              onClick={() => {
                setPx("16")
                setRoot("16")
              }}
            />
          </ActionRow>
        </>
      ) : null}
    </CreativeShell>
  )
}
