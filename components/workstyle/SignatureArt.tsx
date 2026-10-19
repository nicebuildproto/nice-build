"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { dimensions } from "@/lib/workstyle/dimensions"
import {
  blendSignatureInput,
  buildSignature,
  emptySignatureInput,
  type SignatureInput,
} from "@/lib/workstyle/signature"
import type { DimensionId } from "@/lib/workstyle/types"
import { usePrefersReducedMotion } from "./store"

type Props = {
  input: SignatureInput
  links?: [DimensionId, DimensionId][]
  /** "ink" draws on a dark surface using the lifted colour variants. */
  tone?: "paper" | "ink"
  labels?: boolean
  /** Start empty and grow into place on mount. */
  intro?: boolean
  /** Milliseconds for each change. */
  duration?: number
  label: string
  className?: string
  decorative?: boolean
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3)

export function SignatureArt({ input, links = [], tone = "paper", labels = false, intro = false, duration = 900, label, className, decorative = false }: Props) {
  const reduced = usePrefersReducedMotion()
  const [tweened, setTweened] = useState<SignatureInput>(() => (intro ? emptySignatureInput() : input))
  const tweenedRef = useRef(tweened)
  useEffect(() => {
    tweenedRef.current = tweened
  })
  const still = reduced || duration <= 0
  // With reduced motion (or no duration) the drawing simply follows the data; otherwise it glides there.
  const shown = still ? input : tweened

  useEffect(() => {
    if (still) return
    const from = tweenedRef.current
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setTweened(t >= 1 ? input : blendSignatureInput(from, input, ease(t)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [input, still, duration])

  const signature = useMemo(() => buildSignature(shown, links), [shown, links])
  const extent = labels ? 150 : 114
  const dark = tone === "ink"
  const hue = (id: DimensionId) => (dark ? dimensions[id].colourOnDark : dimensions[id].colour)

  return (
    <svg
      className={className}
      viewBox={`${-extent} ${-extent} ${extent * 2} ${extent * 2}`}
      width="100%"
      height="100%"
      fill="none"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
      style={{ display: "block", color: "var(--ink)", overflow: "visible" }}
    >
      {signature.rings.map((radius) => (
        <circle key={radius} r={radius} stroke="currentColor" strokeOpacity="0.16" strokeWidth="0.6" />
      ))}
      {signature.spokes.map((spoke, index) => (
        <line key={index} x1={spoke.x1} y1={spoke.y1} x2={spoke.x2} y2={spoke.y2} stroke="currentColor" strokeOpacity="0.16" strokeWidth="0.6" />
      ))}
      {signature.curve ? <path d={signature.curve} fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /> : null}
      {signature.links.map((link) => (
        <path key={`${link.a}-${link.b}`} d={link.d} stroke="currentColor" strokeWidth="0.9" strokeDasharray="2 3" opacity="0.7" />
      ))}
      {signature.nodes.map((node) => {
        const colour = hue(node.id)
        if (!node.available) {
          return <circle key={node.id} cx={node.x} cy={node.y} r="4" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="1.5 1.5" />
        }
        return (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={node.halo} stroke={colour} strokeWidth="0.9" strokeDasharray={node.haloDashed ? "2 2.5" : undefined} opacity="0.75" />
            {node.satellites.map((satellite, index) => (
              <circle key={index} cx={satellite.x} cy={satellite.y} r={satellite.r} fill={colour} opacity="0.7" />
            ))}
            <path d={node.path} fill={colour} />
            {labels ? (
              <text x={node.label.x} y={node.label.y} textAnchor={node.label.anchor} dominantBaseline="middle" fontSize="8" fill="currentColor" style={{ fontFamily: "var(--body)" }}>
                {dimensions[node.id].short}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
