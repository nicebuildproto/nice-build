import { dimensionIds, dimensions } from "./dimensions.ts"
import type { DimensionId, EvidenceLevel, GlyphKind } from "./types.ts"

// THE SIGNATURE — the product's visual motif. A constellation of eight marks, one per dimension,
// placed on eight spokes. Everything is derived from the profile data and nothing is random:
//
//   angle     fixed per dimension (clockwise from twelve o'clock)
//   distance  where the person sits between the "a" pole (near the centre) and "b" pole (out)
//   size      how clear the lean is (|position|)
//   halo      how much evidence there is (a tight halo = good evidence, a wide dashed one = thin)
//   scatter   small dots along each spoke show how consistent the answers were (spread)
//   curve     a closed line joins the marks; dashed arcs join dimensions that form a reported pattern
//
// The same function feeds the on-screen SVG, the share-card image and the PDF.

export type SignatureDimension = { position: number; spread: number; evidence: EvidenceLevel } | null
export type SignatureInput = Record<DimensionId, SignatureDimension>

export const SIGNATURE_RADIUS = 100
export const INNER = 0.3
export const OUTER = 0.92
const MID_RADIUS = SIGNATURE_RADIUS * 0.61

export type SignatureNode = {
  id: DimensionId
  available: boolean
  angle: number
  x: number
  y: number
  radius: number
  size: number
  glyph: GlyphKind
  /** SVG path for the glyph at (x, y). Filled with the dimension colour. */
  path: string
  halo: number
  haloDashed: boolean
  satellites: { x: number; y: number; r: number }[]
  label: { x: number; y: number; anchor: "start" | "middle" | "end" }
}

export type Signature = {
  rings: number[]
  spokes: { x1: number; y1: number; x2: number; y2: number }[]
  nodes: SignatureNode[]
  /** Closed smooth curve through the available nodes, or null with fewer than three. */
  curve: string | null
  links: { a: DimensionId; b: DimensionId; d: string }[]
}

const toRad = (degrees: number) => (degrees * Math.PI) / 180
const fixed = (value: number) => Number(value.toFixed(2))

export function dimensionAngle(id: DimensionId): number {
  return -90 + dimensionIds.indexOf(id) * 45
}

export function radiusFor(position: number): number {
  return SIGNATURE_RADIUS * (INNER + (OUTER - INNER) * ((position + 1) / 2))
}

export function point(angleDegrees: number, radius: number) {
  return { x: fixed(Math.cos(toRad(angleDegrees)) * radius), y: fixed(Math.sin(toRad(angleDegrees)) * radius) }
}

// ───────────────────────── Glyphs ─────────────────────────

function polygon(points: [number, number][]): string {
  return `M${points.map(([x, y]) => `${fixed(x)} ${fixed(y)}`).join("L")}Z`
}

function circlePath(cx: number, cy: number, r: number, clockwise: boolean): string {
  const sweep = clockwise ? 1 : 0
  return `M${fixed(cx - r)} ${fixed(cy)}a${fixed(r)} ${fixed(r)} 0 1 ${sweep} ${fixed(2 * r)} 0a${fixed(r)} ${fixed(r)} 0 1 ${sweep} ${fixed(-2 * r)} 0Z`
}

export function glyphPath(kind: GlyphKind, cx: number, cy: number, s: number): string {
  switch (kind) {
    case "circle":
      return circlePath(cx, cy, s, true)
    case "ring":
      // Opposite windings: a ring that stays a ring under the non-zero fill rule.
      return circlePath(cx, cy, s, true) + circlePath(cx, cy, s * 0.55, false)
    case "square":
      return polygon([[cx - s * 0.9, cy - s * 0.9], [cx + s * 0.9, cy - s * 0.9], [cx + s * 0.9, cy + s * 0.9], [cx - s * 0.9, cy + s * 0.9]])
    case "triangle":
      return polygon([[cx, cy - s * 1.15], [cx + s * 1.05, cy + s * 0.8], [cx - s * 1.05, cy + s * 0.8]])
    case "diamond":
      return polygon([[cx, cy - s * 1.25], [cx + s * 1.25, cy], [cx, cy + s * 1.25], [cx - s * 1.25, cy]])
    case "hexagon":
      return polygon(
        Array.from({ length: 6 }, (_, index) => {
          const angle = toRad(60 * index - 90)
          return [cx + Math.cos(angle) * s * 1.1, cy + Math.sin(angle) * s * 1.1] as [number, number]
        }),
      )
    case "plus": {
      const arm = s * 1.15
      const t = s * 0.4
      return polygon([
        [cx - t, cy - arm], [cx + t, cy - arm], [cx + t, cy - t], [cx + arm, cy - t], [cx + arm, cy + t], [cx + t, cy + t],
        [cx + t, cy + arm], [cx - t, cy + arm], [cx - t, cy + t], [cx - arm, cy + t], [cx - arm, cy - t], [cx - t, cy - t],
      ])
    }
    case "star":
      return polygon(
        Array.from({ length: 8 }, (_, index) => {
          const angle = toRad(45 * index - 90)
          const radius = index % 2 === 0 ? s * 1.35 : s * 0.5
          return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius] as [number, number]
        }),
      )
  }
}

// ───────────────────────── Curves ─────────────────────────

/** Closed Catmull-Rom spline through the points, as cubic Béziers. */
export function smoothClosedPath(points: { x: number; y: number }[], tension = 0.5): string | null {
  if (points.length < 3) return null
  const n = points.length
  const parts = [`M${fixed(points[0].x)} ${fixed(points[0].y)}`]
  for (let i = 0; i < n; i += 1) {
    const p0 = points[(i - 1 + n) % n]
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    const p3 = points[(i + 2) % n]
    const c1 = { x: p1.x + ((p2.x - p0.x) * tension) / 3, y: p1.y + ((p2.y - p0.y) * tension) / 3 }
    const c2 = { x: p2.x - ((p3.x - p1.x) * tension) / 3, y: p2.y - ((p3.y - p1.y) * tension) / 3 }
    parts.push(`C${fixed(c1.x)} ${fixed(c1.y)} ${fixed(c2.x)} ${fixed(c2.y)} ${fixed(p2.x)} ${fixed(p2.y)}`)
  }
  return `${parts.join("")}Z`
}

function arcLink(a: { x: number; y: number }, b: { x: number; y: number }): string {
  // A gentle curve bowed towards the centre so links read as relationships, not spokes.
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  return `M${fixed(a.x)} ${fixed(a.y)}Q${fixed(mx * 0.35)} ${fixed(my * 0.35)} ${fixed(b.x)} ${fixed(b.y)}`
}

// ───────────────────────── Geometry ─────────────────────────

const HALO: Record<EvidenceLevel, { radius: number; dashed: boolean; satellites: number }> = {
  none: { radius: 22, dashed: true, satellites: 0 },
  thin: { radius: 20, dashed: true, satellites: 2 },
  some: { radius: 13, dashed: false, satellites: 3 },
  good: { radius: 9, dashed: false, satellites: 5 },
}

/** Deterministic spread of satellite offsets in [-1, 1] (golden-ratio sequence). */
const offsets = (count: number) => Array.from({ length: count }, (_, k) => ((k * 0.6180339887 + 0.37) % 1) * 2 - 1)

export function buildSignature(input: SignatureInput, links: [DimensionId, DimensionId][] = []): Signature {
  const nodes: SignatureNode[] = dimensionIds.map((id) => {
    const angle = dimensionAngle(id)
    const entry = input[id]
    const spec = dimensions[id]
    const labelPoint = point(angle, SIGNATURE_RADIUS * 1.2)
    const cos = Math.cos(toRad(angle))
    const label = { ...labelPoint, anchor: (Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end") as "start" | "middle" | "end" }

    if (!entry || entry.evidence === "none") {
      const { x, y } = point(angle, MID_RADIUS)
      return {
        id, available: false, angle, x, y, radius: MID_RADIUS, size: 3.5, glyph: spec.glyph,
        path: circlePath(x, y, 3.5, true), halo: 0, haloDashed: true, satellites: [], label,
      }
    }

    const radius = radiusFor(entry.position)
    const { x, y } = point(angle, radius)
    const size = 5.5 + 5.5 * Math.min(1, Math.abs(entry.position))
    const halo = HALO[entry.evidence]
    const tangent = angle + 90
    const satellites = offsets(halo.satellites).map((offset, k) => {
      const along = radius + offset * entry.spread * 26
      const across = (k - (halo.satellites - 1) / 2) * 3.2
      const base = point(angle, Math.max(SIGNATURE_RADIUS * 0.18, Math.min(SIGNATURE_RADIUS * 1.0, along)))
      const shift = point(tangent, across)
      return { x: fixed(base.x + shift.x), y: fixed(base.y + shift.y), r: 1.5 }
    })
    return {
      id, available: true, angle, x, y, radius, size, glyph: spec.glyph,
      path: glyphPath(spec.glyph, x, y, size), halo: halo.radius + size * 0.4, haloDashed: halo.dashed, satellites, label,
    }
  })

  const present = nodes.filter((node) => node.available)
  const byId = new Map(nodes.map((node) => [node.id, node]))
  return {
    rings: [INNER, 0.61, OUTER].map((ratio) => fixed(SIGNATURE_RADIUS * ratio)),
    spokes: nodes.map((node) => {
      const inner = point(node.angle, SIGNATURE_RADIUS * 0.12)
      const outer = point(node.angle, SIGNATURE_RADIUS * OUTER)
      return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y }
    }),
    nodes,
    curve: smoothClosedPath(present.map((node) => ({ x: node.x, y: node.y }))),
    links: links.flatMap(([a, b]) => {
      const first = byId.get(a)
      const second = byId.get(b)
      return first?.available && second?.available ? [{ a, b, d: arcLink(first, second) }] : []
    }),
  }
}

// ───────────────────────── Animation helper ─────────────────────────

/** Linear blend between two inputs. Used to animate the live signature; evidence snaps at the halfway point. */
export function blendSignatureInput(from: SignatureInput, to: SignatureInput, t: number): SignatureInput {
  const result = {} as SignatureInput
  for (const id of dimensionIds) {
    const a = from[id]
    const b = to[id]
    if (!a && !b) result[id] = null
    else if (!a) result[id] = b && t > 0 ? { ...b, position: b.position * t } : null
    else if (!b) result[id] = t < 1 ? { ...a, position: a.position * (1 - t) } : null
    else {
      result[id] = {
        position: a.position * (1 - t) + b.position * t,
        spread: a.spread * (1 - t) + b.spread * t,
        evidence: t < 0.5 ? a.evidence : b.evidence,
      }
    }
  }
  return result
}

export function emptySignatureInput(): SignatureInput {
  return Object.fromEntries(dimensionIds.map((id) => [id, null])) as SignatureInput
}

// ───────────────────────── SVG string (cards, downloads, previews) ─────────────────────────

export type SignatureTheme = "light" | "dark"

const THEMES = {
  light: { ink: "#15130F", faint: "rgba(21,19,15,0.16)", fill: "rgba(21,19,15,0.05)", surface: "#F4EFE6" },
  dark: { ink: "#F4EFE6", faint: "rgba(244,239,230,0.22)", fill: "rgba(244,239,230,0.07)", surface: "#15130F" },
}

export function signatureSvg(
  signature: Signature,
  options: { theme?: SignatureTheme; size?: number; labels?: boolean; background?: boolean } = {},
): string {
  const theme = THEMES[options.theme ?? "light"]
  const dark = (options.theme ?? "light") === "dark"
  const extent = options.labels ? 150 : 114
  const size = options.size ?? 480
  const colour = (id: DimensionId) => (dark ? dimensions[id].colourOnDark : dimensions[id].colour)
  const out: string[] = []
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-extent} ${-extent} ${extent * 2} ${extent * 2}" fill="none">`,
  )
  if (options.background) out.push(`<rect x="${-extent}" y="${-extent}" width="${extent * 2}" height="${extent * 2}" fill="${theme.surface}"/>`)
  for (const radius of signature.rings) out.push(`<circle r="${radius}" stroke="${theme.faint}" stroke-width="0.6"/>`)
  for (const spoke of signature.spokes) {
    out.push(`<line x1="${spoke.x1}" y1="${spoke.y1}" x2="${spoke.x2}" y2="${spoke.y2}" stroke="${theme.faint}" stroke-width="0.6"/>`)
  }
  if (signature.curve) {
    out.push(`<path d="${signature.curve}" fill="${theme.fill}" stroke="${theme.ink}" stroke-width="1.4" stroke-linejoin="round"/>`)
  }
  for (const link of signature.links) {
    out.push(`<path d="${link.d}" stroke="${theme.ink}" stroke-width="0.9" stroke-dasharray="2 3" opacity="0.7"/>`)
  }
  for (const node of signature.nodes) {
    const hue = colour(node.id)
    if (!node.available) {
      out.push(`<circle cx="${node.x}" cy="${node.y}" r="4" stroke="${theme.faint}" stroke-width="1" stroke-dasharray="1.5 1.5"/>`)
      continue
    }
    out.push(
      `<circle cx="${node.x}" cy="${node.y}" r="${node.halo.toFixed(1)}" stroke="${hue}" stroke-width="0.9"${node.haloDashed ? ' stroke-dasharray="2 2.5"' : ""} opacity="0.75"/>`,
    )
    for (const satellite of node.satellites) out.push(`<circle cx="${satellite.x}" cy="${satellite.y}" r="${satellite.r}" fill="${hue}" opacity="0.7"/>`)
    out.push(`<path d="${node.path}" fill="${hue}"/>`)
    if (options.labels) {
      out.push(
        `<text x="${node.label.x}" y="${node.label.y}" text-anchor="${node.label.anchor}" dominant-baseline="middle" font-family="Helvetica, Arial, sans-serif" font-size="8" fill="${theme.ink}">${escapeXml(dimensions[node.id].short)}</text>`,
      )
    }
  }
  out.push("</svg>")
  return out.join("")
}

export function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
