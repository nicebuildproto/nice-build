import type { Band, DimensionState, DimensionSummary, Intensity } from "./types.ts"

// READING A DIMENSION. Each dimension lands in one of four states:
//   lean-a / lean-b  answers agree on one side (mild or clear)
//   flexible         answers agree on the middle: comfortable either way
//   context          answers conflict, or several said “it depends”: the situation decides
//
// The thresholds are product choices, not statistical cut-offs (see methodology.md). They are written
// on the −2…+2 scale the question bank uses, then scaled to the −1…+1 scale positions are stored on.
// Item contributions run −2…+2, so position = mean ÷ 2 and spread = standard deviation ÷ 2.

const SCALE = 2
/** |mean| at or above this with low spread is a clear lean. */
export const CLEAR_LEAN = 0.8 / SCALE
/** |mean| at or above this (and below CLEAR_LEAN) is a mild lean. Below it, the answers sit in the middle. */
export const MILD_LEAN = 0.35 / SCALE
/** Middle answers are “flexible” only while the spread stays under this; above it they conflict instead. */
export const FLEXIBLE_SPREAD = 1.0 / SCALE
/** Spread at or above this means the answers conflict: “depends on context”. */
export const CONTEXT_SPREAD = 1.2 / SCALE
/** This many “it depends” answers on one dimension also read as “depends on context”. */
export const CONTEXT_SIGNALS = 2
/** A lean this weak is “mild”; this strong is “strong” (used only for wording). */
const STRONG_LEAN = 1.4 / SCALE
/** A lean with at least this much spread gets a “some answers went the other way” note. */
const EXCEPTIONS_SPREAD = 0.9 / SCALE

export type Reading = {
  band: Band
  /** "a" / "b" = leaning; "balanced" = flexible (answers agree on the middle); "mixed" = depends on context. */
  kind: "a" | "b" | "balanced" | "mixed"
  state: DimensionState
  intensity: Intensity
  strength: number
  /** Leaning, but some answers went the other way. */
  hasExceptions: boolean
}

type Measures = { position: number; spread: number; context?: number }

/** The four-way classification. Inputs are on the stored −1…+1 scale, rounded to 0.01 like a summary. */
export function classifyDimension({ position, spread, context = 0 }: Measures): DimensionState {
  const p = Math.round(position * 100) / 100
  const s = Math.round(spread * 100) / 100
  if (s >= CONTEXT_SPREAD || context >= CONTEXT_SIGNALS) return "context"
  if (Math.abs(p) < MILD_LEAN) return s < FLEXIBLE_SPREAD ? "flexible" : "context"
  return p < 0 ? "lean-a" : "lean-b"
}

export function readDimension(summary: DimensionSummary): Reading {
  const strength = Math.abs(summary.position)
  const state = classifyDimension({ position: summary.position, spread: summary.spread, context: summary.context })
  if (state === "context") return { band: "middle", kind: "mixed", state, intensity: "balanced", strength, hasExceptions: false }
  if (state === "flexible") return { band: "middle", kind: "balanced", state, intensity: "balanced", strength, hasExceptions: false }
  const intensity: Intensity = strength < CLEAR_LEAN ? "slight" : strength < STRONG_LEAN ? "moderate" : "strong"
  const side = state === "lean-a" ? "a" : "b"
  return { band: side, kind: side, state, intensity, strength, hasExceptions: summary.spread >= EXCEPTIONS_SPREAD }
}

/** Lean towards a side as a 0..1 value (0 when on the other side or in the middle). */
export function lean(summary: DimensionSummary | null, side: "a" | "b"): number {
  if (!summary) return 0
  const signed = side === "a" ? -summary.position : summary.position
  return Math.max(0, Math.min(1, signed))
}

/** Is the dimension clearly on a side, with at least some evidence? */
export function leansTo(summary: DimensionSummary | null, side: "a" | "b", minimum = 0.25): boolean {
  if (!summary || summary.evidence === "thin") return false
  return lean(summary, side) >= minimum
}
