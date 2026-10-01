import { foldCount, girth, taperedGirth, type Point } from "./geometry"

export type MaterialId = "colour" | "zincalume" | "galvanised"
export type ColourSide = "out" | "in"
export type Sheen = "standard" | "matt"

export interface Material {
  id: MaterialId
  label: string
  description: string
  code: string
  swatch: string
}

export interface Colour {
  id: string
  label: string
  hex: string
  code: string
  sheen: Sheen
}

export const materials: Material[] = [
  {
    id: "colour",
    label: "Pre-painted steel",
    description: "Colour-coated on one face.",
    code: "PP",
    swatch: "#5E6266",
  },
  {
    id: "zincalume",
    label: "Zincalume",
    description: "Bright aluminium-zinc coated.",
    code: "ZA",
    swatch: "#B9BFC5",
  },
  {
    id: "galvanised",
    label: "Galvanised",
    description: "Zinc coated, spangled finish.",
    code: "GV",
    swatch: "#A3A9AD",
  },
]

export const colours: Colour[] = [
  { id: "chalk", label: "Chalk", hex: "#E5E3D9", code: "CHK", sheen: "standard" },
  { id: "cream", label: "Cream", hex: "#E6DCBE", code: "CRM", sheen: "standard" },
  { id: "sandstone", label: "Sandstone", hex: "#CDC1A8", code: "SND", sheen: "standard" },
  { id: "dune", label: "Dune", hex: "#B0A898", code: "DUN", sheen: "standard" },
  { id: "stone", label: "Stone Grey", hex: "#8D8C85", code: "STN", sheen: "standard" },
  { id: "eucalypt", label: "Eucalypt", hex: "#6C7867", code: "EUC", sheen: "standard" },
  { id: "harbour", label: "Harbour", hex: "#566B78", code: "HBR", sheen: "standard" },
  { id: "slate", label: "Slate", hex: "#5E6266", code: "SLT", sheen: "standard" },
  { id: "rust", label: "Rust", hex: "#6B3A2D", code: "RST", sheen: "standard" },
  { id: "charcoal", label: "Charcoal", hex: "#3C3F43", code: "CHR", sheen: "standard" },
  { id: "charcoal-matt", label: "Charcoal Matt", hex: "#35373A", code: "CHM", sheen: "matt" },
  { id: "night", label: "Night", hex: "#1F2022", code: "NGT", sheen: "standard" },
]

export const bareMetal = "#C3C7CB"

export function materialById(id: MaterialId): Material {
  return materials.find((material) => material.id === id) ?? materials[0]
}

export function colourById(id: string | null): Colour | null {
  return colours.find((colour) => colour.id === id) ?? null
}

export interface ProfileInput {
  points: Point[]
  taper: { enabled: boolean; lengths: (number | null)[] }
}

export interface FinishInput {
  colourId: string | null
  side: ColourSide
}

export interface RateConfig {
  ratePerMmGirthPerMetre: number
  perFold: number
  taperSurcharge: number
  minimumPerPiece: number
  materialMultiplier: Record<MaterialId, number>
  sheenMultiplier: Record<Sheen, number>
  lengthMultiplier: { upToMm: number; multiplier: number }[]
}

export const defaultRateConfig: RateConfig = {
  ratePerMmGirthPerMetre: 0.045,
  perFold: 2.5,
  taperSurcharge: 18,
  minimumPerPiece: 25,
  materialMultiplier: { colour: 1.25, zincalume: 1, galvanised: 0.92 },
  sheenMultiplier: { standard: 1, matt: 1.06 },
  lengthMultiplier: [
    { upToMm: 1200, multiplier: 1.15 },
    { upToMm: 3600, multiplier: 1 },
    { upToMm: 6000, multiplier: 1.05 },
    { upToMm: Infinity, multiplier: 1.12 },
  ],
}

export interface PriceResult {
  perPiece: number
  total: number
  girthMm: number
  folds: number
}

export function calculatePrice(
  profile: ProfileInput,
  material: MaterialId,
  finish: FinishInput,
  quantity: number,
  lengthMm: number,
  rateConfig: RateConfig = defaultRateConfig
): PriceResult {
  const baseGirth = girth(profile.points)
  const girthMm = profile.taper.enabled
    ? Math.max(baseGirth, taperedGirth(profile.points, profile.taper.lengths))
    : baseGirth
  const folds = foldCount(profile.points)

  if (profile.points.length < 2 || lengthMm <= 0 || quantity <= 0) {
    return { perPiece: 0, total: 0, girthMm, folds }
  }

  const lengthM = lengthMm / 1000
  const lengthMultiplier =
    rateConfig.lengthMultiplier.find((tier) => lengthMm <= tier.upToMm)?.multiplier ?? 1
  const colour = material === "colour" ? colourById(finish.colourId) : null
  const sheenMultiplier = rateConfig.sheenMultiplier[colour?.sheen ?? "standard"]

  const metal =
    girthMm *
    rateConfig.ratePerMmGirthPerMetre *
    lengthM *
    rateConfig.materialMultiplier[material] *
    sheenMultiplier *
    lengthMultiplier
  const folding = folds * rateConfig.perFold
  const taper = profile.taper.enabled ? rateConfig.taperSurcharge : 0
  const perPiece = Math.max(rateConfig.minimumPerPiece, metal + folding + taper)

  return {
    perPiece: Math.round(perPiece * 100) / 100,
    total: Math.round(perPiece * quantity * 100) / 100,
    girthMm,
    folds,
  }
}

export function itemCode(input: {
  templateCode: string
  girthMm: number
  folds: number
  tapered: boolean
  material: MaterialId
  colourId: string | null
  side: ColourSide
}): string {
  const girthPart = String(Math.round(input.girthMm)).padStart(4, "0")
  const foldPart = `${input.folds}F${input.tapered ? "T" : ""}`
  const materialPart = materialById(input.material).code
  const colour = input.material === "colour" ? colourById(input.colourId) : null
  const finishPart = colour ? `-${colour.code}-${input.side === "out" ? "O" : "I"}` : ""
  return `NB-${input.templateCode}-${girthPart}-${foldPart}-${materialPart}${finishPart}`
}

const currency = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" })

export function formatPrice(value: number): string {
  return currency.format(value)
}
