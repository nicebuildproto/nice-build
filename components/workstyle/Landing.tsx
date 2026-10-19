"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { brand, productPath } from "@/lib/workstyle/brand"
import { readResult } from "@/lib/workstyle/persistence"
import { questions } from "@/lib/workstyle/questions"
import type { SignatureInput } from "@/lib/workstyle/signature"
import { SignatureArt } from "./SignatureArt"
import { usePrefersReducedMotion, useWorkstyle } from "./store"

const entry = (position: number, spread = 0.2, evidence: "thin" | "some" | "good" = "good") => ({ position, spread, evidence })

// Four illustrative signatures, drawn by the same renderer as a real result. They are examples of
// the shape the picture can take — not results, and not types a person is assigned to.
const examples: SignatureInput[] = [
  { thinking: entry(-0.8), structure: entry(-0.6), decisions: entry(-0.35, 0.3), focus: entry(-0.9, 0.1), communication: entry(-0.5), collaboration: entry(0.15, 0.5, "some"), change: entry(-0.4), feedback: entry(-0.2, 0.4) },
  { thinking: entry(0.7), structure: entry(0.5, 0.3), decisions: entry(0.6), focus: entry(0.55), communication: entry(0.8), collaboration: entry(0.75), change: entry(0.65), feedback: entry(0.3, 0.4) },
  { thinking: entry(0.05, 0.8), structure: entry(-0.1, 0.7), decisions: entry(0.1, 0.75), focus: entry(0.0, 0.6), communication: entry(0.12, 0.7), collaboration: entry(-0.05, 0.6), change: entry(0.0, 0.8), feedback: entry(0.1, 0.7) },
  { thinking: entry(-0.5), structure: entry(0.7), decisions: entry(-0.7), focus: entry(0.6, 0.3), communication: entry(-0.4), collaboration: entry(-0.85), change: entry(0.3, 0.5), feedback: entry(-0.6) },
]

export function HeroSignature() {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (reduced) return
    const timer = setInterval(() => setIndex((current) => (current + 1) % examples.length), 5200)
    return () => clearInterval(timer)
  }, [reduced])
  return (
    <figure className="ws-hero-art">
      <SignatureArt input={examples[index]} intro={!reduced} duration={1400} label="An example signature: eight marks placed between two ways of working." />
      <figcaption>Example signatures. Yours is drawn from your own answers.</figcaption>
    </figure>
  )
}

export function StartButton() {
  const snapshot = useWorkstyle()
  const state = snapshot?.state
  const result = state ? readResult(state) : null
  const answered = state ? Object.keys(state.responses).filter((id) => questions.some((question) => question.id === id)).length : 0
  const className = "ws-btn ws-btn--primary"

  if (result) {
    return (
      <div className="ws-cta-row">
        <Link className={className} href={productPath("/result")}>
          See your result
        </Link>
        <Link className="ws-btn" href={productPath("/start")}>
          Retake
        </Link>
      </div>
    )
  }
  if (state && state.started && answered > 0) {
    return (
      <div className="ws-cta-row">
        <Link className={className} href={productPath("/start")}>
          Continue: {answered} of {questions.length} answered
        </Link>
      </div>
    )
  }
  return (
    <div className="ws-cta-row">
      <Link className={className} href={productPath("/start")}>
        Start: {brand.estimatedMinutesLabel}
      </Link>
      <span className="ws-muted ws-small">No account. No email.</span>
    </div>
  )
}
