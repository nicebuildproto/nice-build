import { parseHex, randomHex, shiftHex } from "./colour"

export type PaletteMode = "tints" | "complementary" | "analogous" | "triadic" | "mono"

export type Swatch = {
  id: string
  name: string
  hex: string
}

export const paletteModes: { id: PaletteMode; label: string }[] = [
  { id: "tints", label: "Tints & shades" },
  { id: "complementary", label: "Complementary" },
  { id: "analogous", label: "Analogous" },
  { id: "triadic", label: "Triadic" },
  { id: "mono", label: "Monochrome" },
]

export const palettePresets: { id: string; label: string; seed: string }[] = [
  { id: "forest", label: "Forest", seed: "#1f6f5b" },
  { id: "sunset", label: "Sunset", seed: "#c45c26" },
  { id: "ocean", label: "Ocean", seed: "#1c6ea4" },
  { id: "ink", label: "Ink", seed: "#111111" },
  { id: "bloom", label: "Bloom", seed: "#c43b6f" },
]

export function buildPalette(seed: string, mode: PaletteMode): Swatch[] {
  const base = parseHex(seed)
  if (!base) return []
  switch (mode) {
    case "tints":
      return [
        { id: "lighter", name: "Lighter", hex: shiftHex(base, 0, 0.38) },
        { id: "light", name: "Light", hex: shiftHex(base, 0, 0.18) },
        { id: "base", name: "Base", hex: base },
        { id: "dark", name: "Dark", hex: shiftHex(base, 0, -0.16) },
        { id: "darker", name: "Darker", hex: shiftHex(base, 0, -0.28) },
      ]
    case "complementary":
      return [
        { id: "base", name: "Base", hex: base },
        { id: "light", name: "Light", hex: shiftHex(base, 0, 0.2) },
        { id: "dark", name: "Dark", hex: shiftHex(base, 0, -0.18) },
        { id: "comp", name: "Complement", hex: shiftHex(base, 180, 0) },
        { id: "comp-light", name: "Comp. light", hex: shiftHex(base, 180, 0.16) },
      ]
    case "analogous":
      return [
        { id: "left", name: "−30°", hex: shiftHex(base, -30, 0) },
        { id: "near-left", name: "−12°", hex: shiftHex(base, -12, 0.04) },
        { id: "base", name: "Base", hex: base },
        { id: "near-right", name: "+12°", hex: shiftHex(base, 12, 0.04) },
        { id: "right", name: "+30°", hex: shiftHex(base, 30, 0) },
      ]
    case "triadic":
      return [
        { id: "base", name: "Base", hex: base },
        { id: "tri-a", name: "+120°", hex: shiftHex(base, 120, 0) },
        { id: "tri-b", name: "+240°", hex: shiftHex(base, 240, 0) },
        { id: "light", name: "Light", hex: shiftHex(base, 0, 0.22) },
        { id: "dark", name: "Dark", hex: shiftHex(base, 0, -0.18) },
      ]
    case "mono":
      return [
        { id: "l1", name: "100", hex: shiftHex(base, 0, 0.42) },
        { id: "l2", name: "200", hex: shiftHex(base, 0, 0.24) },
        { id: "l3", name: "400", hex: base },
        { id: "l4", name: "700", hex: shiftHex(base, 0, -0.18) },
        { id: "l5", name: "900", hex: shiftHex(base, 0, -0.32) },
      ]
  }
}

export function mergeLockedPalette(next: Swatch[], previous: Swatch[], locked: Set<string>) {
  if (locked.size === 0) return next
  const kept = new Map(previous.map((swatch) => [swatch.id, swatch.hex]))
  return next.map((swatch) => (locked.has(swatch.id) && kept.has(swatch.id) ? { ...swatch, hex: kept.get(swatch.id)! } : swatch))
}

export function paletteHexList(swatches: Swatch[]) {
  return swatches.map((swatch) => swatch.hex).join("\n")
}

export function paletteCssVars(swatches: Swatch[]) {
  const lines = swatches.map((swatch) => `  --${cssIdent(swatch.id)}: ${swatch.hex};`)
  return `:root {\n${lines.join("\n")}\n}`
}

export function paletteJson(swatches: Swatch[]) {
  return JSON.stringify(
    Object.fromEntries(swatches.map((swatch) => [swatch.id, swatch.hex])),
    null,
    2,
  )
}

export function isPaletteMode(value: string | null): value is PaletteMode {
  return paletteModes.some((mode) => mode.id === value)
}

export function randomPaletteSeed(random: () => number = Math.random) {
  return randomHex(random)
}

function cssIdent(value: string) {
  return value.replace(/[^a-z0-9-]/gi, "-").toLowerCase()
}
