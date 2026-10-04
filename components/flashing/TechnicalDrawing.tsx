import {
  centroid,
  distance,
  foldAngleAt,
  formatMm,
  midpoint,
  type Point,
} from "@/lib/flashing/geometry"
import { fitTransform, toPath } from "./ProfileShape"
import { outwardNormal } from "./TaperStep"

const W = 960
const H = 620
const FRAME = 16
const TITLE_H = 112
const INK = "#111111"
const MUTED = "#6B7280"

export interface DrawingInfo {
  itemCode: string
  profile: string
  material: string
  colour: string
  pieceLength: string
  quantity: string
  girth: string
  folds: string
}

export function TechnicalDrawing({
  points,
  taper,
  taperLengths,
  info,
}: {
  points: Point[]
  taper: Point[] | null
  taperLengths: (number | null)[]
  info: DrawingInfo
}) {
  const area = { x: FRAME, y: FRAME + 28, width: W - FRAME * 2, height: H - FRAME * 2 - TITLE_H - 28 }
  const map = fitTransform(taper ? [...points, ...taper] : points, area, 90)
  const base = points.map(map)
  const tapered = taper ? taper.map(map) : null
  const center = centroid(base)

  return (
    <svg
      data-flashing-drawing
      viewBox={`0 0 ${W} ${H}`}
      className="h-full max-h-full w-full"
      role="img"
      aria-label="Technical drawing of the flashing profile"
    >
      <rect x={FRAME} y={FRAME} width={W - FRAME * 2} height={H - FRAME * 2} fill="white" stroke={INK} strokeWidth={1} />
      <text x={FRAME + 14} y={FRAME + 22} fontSize={11} fill={MUTED} letterSpacing={1.2}>
        FLASHING PROFILE
      </text>
      <text x={W - FRAME - 14} y={FRAME + 22} fontSize={11} fill={MUTED} textAnchor="end">
        Dimensions in mm · Not to scale
      </text>

      {tapered ? (
        <path d={toPath(tapered)} fill="none" stroke={INK} strokeWidth={1.25} strokeDasharray="6 4" strokeLinejoin="round" />
      ) : null}
      <path d={toPath(base)} fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="miter" strokeLinecap="square" />

      {base.slice(0, -1).map((a, i) => {
        const b = base[i + 1]
        const n = outwardNormal(a, b, center)
        const gap = 6
        const offset = 30
        const a1 = { x: a.x + n.x * offset, y: a.y + n.y * offset }
        const b1 = { x: b.x + n.x * offset, y: b.y + n.y * offset }
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy) || 1
        const ux = dx / len
        const uy = dy / len
        const tick = (p: Point) =>
          `M${p.x - (ux + n.x) * 4} ${p.y - (uy + n.y) * 4} L${p.x + (ux + n.x) * 4} ${p.y + (uy + n.y) * 4}`
        const mid = midpoint(a1, b1)
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI
        if (angle > 90) angle -= 180
        if (angle < -90) angle += 180
        const baseLength = distance(points[i], points[i + 1])
        const taperLength = taperLengths[i]
        const label =
          taper && taperLength != null && Math.abs(taperLength - baseLength) > 0.5
            ? `${formatMm(baseLength)} → ${formatMm(taperLength)}`
            : formatMm(baseLength)
        const tx = mid.x + n.x * 11
        const ty = mid.y + n.y * 11
        return (
          <g key={`dim-${i}`} stroke={INK} strokeWidth={0.75} fill="none">
            <line x1={a.x + n.x * gap} y1={a.y + n.y * gap} x2={a.x + n.x * (offset + 5)} y2={a.y + n.y * (offset + 5)} />
            <line x1={b.x + n.x * gap} y1={b.y + n.y * gap} x2={b.x + n.x * (offset + 5)} y2={b.y + n.y * (offset + 5)} />
            <line x1={a1.x} y1={a1.y} x2={b1.x} y2={b1.y} />
            <path d={`${tick(a1)} ${tick(b1)}`} strokeWidth={1.25} />
            <text
              x={tx}
              y={ty}
              fontSize={12}
              fill={INK}
              stroke="none"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${angle} ${tx} ${ty})`}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {label}
            </text>
          </g>
        )
      })}

      {base.slice(1, -1).map((vertex, k) => {
        const i = k + 1
        const fold = foldAngleAt(points, i)
        if (fold > 179.5) return null
        const a = base[i - 1]
        const c = base[i + 1]
        const la = Math.hypot(a.x - vertex.x, a.y - vertex.y) || 1
        const lc = Math.hypot(c.x - vertex.x, c.y - vertex.y) || 1
        const ua = { x: (a.x - vertex.x) / la, y: (a.y - vertex.y) / la }
        const uc = { x: (c.x - vertex.x) / lc, y: (c.y - vertex.y) / lc }
        const r = 14
        const start = { x: vertex.x + ua.x * r, y: vertex.y + ua.y * r }
        const end = { x: vertex.x + uc.x * r, y: vertex.y + uc.y * r }
        const sweep = ua.x * uc.y - ua.y * uc.x > 0 ? 1 : 0
        let bx = ua.x + uc.x
        let by = ua.y + uc.y
        const bl = Math.hypot(bx, by)
        if (bl < 1e-6) {
          bx = -uc.y
          by = uc.x
        } else {
          bx /= bl
          by /= bl
        }
        return (
          <g key={`ang-${i}`}>
            <path d={`M${start.x} ${start.y} A ${r} ${r} 0 0 ${sweep} ${end.x} ${end.y}`} fill="none" stroke={MUTED} strokeWidth={0.75} />
            <text
              x={vertex.x + bx * 28}
              y={vertex.y + by * 28}
              fontSize={10.5}
              fill={MUTED}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {Math.round(fold)}°
            </text>
          </g>
        )
      })}

      {tapered ? (
        <g fontSize={10.5} fill={MUTED}>
          <line x1={FRAME + 14} y1={H - FRAME - TITLE_H - 16} x2={FRAME + 40} y2={H - FRAME - TITLE_H - 16} stroke={INK} strokeWidth={2} />
          <text x={FRAME + 46} y={H - FRAME - TITLE_H - 16} dominantBaseline="middle">Square end</text>
          <line x1={FRAME + 130} y1={H - FRAME - TITLE_H - 16} x2={FRAME + 156} y2={H - FRAME - TITLE_H - 16} stroke={INK} strokeWidth={1.25} strokeDasharray="6 4" />
          <text x={FRAME + 162} y={H - FRAME - TITLE_H - 16} dominantBaseline="middle">Tapered end</text>
        </g>
      ) : null}

      <TitleBlock info={info} />
    </svg>
  )
}

function TitleBlock({ info }: { info: DrawingInfo }) {
  const x = FRAME
  const y = H - FRAME - TITLE_H
  const width = W - FRAME * 2
  const colWidth = width / 4
  const rowHeight = TITLE_H / 2
  const cells: [string, string][] = [
    ["Item code", info.itemCode],
    ["Profile", info.profile],
    ["Material", info.material],
    ["Colour", info.colour],
    ["Piece length", info.pieceLength],
    ["Quantity", info.quantity],
    ["Profile girth", info.girth],
    ["Folds", info.folds],
  ]
  return (
    <g>
      <line x1={x} y1={y} x2={x + width} y2={y} stroke={INK} strokeWidth={1} />
      <line x1={x} y1={y + rowHeight} x2={x + width} y2={y + rowHeight} stroke={INK} strokeWidth={0.5} />
      {[1, 2, 3].map((c) => (
        <line key={c} x1={x + colWidth * c} y1={y} x2={x + colWidth * c} y2={y + TITLE_H} stroke={INK} strokeWidth={0.5} />
      ))}
      {cells.map(([label, value], index) => {
        const cx = x + (index % 4) * colWidth + 12
        const cy = y + Math.floor(index / 4) * rowHeight
        return (
          <g key={label}>
            <text x={cx} y={cy + 19} fontSize={9.5} fill={MUTED} letterSpacing={0.8}>
              {label.toUpperCase()}
            </text>
            <text
              x={cx}
              y={cy + 39}
              fontSize={13}
              fill={INK}
              fontWeight={index === 0 ? 600 : 400}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {value}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function downloadDrawing(filename = "flashing-drawing.svg") {
  const svg = document.querySelector<SVGSVGElement>("svg[data-flashing-drawing]")
  if (!svg) return
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: "image/svg+xml;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
