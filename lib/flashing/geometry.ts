// Profile coordinates are millimetres with y pointing down (screen convention).
export type Point = { x: number; y: number }

export const MAX_GIRTH_MM = 1200
export const GIRTH_WARNING_MM = 1080
export const SNAP_MM = 5

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function segmentLengths(points: Point[]): number[] {
  const lengths: number[] = []
  for (let i = 0; i < points.length - 1; i++) {
    lengths.push(distance(points[i], points[i + 1]))
  }
  return lengths
}

export function girth(points: Point[]): number {
  return segmentLengths(points).reduce((sum, length) => sum + length, 0)
}

export function foldCount(points: Point[]): number {
  return Math.max(0, points.length - 2)
}

export function snapValue(value: number, step = SNAP_MM): number {
  return Math.round(value / step) * step
}

export function snapPoint(point: Point, enabled: boolean): Point {
  if (!enabled) return { x: Math.round(point.x), y: Math.round(point.y) }
  return { x: snapValue(point.x), y: snapValue(point.y) }
}

export function unit(a: Point, b: Point): Point {
  const length = distance(a, b)
  if (length < 1e-9) return { x: 1, y: 0 }
  return { x: (b.x - a.x) / length, y: (b.y - a.y) / length }
}

export function normalOf(a: Point, b: Point): Point {
  const d = unit(a, b)
  return { x: d.y, y: -d.x }
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function normalizeDeg(deg: number): number {
  let value = deg % 360
  if (value <= -180) value += 360
  if (value > 180) value -= 360
  return value
}

// Direction of a segment from horizontal, counter-clockwise as seen on screen.
export function directionDeg(a: Point, b: Point): number {
  return normalizeDeg((Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI)
}

// Screen-space turn (radians) from segment i-1 into segment i, at vertex i.
export function signedTurnAt(points: Point[], i: number): number {
  const a = unit(points[i - 1], points[i])
  const b = unit(points[i], points[i + 1])
  return Math.atan2(a.x * b.y - a.y * b.x, a.x * b.x + a.y * b.y)
}

// Interior fold angle at vertex i: 180 means straight, 90 a right-angle fold.
export function foldAngleAt(points: Point[], i: number): number {
  return 180 - (Math.abs(signedTurnAt(points, i)) * 180) / Math.PI
}

function rotateAround(point: Point, center: Point, radians: number): Point {
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const dx = point.x - center.x
  const dy = point.y - center.y
  return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos }
}

// Angle shown for a segment: direction from horizontal for the first segment,
// interior fold angle for every other segment.
export function segmentAngle(points: Point[], i: number): number {
  if (i === 0) return directionDeg(points[0], points[1])
  return foldAngleAt(points, i)
}

export function withSegmentLength(points: Point[], i: number, lengthMm: number): Point[] {
  const d = unit(points[i], points[i + 1])
  const current = distance(points[i], points[i + 1])
  const delta = Math.max(0, lengthMm) - current
  return points.map((point, index) =>
    index > i ? { x: point.x + d.x * delta, y: point.y + d.y * delta } : point
  )
}

export function withSegmentAngle(points: Point[], i: number, angleDeg: number): Point[] {
  if (i === 0) {
    const delta = angleDeg - directionDeg(points[0], points[1])
    const radians = (-delta * Math.PI) / 180
    return points.map((point, index) =>
      index > 0 ? rotateAround(point, points[0], radians) : point
    )
  }

  const turn = signedTurnAt(points, i)
  const sign = turn < 0 ? -1 : 1
  const clamped = Math.min(180, Math.max(0, angleDeg))
  const nextTurn = sign * ((180 - clamped) * Math.PI) / 180
  const radians = nextTurn - turn
  return points.map((point, index) =>
    index > i ? rotateAround(point, points[i], radians) : point
  )
}

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number }

export function boundsOf(points: Point[]): Bounds | null {
  if (points.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const point of points) {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  }
  return { minX, minY, maxX, maxY }
}

export function centroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 }
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
  return { x: sum.x / points.length, y: sum.y / points.length }
}

export function offsetPolyline(points: Point[], d: number): Point[] {
  return points.map((point, i) => {
    const prev = i > 0 ? normalOf(points[i - 1], point) : null
    const next = i < points.length - 1 ? normalOf(point, points[i + 1]) : null
    if (!prev && !next) return point
    if (!prev || !next) {
      const n = (prev ?? next) as Point
      return { x: point.x + n.x * d, y: point.y + n.y * d }
    }
    const mx = prev.x + next.x
    const my = prev.y + next.y
    const length = Math.hypot(mx, my)
    if (length < 1e-6) return { x: point.x + next.x * d, y: point.y + next.y * d }
    const m = { x: mx / length, y: my / length }
    const scale = d / Math.max(m.x * next.x + m.y * next.y, 0.35)
    return { x: point.x + m.x * scale, y: point.y + m.y * scale }
  })
}

// Sign to apply to normalOf() so the offset lands on the weather ("out") face,
// taken as the face that points upward on average.
export function outwardSign(points: Point[]): 1 | -1 {
  let upward = 0
  let sideways = 0
  for (let i = 0; i < points.length - 1; i++) {
    const n = normalOf(points[i], points[i + 1])
    const length = distance(points[i], points[i + 1])
    upward += -n.y * length
    sideways += n.x * length
  }
  if (Math.abs(upward) > 1e-6) return upward > 0 ? 1 : -1
  return sideways >= 0 ? 1 : -1
}

export function taperedPoints(
  points: Point[],
  taperLengths: (number | null)[],
  anchor: number
): Point[] {
  if (points.length < 2) return points
  const tapered: Point[] = [{ x: 0, y: 0 }]
  for (let i = 0; i < points.length - 1; i++) {
    const d = unit(points[i], points[i + 1])
    const length = taperLengths[i] ?? distance(points[i], points[i + 1])
    const last = tapered[i]
    tapered.push({ x: last.x + d.x * length, y: last.y + d.y * length })
  }
  const a = Math.min(Math.max(anchor, 0), points.length - 1)
  const dx = points[a].x - tapered[a].x
  const dy = points[a].y - tapered[a].y
  return tapered.map((point) => ({ x: point.x + dx, y: point.y + dy }))
}

export function taperedGirth(points: Point[], taperLengths: (number | null)[]): number {
  return segmentLengths(points).reduce(
    (sum, length, i) => sum + (taperLengths[i] ?? length),
    0
  )
}

// The square edge stays put while the rest tapers away from it. Prefer an end
// whose segment is unchanged; that matches how most tapered flashings are cut.
export function inferAnchor(points: Point[], taperLengths: (number | null)[]): number {
  const count = points.length - 1
  if (count < 1) return 0
  const changed = (i: number) => {
    const value = taperLengths[i]
    return value != null && Math.abs(value - distance(points[i], points[i + 1])) > 0.5
  }
  if (!changed(0)) return 0
  if (!changed(count - 1)) return points.length - 1
  return 0
}

export function formatMm(value: number): string {
  return `${Math.round(value)}`
}
