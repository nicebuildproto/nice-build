import Link from "next/link"
import { brand, productPath } from "@/lib/workstyle/brand"
import { dimensionIds, dimensions } from "@/lib/workstyle/dimensions"
import { dimensionAngle, glyphPath, point } from "@/lib/workstyle/signature"
import type { DimensionId } from "@/lib/workstyle/types"

/** Eight marks on a ring — the product mark. It's a fixed emblem, not a result. */
export function Logomark({ className = "ws-logomark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="-12 -12 24 24" aria-hidden="true" focusable="false">
      <circle r="9" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.4" />
      {dimensionIds.map((id) => {
        const { x, y } = point(dimensionAngle(id), 9)
        return <path key={id} d={glyphPath(dimensions[id].glyph, x, y, 2.1)} fill={dimensions[id].colour} />
      })}
    </svg>
  )
}

export function Wordmark({ href = productPath() }: { href?: string }) {
  return (
    <Link href={href} className="ws-wordmark" aria-label={`${brand.name} home`}>
      <Logomark />
      <span aria-hidden="true">
        <b>{brand.wordmark.lead}</b>
        <i>{brand.wordmark.tail}</i>
      </span>
    </Link>
  )
}

/** A dimension's glyph in its colour. Shape carries the identity, so colour is never the only cue. */
export function Glyph({ id, size = 22 }: { id: DimensionId; size?: number }) {
  const spec = dimensions[id]
  return (
    <svg className="ws-glyph" width={size} height={size} viewBox="-10 -10 20 20" aria-hidden="true" focusable="false">
      <path d={glyphPath(spec.glyph, 0, 0, 6)} fill={spec.colour} />
    </svg>
  )
}
