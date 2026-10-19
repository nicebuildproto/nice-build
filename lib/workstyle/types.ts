// Shared types for the work-style assessment. Pure types only (no runtime code) so every
// layer — bank, scoring, narrative, sharing, UI — can depend on this file without cycles.

export type DimensionId =
  | "thinking"
  | "structure"
  | "decisions"
  | "focus"
  | "communication"
  | "collaboration"
  | "change"
  | "feedback"

export type ChapterId = "c1" | "c2" | "c3" | "c4"

/** Which end of a dimension an answer, band or statement points to. "a" is the negative pole. */
export type Side = "a" | "b"

export type GlyphKind = "circle" | "square" | "triangle" | "diamond" | "hexagon" | "plus" | "star" | "ring"

export type Pole = {
  /** Short label used in charts, e.g. "Reflect first". */
  label: string
  /** One plain-language line describing the pole. */
  line: string
}

export type DimensionSpec = {
  id: DimensionId
  title: string
  /** Very short name for tight spaces. */
  short: string
  /** The question this dimension answers, phrased for a person. */
  asks: string
  a: Pole
  b: Pole
  /** Label used when answers sit in the middle or pull both ways. */
  middle: string
  glyph: GlyphKind
  /** Colour on paper (light) backgrounds and a lifted variant for dark backgrounds. */
  colour: string
  colourOnDark: string
}

/** A chapter is a short story scene. Its questions come from several dimensions. */
export type ChapterSpec = {
  id: ChapterId
  number: number
  title: string
  /** One or two sentences shown on the chapter opener. */
  intro: string
}

/**
 * A signal on a dimension, from -2 (the "a" pole) to +2 (the "b" pole). A `context` effect adds nothing
 * to the score (its value is 0) but counts as a "depends on context" signal for that dimension.
 */
export type Effect = { dimension: DimensionId; value: number; context?: boolean }

export type Option = {
  id: string
  label: string
  effects: Effect[]
  /** Stays at the bottom of the list when options are shuffled. */
  last?: boolean
}

export type QuestionBase = {
  id: string
  chapter: ChapterId
  /** The dimension a core item measures. `null` for a cross-dimension item, which counts at half weight. */
  primary: DimensionId | null
  /** Marks items that get a special reading, e.g. the pressure item behind the pressure-shift follow-up. */
  tag?: "pressure"
  prompt: string
  /** One-line instruction under the prompt (multi, rank, split and scale items). */
  hint?: string
  /** Short accessible name for the answer group. */
  ariaLabel: string
}

export type ChoiceQuestion = QuestionBase & { format: "choice"; options: Option[] }
export type MultiQuestion = QuestionBase & {
  format: "multi"
  /** At most this many options can be picked. */
  max: number
  options: Option[]
}
export type RankQuestion = QuestionBase & { format: "rank"; options: Option[] }
export type SplitQuestion = QuestionBase & { format: "split"; total: number; unit: string; options: Option[] }
export type ScaleQuestion = QuestionBase & {
  format: "scale"
  /** The "a" pole statement (scores -2) and the "b" pole statement (scores +2). */
  left: string
  right: string
  /**
   * When true the two statements swap sides on screen, so a respondent cannot score high by always
   * sliding in one direction. The stored value is always canonical (-2 = `left`), never the screen position.
   */
  flip: boolean
}

export type Question = ChoiceQuestion | MultiQuestion | RankQuestion | SplitQuestion | ScaleQuestion
export type QuestionFormat = Question["format"]

export type Answer =
  | { format: "choice"; optionId: string }
  | { format: "multi"; optionIds: string[] }
  | { format: "rank"; order: string[] }
  | { format: "split"; shares: Record<string, number> }
  | { format: "scale"; value: number }
  | { format: "skip" }

export type FollowUpId = "structure-phase" | "focus-collab" | "decision-stakes" | "feedback-timing" | "pressure-shift"

export type FollowUpTrigger =
  /** Fires when any listed dimension is conflicted: its answers pulled hard in different directions. */
  | { kind: "conflict"; dimensions: DimensionId[] }
  /** Fires when the pressure item points a different way from the rest of the profile on any dimension. */
  | { kind: "pressure"; questionId: string; minShift: number }

export type FollowUpOption = { id: string; label: string; context: string }

export type FollowUp = {
  id: FollowUpId
  /** Private follow-ups stay on this device: they are never part of a shared profile. */
  private?: boolean
  /** Asked at the end of this chapter, after its primary questions. */
  chapter: ChapterId
  dimensions: DimensionId[]
  trigger: FollowUpTrigger
  prompt: string
  hint: string
  ariaLabel: string
  options: FollowUpOption[]
}

/** Responses keyed by question id; follow-ups are stored with their follow-up id. */
export type Responses = Record<string, Answer>

export type Signal = {
  questionId: string
  dimension: DimensionId
  /** -2..2 (the item's contribution to the dimension). */
  value: number
  /** 1 for a core item, 0.5 for a cross-dimension item. */
  weight: number
  /** True when this answer said “it depends” (a middle slider stop, or a context option). */
  context: boolean
}

export type EvidenceLevel = "none" | "thin" | "some" | "good"
export type Band = "a" | "b" | "middle"
export type Intensity = "balanced" | "slight" | "moderate" | "strong"
/** The four states a dimension can read as. */
export type DimensionState = "lean-a" | "lean-b" | "flexible" | "context"

export type DimensionResult = {
  id: DimensionId
  /** Weighted mean of the signals, scaled to -1..1, or null when nothing was answered for this dimension. */
  position: number | null
  /** Weighted standard deviation of the signals, scaled to 0..1: how much the answers disagreed. */
  spread: number
  /** How many answers said “it depends” on this dimension. */
  contextSignals: number
  range: [number, number]
  evidenceWeight: number
  evidenceMax: number
  coverage: number
  /** Answers that contributed (primary or secondary). */
  itemCount: number
  primaryAnswered: number
  primaryTotal: number
  evidence: EvidenceLevel
  /** Every signal behind the number, so a result can always be explained. */
  signals: Signal[]
}

export type Completion = {
  complete: boolean
  answeredPrimary: number
  totalPrimary: number
  skipped: number
  missing: string[]
  /** Dimensions without enough answered primary items. */
  weakDimensions: DimensionId[]
  reason: string | null
}

export type ScoreSet = {
  scoringVersion: number
  dimensions: Record<DimensionId, DimensionResult>
  completion: Completion
  contexts: Partial<Record<FollowUpId, string>>
  followUpsAsked: FollowUpId[]
}

/** The compact, shareable, quantised view of a person's dimensions. */
export type DimensionSummary = {
  /** Rounded to 0.01, in -1..1. */
  position: number
  /** Rounded to 0.01, in 0..1. */
  spread: number
  evidence: Exclude<EvidenceLevel, "none">
  /** How many “it depends” answers sit behind this dimension (0 to 3). Left out when zero. */
  context?: number
}

export type ProfileSummary = {
  scoringVersion: number
  /** null = no data, or kept private by the person. */
  dimensions: Record<DimensionId, DimensionSummary | null>
  contexts: Partial<Record<FollowUpId, string>>
  name?: string
}
