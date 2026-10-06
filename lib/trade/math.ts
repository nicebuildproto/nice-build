export type LengthUnit = "mm" | "cm" | "m" | "in" | "ft"
export type AreaUnit = "m2" | "ft2"
export type DepthUnit = "mm" | "cm" | "m" | "in"

export const LENGTH_UNITS: { id: LengthUnit; label: string }[] = [
  { id: "m", label: "m" },
  { id: "mm", label: "mm" },
  { id: "cm", label: "cm" },
  { id: "ft", label: "ft" },
  { id: "in", label: "in" },
]

export const DEPTH_UNITS: { id: DepthUnit; label: string }[] = [
  { id: "mm", label: "mm" },
  { id: "cm", label: "cm" },
  { id: "m", label: "m" },
  { id: "in", label: "in" },
]

export const AREA_UNITS: { id: AreaUnit; label: string }[] = [
  { id: "m2", label: "m²" },
  { id: "ft2", label: "ft²" },
]

const METRE: Record<LengthUnit | DepthUnit, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  in: 0.0254,
  ft: 0.3048,
}

const SQ_METRE: Record<AreaUnit, number> = {
  m2: 1,
  ft2: 0.09290304,
}

export function roundTrade(value: number, digits: number) {
  if (!Number.isFinite(value)) return value
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function roundUp(value: number, step: number) {
  if (!Number.isFinite(value) || step <= 0) return value
  return roundTrade(Math.ceil(value / step - 1e-12) * step, 10)
}

export function parseNumber(input: string) {
  const trimmed = input.trim().replace(/,/g, "")
  if (!trimmed) return null
  const amount = Number(trimmed)
  return Number.isFinite(amount) ? amount : null
}

const LENGTH_SUFFIX: Record<string, LengthUnit> = {
  mm: "mm",
  centimetre: "cm",
  centimetres: "cm",
  cm: "cm",
  metre: "m",
  metres: "m",
  meter: "m",
  meters: "m",
  m: "m",
  inch: "in",
  inches: "in",
  in: "in",
  '"': "in",
  foot: "ft",
  feet: "ft",
  ft: "ft",
  "'": "ft",
}

export function parseLength(input: string, unit: LengthUnit | DepthUnit): number | null {
  const trimmed = input.trim().replace(/,/g, "")
  if (!trimmed) return null
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*([a-zA-Z'"]+)?$/)
  if (!match) return null
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return null
  const suffix = match[2]?.toLowerCase()
  const resolved = suffix ? LENGTH_SUFFIX[suffix] : unit
  if (!resolved) return null
  return amount * METRE[resolved]
}

export function parseArea(input: string, unit: AreaUnit): number | null {
  const trimmed = input.trim().replace(/,/g, "")
  if (!trimmed) return null
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*(m2|m²|sqm|ft2|ft²|sqft)?$/i)
  if (!match) return null
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return null
  const suffix = match[2]?.toLowerCase()
  const resolved: AreaUnit = suffix ? (suffix.includes("ft") ? "ft2" : "m2") : unit
  return amount * SQ_METRE[resolved]
}

export function metresFrom(amount: number, unit: LengthUnit | DepthUnit) {
  return amount * METRE[unit]
}

export function withWaste(base: number, wastePercent: number) {
  const waste = base * (wastePercent / 100)
  return { base, waste, total: base + waste, wastePercent }
}

export const DEFAULT_DOOR_M2 = 1.8
export const DEFAULT_WINDOW_M2 = 1.2
export const PAINT_TIN_SIZES = [15, 10, 4, 2, 1]

export type PaintRequest = {
  lengthM: number
  widthM: number
  heightM: number
  coats: number
  coverage: number
  includeCeiling: boolean
  doors: number
  doorAreaM2: number
  windows: number
  windowAreaM2: number
  extraOpeningsM2: number
  wastePercent: number
}

export type TinPack = { size: number; count: number }

export function paintEstimate(input: PaintRequest) {
  const wallArea = 2 * (input.lengthM + input.widthM) * input.heightM
  const openings =
    input.doors * input.doorAreaM2 + input.windows * input.windowAreaM2 + input.extraOpeningsM2
  const walls = Math.max(0, wallArea - openings)
  const ceiling = input.includeCeiling ? input.lengthM * input.widthM : 0
  const floorArea = input.lengthM * input.widthM
  const area = walls + ceiling
  const coats = input.coats
  const litres = withWaste((area * coats) / input.coverage, input.wastePercent)
  return {
    floorArea,
    wallArea,
    openings,
    walls,
    ceiling,
    area,
    ...litres,
    tins: packPaintTins(litres.total),
    openingsExceedWalls: openings > wallArea && wallArea > 0,
  }
}

export function packPaintTins(litres: number): { purchased: number; tins: TinPack[] } {
  if (!Number.isFinite(litres) || litres <= 0) return { purchased: 0, tins: [] }
  if (litres > 45) {
    const count = Math.ceil(litres / 15)
    return { purchased: count * 15, tins: [{ size: 15, count }] }
  }
  const maxWaste = Math.max(3, litres * 0.2)
  const maxTins = Math.min(20, Math.ceil(litres) + 6)
  type Candidate = { purchased: number; tins: number; counts: number[] }
  const candidates: Candidate[] = []

  function consider(counts: number[]) {
    const purchased = PAINT_TIN_SIZES.reduce((sum, size, index) => sum + size * counts[index], 0)
    const tins = counts.reduce((sum, count) => sum + count, 0)
    if (purchased + 1e-9 < litres) return
    candidates.push({ purchased, tins, counts: counts.slice() })
  }

  function walk(index: number, remainingTins: number, counts: number[]) {
    if (index === PAINT_TIN_SIZES.length) {
      consider(counts)
      return
    }
    const maxCount = index === PAINT_TIN_SIZES.length - 1 ? remainingTins : Math.floor(remainingTins)
    for (let count = 0; count <= maxCount; count++) {
      counts[index] = count
      walk(index + 1, remainingTins - count, counts)
    }
    counts[index] = 0
  }

  const cap = Math.max(1, Math.ceil((litres + maxWaste) / PAINT_TIN_SIZES[PAINT_TIN_SIZES.length - 1]))
  walk(0, Math.min(maxTins, cap), Array(PAINT_TIN_SIZES.length).fill(0))

  let chosen: Candidate | null = null
  for (const candidate of candidates) {
    if (!chosen) {
      chosen = candidate
      continue
    }
    const bestOver = chosen.purchased - litres
    const over = candidate.purchased - litres
    const bestOk = bestOver <= maxWaste + 1e-9
    const ok = over <= maxWaste + 1e-9
    if (ok !== bestOk) {
      if (ok) chosen = candidate
      continue
    }
    if (candidate.tins < chosen.tins || (candidate.tins === chosen.tins && candidate.purchased < chosen.purchased)) {
      chosen = candidate
    }
  }

  if (!chosen) return { purchased: Math.ceil(litres), tins: [{ size: 1, count: Math.ceil(litres) }] }
  const tins = PAINT_TIN_SIZES.map((size, index) => ({ size, count: chosen.counts[index] })).filter((item) => item.count > 0)
  return { purchased: chosen.purchased, tins }
}

export function describeTins(pack: { purchased: number; tins: TinPack[] }) {
  if (pack.tins.length === 0) return "0 L"
  return pack.tins.map((item) => `${item.count} × ${item.size} L`).join(" + ")
}

export function plasterSheets(lengthM: number, heightM: number, wastePercent: number, sheetM2 = 2.4 * 1.2) {
  const area = lengthM * heightM
  const needed = withWaste(area, wastePercent)
  return { area, ...needed, sheets: Math.ceil(needed.total / sheetM2), sheetM2 }
}

export function studCount(lengthM: number, spacingMm: number, extra = 0) {
  const spacingM = spacingMm / 1000
  if (spacingM <= 0) return null
  return Math.ceil(lengthM / spacingM) + 1 + extra
}

export function flooringPacks(lengthM: number, widthM: number, packM2: number, wastePercent: number) {
  const area = lengthM * widthM
  const needed = withWaste(area, wastePercent)
  return { area, ...needed, packs: Math.ceil(needed.total / packM2) }
}

export function coveringCount(areaM2: number, pieceM2: number, wastePercent: number) {
  const needed = withWaste(areaM2, wastePercent)
  return { area: areaM2, ...needed, count: Math.ceil(needed.total / pieceM2) }
}

export function slabVolume(lengthM: number, widthM: number, depthM: number, wastePercent: number) {
  const volume = roundTrade(lengthM * widthM * depthM, 6)
  return { volume, ...withWaste(volume, wastePercent), area: lengthM * widthM, depthM }
}

export const PREMIX_20KG_M3 = 0.01

export function concreteBags(volumeM3: number, bagM3 = PREMIX_20KG_M3) {
  return Math.ceil(volumeM3 / bagM3)
}

export function gravelMass(volumeM3: number, tonnesPerM3 = 1.5) {
  return volumeM3 * tonnesPerM3
}

export function litreBags(volumeM3: number, bagLitres: number) {
  return Math.ceil((volumeM3 * 1000) / bagLitres)
}

export function fenceParts(lengthM: number, spacingM: number, railRows: number) {
  const posts = Math.ceil(lengthM / spacingM) + 1
  const bays = posts - 1
  return { posts, bays, rails: bays * railRows }
}

export function deckBoards(lengthM: number, widthM: number, boardMm: number, gapMm: number, wastePercent: number) {
  const pitch = boardMm + gapMm
  const across = Math.ceil((widthM * 1000) / pitch)
  const needed = withWaste(across, wastePercent)
  return {
    across,
    boards: Math.ceil(needed.total),
    eachM: lengthM,
    linearM: Math.ceil(needed.total) * lengthM,
    ...needed,
  }
}

export function roofArea(planM2: number, rise: number, run: number) {
  const factor = Math.hypot(rise, run) / run
  return { factor, area: planM2 * factor, angle: (Math.atan(rise / run) * 180) / Math.PI }
}

export function pitchFrom(rise: number, run: number) {
  return {
    angle: (Math.atan(rise / run) * 180) / Math.PI,
    rafter: Math.hypot(rise, run),
    factor: Math.hypot(rise, run) / run,
  }
}

export function gutterParts(lengthM: number, metresPerDownpipe = 8) {
  return {
    lengthM,
    downpipes: Math.max(1, Math.ceil(lengthM / metresPerDownpipe)),
  }
}

export function hvacLoad(areaM2: number, btuPerM2 = 430) {
  const btu = areaM2 * btuPerM2
  return {
    btu,
    kw: btu / 3412,
    lowBtu: btu * 0.85,
    highBtu: btu * 1.15,
    lowKw: (btu * 0.85) / 3412,
    highKw: (btu * 1.15) / 3412,
  }
}

export function boardFeet(thicknessMm: number, widthMm: number, lengthM: number, count: number) {
  const each = ((thicknessMm / 25.4) * (widthMm / 25.4) * (lengthM * 3.28084)) / 12
  const total = each * count
  const m3 = ((thicknessMm / 1000) * (widthMm / 1000) * lengthM) * count
  return { each, total, m3 }
}

export function stairStringer(totalRiseMm: number, targetRiserMm: number, goingMm: number) {
  const risers = Math.max(1, Math.round(totalRiseMm / targetRiserMm))
  const riserMm = totalRiseMm / risers
  const treads = Math.max(0, risers - 1)
  const totalGoingMm = treads * goingMm
  const stringerM = (risers * Math.hypot(riserMm, goingMm)) / 1000
  const twoRPlusG = 2 * riserMm + goingMm
  return { risers, treads, riserMm, goingMm, totalGoingMm, stringerM, twoRPlusG }
}

export function estimateLines(source: string) {
  const rows: { name: string; amount: number }[] = []
  const issues: string[] = []
  for (const raw of source.split("\n")) {
    const line = raw.trim()
    if (!line) continue
    const match = line.match(/^(.+?)[,:\s]+(-?\d+(?:\.\d+)?)$/)
    if (!match) {
      issues.push(`Could not read “${line}”. Use a name, then an amount — for example Framing, 2400.`)
      continue
    }
    rows.push({ name: match[1].trim(), amount: Number(match[2]) })
  }
  const cost = rows.reduce((sum, row) => sum + row.amount, 0)
  return { rows, cost, issues }
}

export function estimatePrice(cost: number, markupPercent: number) {
  const markup = cost * (markupPercent / 100)
  return { cost, markup, price: cost + markup, markupPercent }
}

export function positive(value: number | null, label: string) {
  if (value === null) return `Enter ${label}.`
  if (value < 0) return `Enter ${label} of 0 or more.`
  if (value === 0) return `Enter ${label} greater than 0.`
  if (value > 1e7) return `${label} is too large to estimate here.`
  return null
}

export function nonNegative(value: number | null, label: string) {
  if (value === null) return `Enter ${label}.`
  if (value < 0) return `Enter ${label} of 0 or more.`
  if (value > 1e7) return `${label} is too large to estimate here.`
  return null
}
