import { hexToRgb, parseHex } from "./colour"

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a))
  let y = Math.abs(Math.round(b))
  while (y) {
    const next = y
    y = x % y
    x = next
  }
  return x || 1
}

export type AspectInput = {
  width: string
  height: string
  ratioW: string
  ratioH: string
}

export type AspectResult = {
  width: number | null
  height: number | null
  ratioW: number
  ratioH: number
  label: string
}

function readNumber(value: string) {
  const trimmed = value.trim()
  if (trimmed === "") return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

export function solveAspect(input: AspectInput): AspectResult | null {
  const width = readNumber(input.width)
  const height = readNumber(input.height)
  const ratioW = readNumber(input.ratioW)
  const ratioH = readNumber(input.ratioH)

  if (width && height) {
    const divisor = gcd(width, height)
    const nextW = Math.round(width) / divisor
    const nextH = Math.round(height) / divisor
    return { width, height, ratioW: nextW, ratioH: nextH, label: `${nextW}:${nextH}` }
  }

  if (!ratioW || !ratioH) return null
  const divisor = gcd(ratioW, ratioH)
  const simpleW = ratioW / divisor
  const simpleH = ratioH / divisor
  if (width && !height) {
    const nextHeight = (width / simpleW) * simpleH
    return { width, height: nextHeight, ratioW: simpleW, ratioH: simpleH, label: `${simpleW}:${simpleH}` }
  }
  if (height && !width) {
    const nextWidth = (height / simpleH) * simpleW
    return { width: nextWidth, height, ratioW: simpleW, ratioH: simpleH, label: `${simpleW}:${simpleH}` }
  }
  return { width: null, height: null, ratioW: simpleW, ratioH: simpleH, label: `${simpleW}:${simpleH}` }
}

export const aspectPresets = [
  { id: "sixteen-nine", label: "16:9", ratioW: "16", ratioH: "9" },
  { id: "four-three", label: "4:3", ratioW: "4", ratioH: "3" },
  { id: "square", label: "1:1", ratioW: "1", ratioH: "1" },
  { id: "nine-sixteen", label: "9:16", ratioW: "9", ratioH: "16" },
  { id: "twenty-one-nine", label: "21:9", ratioW: "21", ratioH: "9" },
] as const

export function pxToRem(px: number, root: number) {
  if (!Number.isFinite(px) || !Number.isFinite(root) || root === 0) return null
  return px / root
}

export function formatRem(value: number) {
  const rounded = Math.round(value * 10000) / 10000
  return `${rounded}rem`
}

export const remScale = [8, 12, 14, 16, 18, 20, 24, 32]

export function boxShadowCss(
  x: number,
  y: number,
  blur: number,
  spread: number,
  colour: string,
  opacityPercent: number,
  inset = false,
) {
  const rgb = hexToRgb(colour)
  if (!rgb) return ""
  const alpha = Math.min(1, Math.max(0, opacityPercent / 100))
  const alphaText = Number.isInteger(alpha) ? String(alpha) : alpha.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
  const prefix = inset ? "inset " : ""
  return `${prefix}${x}px ${y}px ${blur}px ${spread}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alphaText})`
}

export function boxShadowDeclaration(css: string) {
  return css ? `box-shadow: ${css};` : ""
}

export function borderRadiusCss(tl: number, tr: number, br: number, bl: number) {
  if ([tl, tr, br, bl].every((value) => value === tl)) return `${tl}px`
  return `${tl}px ${tr}px ${br}px ${bl}px`
}

export function borderRadiusDeclaration(css: string) {
  return css ? `border-radius: ${css};` : ""
}

export const shadowPresets = [
  { id: "soft", label: "Soft", x: 0, y: 8, blur: 24, spread: 0, colour: "#111111", opacity: 12, inset: false },
  { id: "lift", label: "Lift", x: 0, y: 16, blur: 40, spread: -8, colour: "#111111", opacity: 18, inset: false },
  { id: "crisp", label: "Crisp", x: 0, y: 1, blur: 2, spread: 0, colour: "#111111", opacity: 22, inset: false },
  { id: "glow", label: "Glow", x: 0, y: 0, blur: 28, spread: 0, colour: "#1c6ea4", opacity: 35, inset: false },
  { id: "inset", label: "Inset", x: 0, y: 2, blur: 8, spread: 0, colour: "#111111", opacity: 16, inset: true },
] as const

export const radiusPresets = [
  { id: "sharp", label: "Sharp", value: 0 },
  { id: "sm", label: "8", value: 8 },
  { id: "md", label: "16", value: 16 },
  { id: "lg", label: "28", value: 28 },
  { id: "pill", label: "Pill", value: 999 },
] as const

export function validHexOrEmpty(value: string) {
  return parseHex(value)
}
