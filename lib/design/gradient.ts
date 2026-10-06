import { parseHex, randomHex } from "./colour"

export type GradientKind = "linear" | "radial"

export type GradientStop = {
  id: string
  colour: string
  position: number
}

export const gradientPresets: {
  id: string
  label: string
  kind: GradientKind
  angle: number
  stops: { colour: string; position: number }[]
}[] = [
  {
    id: "sunset",
    label: "Sunset",
    kind: "linear",
    angle: 120,
    stops: [
      { colour: "#ffb347", position: 0 },
      { colour: "#ff6a3d", position: 52 },
      { colour: "#c43b6f", position: 100 },
    ],
  },
  {
    id: "ocean",
    label: "Ocean",
    kind: "linear",
    angle: 160,
    stops: [
      { colour: "#0b3d5c", position: 0 },
      { colour: "#1c6ea4", position: 48 },
      { colour: "#7ec8e3", position: 100 },
    ],
  },
  {
    id: "forest",
    label: "Forest",
    kind: "linear",
    angle: 135,
    stops: [
      { colour: "#0e3a34", position: 0 },
      { colour: "#1f6f5b", position: 100 },
    ],
  },
  {
    id: "midnight",
    label: "Midnight",
    kind: "radial",
    angle: 0,
    stops: [
      { colour: "#3d4a7a", position: 0 },
      { colour: "#111111", position: 100 },
    ],
  },
  {
    id: "peach",
    label: "Peach",
    kind: "linear",
    angle: 90,
    stops: [
      { colour: "#fff1e0", position: 0 },
      { colour: "#f4b393", position: 100 },
    ],
  },
]

export const defaultGradientStops: GradientStop[] = [
  { id: "a", colour: "#111111", position: 0 },
  { id: "b", colour: "#ff0101", position: 100 },
]

export function clampStopPosition(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function gradientCss(kind: GradientKind, angle: number, stops: GradientStop[]) {
  const parts = stops
    .map((stop) => {
      const hex = parseHex(stop.colour)
      if (!hex) return null
      return `${hex} ${clampStopPosition(stop.position)}%`
    })
    .filter((part): part is string => Boolean(part))
  if (parts.length < 2) return ""
  if (kind === "radial") return `radial-gradient(circle at center, ${parts.join(", ")})`
  const deg = Number.isFinite(angle) ? Math.round(angle) : 0
  return `linear-gradient(${deg}deg, ${parts.join(", ")})`
}

export function gradientDeclaration(css: string) {
  return css ? `background: ${css};` : ""
}

export function reverseStops(stops: GradientStop[]): GradientStop[] {
  const reversed = [...stops].reverse()
  return reversed.map((stop, index) => ({
    id: stops[index]?.id ?? stop.id,
    colour: stop.colour,
    position: 100 - clampStopPosition(stop.position),
  }))
}

export function randomGradient(random: () => number = Math.random): {
  kind: GradientKind
  angle: number
  stops: GradientStop[]
} {
  const three = random() > 0.55
  const stops: GradientStop[] = [
    { id: "a", colour: randomHex(random), position: 0 },
    { id: "b", colour: randomHex(random), position: three ? 50 : 100 },
  ]
  if (three) stops.push({ id: "c", colour: randomHex(random), position: 100 })
  return {
    kind: random() > 0.75 ? "radial" : "linear",
    angle: Math.round(random() * 360),
    stops,
  }
}

export function stopsFromPreset(id: string): { kind: GradientKind; angle: number; stops: GradientStop[] } | null {
  const preset = gradientPresets.find((item) => item.id === id)
  if (!preset) return null
  return {
    kind: preset.kind,
    angle: preset.angle,
    stops: preset.stops.map((stop, index) => ({
      id: ["a", "b", "c"][index] ?? `s${index}`,
      colour: stop.colour,
      position: stop.position,
    })),
  }
}
