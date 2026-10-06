import {
  contrastRatio,
  hexToRgb,
  hslToRgb,
  parseHex,
  rgbToHex,
  rgbToHsl,
  shiftHex,
} from "../tools/format.ts"

export { contrastRatio, hexToRgb, hslToRgb, parseHex, rgbToHex, rgbToHsl, shiftHex }

export type Rgb = { r: number; g: number; b: number }
export type Hsl = { h: number; s: number; l: number }

export function clampChannel(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(255, Math.max(0, Math.round(value)))
}

export function formatRgb(hex: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
}

export function formatRgbList(hex: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`
}

export function formatHsl(hex: string) {
  const hsl = hexToHsl(hex)
  if (!hsl) return null
  return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`
}

export function hexToHsl(hex: string): Hsl | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

export function hslToHex(h: number, s: number, l: number) {
  const rgb = hslToRgb(h, s, l)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

export function randomHex(random: () => number = Math.random) {
  const h = random() * 360
  const s = 0.42 + random() * 0.46
  const l = 0.3 + random() * 0.32
  return hslToHex(h, s, l)
}

export type ContrastGrade = {
  ratio: number
  aaNormal: boolean
  aaLarge: boolean
  aaaNormal: boolean
  aaaLarge: boolean
  ui: boolean
}

export function contrastGrades(foreground: string, background: string): ContrastGrade | null {
  const ratio = contrastRatio(foreground, background)
  if (ratio === null) return null
  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
    ui: ratio >= 3,
  }
}

export function suggestForeground(foreground: string, background: string, target = 4.5) {
  const start = parseHex(foreground)
  const bg = parseHex(background)
  if (!start || !bg) return null
  const current = contrastRatio(start, bg)
  if (current !== null && current >= target) return start

  const hsl = hexToHsl(start)
  if (!hsl) return null

  let best: { hex: string; dist: number } | null = null
  for (const direction of [-1, 1] as const) {
    for (let step = 1; step <= 96; step += 1) {
      const nextL = Math.min(0.96, Math.max(0.04, hsl.l + direction * step * 0.01))
      const next = hslToHex(hsl.h, hsl.s, nextL)
      const ratio = contrastRatio(next, bg)
      if (ratio !== null && ratio >= target) {
        const dist = Math.abs(nextL - hsl.l)
        if (!best || dist < best.dist) best = { hex: next, dist }
        break
      }
    }
  }
  return best?.hex ?? null
}

export function colourFormats(hex: string) {
  const parsed = parseHex(hex)
  if (!parsed) return null
  const rgb = hexToRgb(parsed)
  const hsl = hexToHsl(parsed)
  if (!rgb || !hsl) return null
  return {
    hex: parsed,
    rgb,
    hsl,
    rgbCss: formatRgb(parsed) ?? "",
    hslCss: formatHsl(parsed) ?? "",
    rgbList: formatRgbList(parsed) ?? "",
  }
}

export function parseQuery(search: string) {
  const value = search.startsWith("?") ? search.slice(1) : search
  return new URLSearchParams(value)
}
