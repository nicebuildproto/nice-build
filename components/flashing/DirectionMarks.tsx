import { directionStrokes, type Point } from "@/lib/flashing/geometry"

export function DirectionMarks({
  points,
  length = 20,
  inset = 7,
  stroke = "currentColor",
  strokeWidth = 1.25,
}: {
  points: Point[]
  length?: number
  inset?: number
  stroke?: string
  strokeWidth?: number
}) {
  const ticks = directionStrokes(points, length, inset)
  if (ticks.length === 0) return null
  return (
    <g className="pointer-events-none text-[var(--nb-primary)]" aria-hidden>
      {ticks.map((tick, index) => (
        <line
          key={`dir-${index}`}
          x1={tick.a.x}
          y1={tick.a.y}
          x2={tick.b.x}
          y2={tick.b.y}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.45}
        />
      ))}
    </g>
  )
}
