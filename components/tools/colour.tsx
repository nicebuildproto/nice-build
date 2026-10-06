"use client"

import {
  ActionRow,
  ColourInput,
  CreativeShell,
  CssBlock,
  FormatRow,
  Grade,
  PresetRow,
  PreviewCanvas,
  RangeField,
  ShareLinkButton,
  useSearchString,
} from "@/components/design/kit"
import { CopyButton, ResetButton } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { colourFormats, contrastGrades, hslToHex, parseHex, parseQuery, suggestForeground } from "@/lib/design/colour"
import {
  defaultGradientStops,
  gradientCss,
  gradientDeclaration,
  randomGradient,
  reverseStops,
  stopsFromPreset,
  type GradientKind,
  type GradientStop,
  gradientPresets,
} from "@/lib/design/gradient"
import {
  buildPalette,
  isPaletteMode,
  mergeLockedPalette,
  paletteCssVars,
  paletteHexList,
  paletteJson,
  paletteModes,
  palettePresets,
  randomPaletteSeed,
  type PaletteMode,
  type Swatch,
} from "@/lib/design/palette"
import { cn } from "@/lib/utils"
import { Lock, Shuffle, Unlock } from "lucide-react"
import { useMemo, useState } from "react"

const defaultSeed = "#1f6f5b"
const defaultFg = "#111111"
const defaultBg = "#fffdf8"

export function ColourPalette() {
  const search = useSearchString()
  const fromUrl = useMemo(() => {
    const params = parseQuery(search)
    const seed = parseHex(params.get("seed") ?? "")
    const mode = params.get("mode")
    if (!seed && !isPaletteMode(mode)) return null
    return {
      seed: seed ?? defaultSeed,
      mode: isPaletteMode(mode) ? mode : ("tints" as PaletteMode),
    }
  }, [search])
  const [local, setLocal] = useState<{ seed: string; mode: PaletteMode; locked: string[]; swatches: Swatch[] } | null>(
    null,
  )
  const seed = local?.seed ?? fromUrl?.seed ?? defaultSeed
  const mode = local?.mode ?? fromUrl?.mode ?? "tints"
  const generated = useMemo(() => buildPalette(seed, mode), [mode, seed])
  const locked = new Set(local?.locked ?? [])
  const swatches = local?.swatches ? mergeLockedPalette(generated, local.swatches, locked) : generated
  const parsed = parseHex(seed)

  function commit(next: Partial<{ seed: string; mode: PaletteMode; locked: string[]; swatches: Swatch[] }>) {
    setLocal({
      seed: next.seed ?? seed,
      mode: next.mode ?? mode,
      locked: next.locked ?? [...locked],
      swatches: next.swatches ?? swatches,
    })
  }

  function toggleLock(id: string) {
    const next = new Set(locked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    commit({ locked: [...next], swatches })
  }

  function randomise() {
    const nextSeed = randomPaletteSeed()
    const next = mergeLockedPalette(buildPalette(nextSeed, mode), swatches, locked)
    commit({ seed: nextSeed, swatches: next })
  }

  const query = new URLSearchParams({ seed: parsed ?? seed, mode }).toString()

  return (
    <CreativeShell>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_1fr]">
        <ColourInput label="Starting colour" value={seed} onChange={(value) => commit({ seed: value })} />
        <label className="flex flex-col gap-2 text-[13px] text-[var(--nb-primary)]">
          Harmony
          <select
            className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={mode}
            onChange={(event) => commit({ mode: event.target.value as PaletteMode, locked: [] })}
          >
            {paletteModes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <PresetRow>
        {palettePresets.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant="outline"
            aria-pressed={parsed === preset.seed}
            className={cn("h-10", parsed === preset.seed && "border-[var(--nb-primary)]")}
            onClick={() => commit({ seed: preset.seed, locked: [], swatches: buildPalette(preset.seed, mode) })}
          >
            <span className="mr-2 size-3 rounded-sm border border-border" style={{ background: preset.seed }} />
            {preset.label}
          </Button>
        ))}
      </PresetRow>
      {parsed ? (
        <>
          <PreviewCanvas label="Palette">
            <ul className="grid grid-cols-2 sm:grid-cols-5">
              {swatches.map((swatch) => (
                <li key={swatch.id} className="flex min-h-40 flex-col sm:min-h-52">
                  <button
                    type="button"
                    className="min-h-24 flex-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    style={{ background: swatch.hex }}
                    aria-label={`${swatch.name} ${swatch.hex}`}
                    onClick={() => commit({ seed: swatch.hex })}
                  />
                  <div className="flex items-start justify-between gap-2 border-t border-border bg-background px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium">{swatch.name}</p>
                      <p className="font-mono text-[12px] text-[var(--nb-secondary)]">{swatch.hex}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-pressed={locked.has(swatch.id)}
                        aria-label={locked.has(swatch.id) ? `Unlock ${swatch.name}` : `Lock ${swatch.name}`}
                        className="grid size-9 place-items-center rounded-lg border border-border text-[var(--nb-primary)]"
                        onClick={() => toggleLock(swatch.id)}
                      >
                        {locked.has(swatch.id) ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                      </button>
                      <CopyButton text={swatch.hex} label="Copy" compact />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </PreviewCanvas>
          <p className="text-[12px] text-[var(--nb-secondary)]">
            Lock a swatch to keep it when you randomise. Click a colour to make it the starting colour.
          </p>
          <ActionRow>
            <Button type="button" className="h-10" onClick={randomise}>
              <Shuffle className="size-4" />
              Randomise unlocked
            </Button>
            <CopyButton text={paletteHexList(swatches)} label="Copy HEX" />
            <CopyButton text={paletteCssVars(swatches)} label="Copy CSS" />
            <CopyButton text={paletteJson(swatches)} label="Copy JSON" />
            <ShareLinkButton query={query} />
            <ResetButton
              onClick={() =>
                setLocal({ seed: defaultSeed, mode: "tints", locked: [], swatches: buildPalette(defaultSeed, "tints") })
              }
            />
          </ActionRow>
        </>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Enter a hex colour, like #1F6F5B.</p>
      )}
    </CreativeShell>
  )
}

const contrastPresets = [
  { id: "ink", label: "Ink on paper", fg: "#111111", bg: "#fffdf8" },
  { id: "inverse", label: "White on ink", fg: "#fffdf8", bg: "#111111" },
  { id: "brand", label: "Forest", fg: "#fffdf8", bg: "#1f6f5b" },
  { id: "navy", label: "Navy", fg: "#102a43", bg: "#f0f4f8" },
  { id: "fail", label: "Grey fail", fg: "#888888", bg: "#ffffff" },
] as const

export function ContrastChecker() {
  const search = useSearchString()
  const fromUrl = useMemo(() => {
    const params = parseQuery(search)
    const fg = parseHex(params.get("fg") ?? "")
    const bg = parseHex(params.get("bg") ?? "")
    if (!fg && !bg) return null
    return { fg: fg ?? defaultFg, bg: bg ?? defaultBg }
  }, [search])
  const [local, setLocal] = useState<{ fg: string; bg: string } | null>(null)
  const text = local?.fg ?? fromUrl?.fg ?? defaultFg
  const background = local?.bg ?? fromUrl?.bg ?? defaultBg
  const fg = parseHex(text)
  const bg = parseHex(background)
  const grades = fg && bg ? contrastGrades(fg, bg) : null
  const suggested = fg && bg ? suggestForeground(fg, bg, 4.5) : null

  function commit(next: Partial<{ fg: string; bg: string }>) {
    setLocal({ fg: next.fg ?? text, bg: next.bg ?? background })
  }

  return (
    <CreativeShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <ColourInput label="Text" value={text} onChange={(value) => commit({ fg: value })} />
        <ColourInput label="Background" value={background} onChange={(value) => commit({ bg: value })} />
      </div>
      <PresetRow>
        {contrastPresets.map((preset) => {
          const active = fg === preset.fg && bg === preset.bg
          return (
            <Button
              key={preset.id}
              type="button"
              variant="outline"
              aria-pressed={active}
              className={cn("h-10", active && "border-[var(--nb-primary)]")}
              onClick={() => commit({ fg: preset.fg, bg: preset.bg })}
            >
              {preset.label}
            </Button>
          )
        })}
      </PresetRow>
      <PreviewCanvas label="Contrast sample">
        <div className="grid sm:grid-cols-2" style={{ color: fg ?? undefined, background: bg ?? undefined }}>
          <div className="px-6 py-10">
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase opacity-70">Normal text</p>
            <p className="mt-3 text-base leading-relaxed">The quick brown fox jumps over the lazy dog.</p>
            <p className="mt-3 text-sm">Aa — 16px body copy on this pair.</p>
          </div>
          <div className="px-6 py-10">
            <p className="text-[11px] font-medium tracking-[0.12em] uppercase opacity-70">Large text</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.03em]">The quick brown fox</p>
            <p className="mt-2 text-lg font-semibold">Aa — 24px bold, treated as large.</p>
          </div>
        </div>
        <div
          className="flex flex-wrap items-center gap-3 border-t border-black/10 px-6 py-4 dark:border-white/10"
          style={{ color: fg ?? undefined, background: bg ?? undefined }}
        >
          <span className="text-[12px] opacity-70">UI</span>
          <span className="rounded-lg border border-current px-3 py-2 text-sm">Button</span>
          <span className="text-sm">Icons and controls need 3:1.</span>
        </div>
      </PreviewCanvas>
      {grades ? (
        <div className="flex flex-wrap gap-x-8 gap-y-5">
          <div>
            <p className="text-xs font-medium text-[var(--nb-secondary)]">Contrast</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{grades.ratio.toFixed(2)}:1</p>
          </div>
          <Grade label="WCAG AA" pass={grades.aaNormal} detail="Normal text, 4.5:1" />
          <Grade label="AA large" pass={grades.aaLarge} detail="Large text, 3:1" />
          <Grade label="WCAG AAA" pass={grades.aaaNormal} detail="Normal text, 7:1" />
          <Grade label="UI 3:1" pass={grades.ui} detail="Non-text contrast" />
        </div>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Enter two hex colours to see the ratio.</p>
      )}
      <ActionRow>
        <Button type="button" variant="outline" className="h-10" onClick={() => commit({ fg: background, bg: text })}>
          Swap colours
        </Button>
        {suggested && fg && suggested !== fg ? (
          <Button type="button" variant="outline" className="h-10" onClick={() => commit({ fg: suggested })}>
            Use {suggested} for AA
          </Button>
        ) : null}
        {fg && bg ? <CopyButton text={`${fg}\n${bg}`} label="Copy pair" /> : null}
        {fg && bg ? <ShareLinkButton query={new URLSearchParams({ fg, bg }).toString()} /> : null}
        <ResetButton onClick={() => commit({ fg: defaultFg, bg: defaultBg })} />
      </ActionRow>
    </CreativeShell>
  )
}

export function GradientGenerator() {
  const search = useSearchString()
  const fromUrl = useMemo(() => parseGradientQuery(search), [search])
  const [local, setLocal] = useState<{
    kind: GradientKind
    angle: number
    stops: GradientStop[]
  } | null>(null)
  const kind = local?.kind ?? fromUrl?.kind ?? "linear"
  const angle = local?.angle ?? fromUrl?.angle ?? 120
  const stops = local?.stops ?? fromUrl?.stops ?? defaultGradientStops
  const css = gradientCss(kind, angle, stops)
  const declaration = gradientDeclaration(css)

  function commit(next: Partial<{ kind: GradientKind; angle: number; stops: GradientStop[] }>) {
    setLocal({
      kind: next.kind ?? kind,
      angle: next.angle ?? angle,
      stops: next.stops ?? stops,
    })
  }

  function patchStop(id: string, patch: Partial<GradientStop>) {
    commit({
      stops: stops.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)),
    })
  }

  const query = new URLSearchParams({
    kind,
    angle: String(angle),
    stops: stops.map((stop) => `${(parseHex(stop.colour) ?? stop.colour).replace("#", "")}:${stop.position}`).join(","),
  }).toString()

  return (
    <CreativeShell>
      <PreviewCanvas label="Gradient preview">
        <div className="h-56 sm:h-72" style={{ background: css || undefined }} />
      </PreviewCanvas>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-[13px] text-[var(--nb-primary)]">
          Type
          <select
            className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={kind}
            onChange={(event) => commit({ kind: event.target.value as GradientKind })}
          >
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
        </label>
        {kind === "linear" ? (
          <RangeField label="Angle" value={angle} min={0} max={360} suffix="°" onChange={(value) => commit({ angle: value })} />
        ) : (
          <p className="self-end text-[13px] text-[var(--nb-secondary)]">Radial from the centre.</p>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {stops.map((stop, index) => (
          <div key={stop.id} className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_1fr_auto] sm:items-end">
            <ColourInput label={`Stop ${index + 1}`} value={stop.colour} onChange={(colour) => patchStop(stop.id, { colour })} />
            <RangeField
              label="Position"
              value={stop.position}
              min={0}
              max={100}
              suffix="%"
              onChange={(position) => patchStop(stop.id, { position })}
            />
            {stops.length > 2 ? (
              <Button type="button" variant="outline" className="h-10" onClick={() => commit({ stops: stops.filter((item) => item.id !== stop.id) })}>
                Remove
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      {stops.length < 3 ? (
        <Button
          type="button"
          variant="outline"
          className="h-10 w-fit"
          onClick={() =>
            commit({
              stops: [...stops, { id: "c", colour: "#1c6ea4", position: 50 }].sort((a, b) => a.position - b.position),
            })
          }
        >
          Add a stop
        </Button>
      ) : null}
      <PresetRow>
        {gradientPresets.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => {
              const next = stopsFromPreset(preset.id)
              if (next) commit(next)
            }}
          >
            {preset.label}
          </Button>
        ))}
      </PresetRow>
      {declaration ? <CssBlock code={declaration} /> : null}
      <ActionRow>
        <CopyButton text={declaration} label="Copy CSS" />
        <CopyButton text={stops.map((stop) => parseHex(stop.colour) ?? stop.colour).join("\n")} label="Copy HEX" />
        <Button type="button" variant="outline" className="h-10" onClick={() => commit({ stops: reverseStops(stops) })}>
          Reverse
        </Button>
        <Button type="button" variant="outline" className="h-10" onClick={() => commit(randomGradient())}>
          <Shuffle className="size-4" />
          Randomise
        </Button>
        <ShareLinkButton query={query} />
        <ResetButton onClick={() => commit({ kind: "linear", angle: 120, stops: defaultGradientStops })} />
      </ActionRow>
    </CreativeShell>
  )
}

function parseGradientQuery(search: string) {
  const params = parseQuery(search)
  const kindRaw = params.get("kind")
  const kind: GradientKind = kindRaw === "radial" ? "radial" : kindRaw === "linear" ? "linear" : "linear"
  const angleRaw = Number(params.get("angle"))
  const stopsRaw = params.get("stops")
  if (!stopsRaw && !params.get("kind") && !params.get("angle")) return null
  const stops = (stopsRaw ?? "")
    .split(",")
    .map((part, index) => {
      const [colour, position] = part.split(":")
      const hex = parseHex(colour ?? "")
      if (!hex) return null
      return {
        id: ["a", "b", "c"][index] ?? `s${index}`,
        colour: hex,
        position: Number(position) || 0,
      }
    })
    .filter((stop): stop is GradientStop => Boolean(stop))
  if (stops.length < 2) return { kind, angle: Number.isFinite(angleRaw) ? angleRaw : 120, stops: defaultGradientStops }
  return { kind, angle: Number.isFinite(angleRaw) ? angleRaw : 120, stops }
}

export function ColourPicker() {
  const [value, setValue] = useState("#ff0101")
  const formats = colourFormats(value)
  const hsl = formats?.hsl

  return (
    <CreativeShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex flex-col gap-4">
          <ColourInput label="Colour" value={value} onChange={setValue} />
          {formats && hsl ? (
            <>
              <RangeField
                label="Hue"
                value={Math.round(hsl.h)}
                min={0}
                max={360}
                suffix="°"
                onChange={(h) => setValue(hslToHex(h, hsl.s, hsl.l))}
              />
              <RangeField
                label="Saturation"
                value={Math.round(hsl.s * 100)}
                min={0}
                max={100}
                suffix="%"
                onChange={(s) => setValue(hslToHex(hsl.h, s / 100, hsl.l))}
              />
              <RangeField
                label="Lightness"
                value={Math.round(hsl.l * 100)}
                min={0}
                max={100}
                suffix="%"
                onChange={(l) => setValue(hslToHex(hsl.h, hsl.s, l / 100))}
              />
            </>
          ) : (
            <p className="text-sm text-[var(--nb-secondary)]">Use a hex colour such as #ff0101.</p>
          )}
        </div>
        <PreviewCanvas className="min-h-40" label="Colour swatch">
          <div className="h-full min-h-40" style={{ background: formats?.hex }} />
        </PreviewCanvas>
      </div>
      {formats ? (
        <>
          <FormatRow hex={formats.hex} rgb={formats.rgbCss} hsl={formats.hslCss} />
          <ActionRow>
            <CopyButton text={formats.hex} label="Copy HEX" />
            <CopyButton text={formats.rgbCss} label="Copy RGB" />
            <CopyButton text={formats.hslCss} label="Copy HSL" />
            <ResetButton onClick={() => setValue("#ff0101")} />
          </ActionRow>
        </>
      ) : null}
    </CreativeShell>
  )
}

export function HexToRgb() {
  const [hex, setHex] = useState("#ff0101")
  const formats = colourFormats(hex)
  return (
    <CreativeShell>
      <ColourInput label="Hex" value={hex} onChange={setHex} />
      <PreviewCanvas label="Converted colour">
        <div className="h-40" style={{ background: formats?.hex }} />
      </PreviewCanvas>
      {formats ? (
        <>
          <FormatRow hex={formats.hex} rgb={formats.rgbCss} hsl={formats.hslCss} />
          <ActionRow>
            <CopyButton text={formats.rgbList} label="Copy RGB values" />
            <CopyButton text={formats.rgbCss} label="Copy RGB" />
            <ResetButton onClick={() => setHex("#ff0101")} />
          </ActionRow>
        </>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Needs 3 or 6 hex digits. Alpha hex isn’t read.</p>
      )}
    </CreativeShell>
  )
}

export function RgbToHex() {
  const [r, setR] = useState("255")
  const [g, setG] = useState("1")
  const [b, setB] = useState("1")
  const rgb = [r, g, b].map((value) => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return null
    return Math.min(255, Math.max(0, Math.round(parsed)))
  })
  const valid = rgb.every((channel) => channel !== null)
  const hex = valid ? `#${rgb.map((channel) => (channel as number).toString(16).padStart(2, "0")).join("")}` : ""
  const formats = hex ? colourFormats(hex) : null

  return (
    <CreativeShell>
      <div className="grid gap-4 sm:grid-cols-3">
        <Channel label="Red" value={r} onChange={setR} />
        <Channel label="Green" value={g} onChange={setG} />
        <Channel label="Blue" value={b} onChange={setB} />
      </div>
      <PreviewCanvas label="Converted colour">
        <div className="h-40" style={{ background: formats?.hex }} />
      </PreviewCanvas>
      {formats ? (
        <>
          <FormatRow hex={formats.hex} rgb={formats.rgbCss} hsl={formats.hslCss} />
          <ActionRow>
            <CopyButton text={formats.hex} label="Copy HEX" />
            <ResetButton
              onClick={() => {
                setR("255")
                setG("1")
                setB("1")
              }}
            />
          </ActionRow>
        </>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Channels are 0 to 255.</p>
      )}
    </CreativeShell>
  )
}

function Channel({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const parsed = Number(value)
  const numeric = Number.isFinite(parsed) ? Math.min(255, Math.max(0, parsed)) : 0
  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-2 text-[13px] text-[var(--nb-primary)]">
        {label}
        <Input inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} className="h-10" />
      </label>
      <input
        type="range"
        min={0}
        max={255}
        value={numeric}
        aria-label={`${label} slider`}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full accent-[var(--nb-primary)]"
      />
    </div>
  )
}
