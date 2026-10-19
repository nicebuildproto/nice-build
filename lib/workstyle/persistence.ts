import { dimensionIds } from "./dimensions.ts"
import { randomSeed } from "./order.ts"
import { ASSESSMENT_VERSION } from "./questions.ts"
import { assessCompletion, sanitizeResponses, scoreResponses, SCORING_VERSION, toProfileSummary } from "./scoring.ts"
import { sanitizeName } from "./share.ts"
import type { DimensionId, ProfileSummary, Responses } from "./types.ts"

// PERSISTENCE — everything lives in this browser's localStorage under one key. Nothing is sent to a
// server. Parsing is defensive: damaged or outdated data is repaired where possible and reported,
// never silently trusted.

export const STORAGE_KEY = "ws.state.v1"
export const MAX_REFLECTION_LENGTH = 400
export const MAX_EDIT_LENGTH = 700

export type StoredState = {
  v: 1
  bank: string
  responses: Responses
  /**
   * Seed for this attempt’s option order. Saved so a refresh shows the same order, and replaced on retake.
   * (Not secret: it only shuffles the screen.)
   */
  seed: number
  /** Key of the step the person was on. */
  step: string | null
  started: boolean
  /** True once the person reached the end of the questions. */
  finished: boolean
  completedAt: string | null
  /** Snapshot taken at completion so a saved result isn’t silently changed by later scoring updates. */
  summary: ProfileSummary | null
  reflection: string
  name: string
  shareDimensions: DimensionId[]
  guideEdits: Record<string, string>
  /** A shared profile code the person chose to compare with. */
  pendingCompare: string | null
  updatedAt: string
}

export type Recovery = "none" | "corrupt" | "migrated"

export function emptyState(now = new Date().toISOString(), seed = randomSeed()): StoredState {
  return {
    v: 1,
    bank: ASSESSMENT_VERSION,
    seed,
    responses: {},
    step: null,
    started: false,
    finished: false,
    completedAt: null,
    summary: null,
    reflection: "",
    name: "",
    shareDimensions: [...dimensionIds],
    guideEdits: {},
    pendingCompare: null,
    updatedAt: now,
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value)

export function isValidSummary(summary: ProfileSummary): boolean {
  if (summary.scoringVersion !== SCORING_VERSION || !isRecord(summary.dimensions) || !isRecord(summary.contexts)) return false
  return dimensionIds.every((id) => {
    const entry = summary.dimensions[id]
    if (entry === null) return true
    return (
      isRecord(entry) &&
      typeof entry.position === "number" && entry.position >= -1 && entry.position <= 1 &&
      typeof entry.spread === "number" && entry.spread >= 0 && entry.spread <= 1 &&
      (entry.evidence === "thin" || entry.evidence === "some" || entry.evidence === "good") &&
      (entry.context === undefined || (Number.isInteger(entry.context) && entry.context >= 0 && entry.context <= 3))
    )
  })
}

export function parseStoredState(raw: string | null, now = new Date().toISOString()): { state: StoredState; recovery: Recovery } {
  if (!raw) return { state: emptyState(now), recovery: "none" }
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { state: emptyState(now), recovery: "corrupt" }
  }
  if (!isRecord(data) || data.v !== 1) return { state: emptyState(now), recovery: "corrupt" }

  // Answers from another version of the bank describe different questions, so they are not carried over.
  const migrated = data.bank !== ASSESSMENT_VERSION
  const responses = migrated ? {} : sanitizeResponses(data.responses)
  const base = emptyState(now)
  const shareDimensions = Array.isArray(data.shareDimensions)
    ? dimensionIds.filter((id) => (data.shareDimensions as unknown[]).includes(id))
    : base.shareDimensions
  const guideEdits: Record<string, string> = {}
  if (!migrated && isRecord(data.guideEdits)) {
    for (const [key, value] of Object.entries(data.guideEdits)) {
      if (typeof value === "string" && value.trim()) guideEdits[key] = value.slice(0, MAX_EDIT_LENGTH)
    }
  }

  const summary = isRecord(data.summary) && !migrated ? (data.summary as unknown as ProfileSummary) : null
  const summaryValid = summary !== null && isValidSummary(summary)

  const state: StoredState = {
    v: 1,
    bank: ASSESSMENT_VERSION,
    seed: !migrated && typeof data.seed === "number" && Number.isInteger(data.seed) && data.seed >= 0 && data.seed <= 0xffffffff ? data.seed : base.seed,
    responses,
    step: migrated ? null : typeof data.step === "string" ? data.step : null,
    started: !migrated && (Object.keys(responses).length > 0 || data.started === true),
    finished: migrated ? false : data.finished === true,
    completedAt: !migrated && typeof data.completedAt === "string" ? data.completedAt : null,
    summary: summaryValid ? summary : null,
    // The closing prompt changed with the bank, so an older free-text answer is not carried over.
    reflection: !migrated && typeof data.reflection === "string" ? data.reflection.slice(0, MAX_REFLECTION_LENGTH) : "",
    name: typeof data.name === "string" ? (sanitizeName(data.name) ?? "") : "",
    shareDimensions: shareDimensions.length ? shareDimensions : base.shareDimensions,
    guideEdits,
    pendingCompare: typeof data.pendingCompare === "string" && data.pendingCompare.length <= 220 ? data.pendingCompare : null,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : now,
  }
  return { state, recovery: migrated ? "migrated" : "none" }
}

export function serializeState(state: StoredState): string {
  return JSON.stringify(state)
}

/** Stamps completion and snapshots the summary, if (and only if) the responses support a result. */
export function completeState(state: StoredState, now = new Date().toISOString()): StoredState {
  const completion = assessCompletion(state.responses)
  if (!completion.complete) return { ...state, finished: false, completedAt: null, summary: null, updatedAt: now }
  const score = scoreResponses(state.responses)
  return { ...state, finished: true, completedAt: state.completedAt ?? now, summary: toProfileSummary(score), updatedAt: now }
}

export type StoredResult = { summary: ProfileSummary; completedAt: string }

/** A result exists only when the person finished AND the answers still meet the completion rules. */
export function readResult(state: StoredState): StoredResult | null {
  if (!state.finished) return null
  if (!assessCompletion(state.responses).complete) return null
  const summary = state.summary ?? toProfileSummary(scoreResponses(state.responses))
  return { summary, completedAt: state.completedAt ?? state.updatedAt }
}
