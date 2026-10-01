import { boundsOf, offsetPolyline, outwardSign, type Point } from "@/lib/flashing/geometry"

export function fitTransform(
  points: Point[],
  box: { x: number; y: number; width: number; height: number },
  padding: number
): (point: Point) => Point {
  const bounds = boundsOf(points)
  if (!bounds) return (point) => point
  const w = Math.max(bounds.maxX - bounds.minX, 1)
  const h = Math.max(bounds.maxY - bounds.minY, 1)
  const scale = Math.min((box.width - padding * 2) / w, (box.height - padding * 2) / h)
  const ox = box.x + (box.width - w * scale) / 2 - bounds.minX * scale
  const oy = box.y + (box.height - h * scale) / 2 - bounds.minY * scale
  return (point) => ({ x: point.x * scale + ox, y: point.y * scale + oy })
}

export function toPath(points: Point[]): string {
  return points
    .map((point, i) => `${i === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ")
}

export function ProfileIcon({ points, className }: { points: Point[]; className?: string }) {
  const map = fitTransform(points, { x: 0, y: 0, width: 72, height: 44 }, 6)
  return (
    <svg viewBox="0 0 72 44" className={className} aria-hidden>
      <path
        d={toPath(points.map(map))}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ProfileSection({
  points,
  faceColour,
  backColour,
  colourSide,
  width = 320,
  height = 200,
  thickness = 6,
  className,
}: {
  points: Point[]
  faceColour: string | null
  backColour: string
  colourSide: "out" | "in"
  width?: number
  height?: number
  thickness?: number
  className?: string
}) {
  const map = fitTransform(points, { x: 0, y: 0, width, height }, thickness * 3 + 6)
  const mapped = points.map(map)
  const base = toPath(mapped)
  const sign = outwardSign(mapped) * (colourSide === "out" ? 1 : -1)
  const face = toPath(offsetPolyline(mapped, (sign * thickness) / 4))
  const transition = { transition: "stroke 220ms ease" }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <path
        d={base}
        fill="none"
        stroke="rgba(17,17,17,0.22)"
        strokeWidth={thickness + 1.5}
        strokeLinejoin="miter"
        strokeMiterlimit={3}
      />
      <path
        d={base}
        fill="none"
        stroke={backColour}
        strokeWidth={thickness}
        strokeLinejoin="miter"
        strokeMiterlimit={3}
        style={transition}
      />
      {faceColour ? (
        <path
          d={face}
          fill="none"
          stroke={faceColour}
          strokeWidth={thickness / 2}
          strokeLinejoin="miter"
          strokeMiterlimit={3}
          style={transition}
        />
      ) : null}
    </svg>
  )
}
