import { chapterIds, dimensionIds } from "./dimensions.ts"
import { classifyDimension, CONTEXT_SPREAD } from "./interpret.ts"
import { followUps, getFollowUp, getQuestion, MAX_FOLLOW_UPS, questions, recordsNote } from "./questions.ts"
import type {
  Answer,
  ChapterId,
  Completion,
  DimensionId,
  DimensionResult,
  DimensionSummary,
  EvidenceLevel,
  FollowUp,
  FollowUpId,
  ProfileSummary,
  Question,
  Responses,
  ScoreSet,
  Signal,
} from "./types.ts"

// SCORING MODEL v2: deterministic and transparent. See docs/workstyle/methodology.md.
//
// Every answer becomes one or more signals, each an item contribution from −2 (the “a” pole) to +2 (the
// “b” pole):
//   choose one      the chosen option’s value
//   choose several  the mean of the chosen options’ values (never the sum, so picking more can’t inflate)
//   slider          the five stops are −2, −1, 0, +1, +2, left to right in canonical orientation
//   rank            weighted mean, position weights 4, 3, 2, 1 (first to last)
//   divide units    the share-weighted mean
// A “depends on context” answer (the middle stop, or a context option) contributes 0 and adds a context signal.
//
//   position = Σ(weight × signal) ÷ Σ(weight) ÷ 2      (−1 = “a” pole … +1 = “b” pole)
//   spread   = weighted standard deviation of signals ÷ 2     (how much the answers disagreed)
//
// Core items weigh 1, cross-dimension items 0.5. Skipped items drop out. Change anything here => bump
// SCORING_VERSION. Saved results keep the version they were scored with.

export const SCORING_VERSION = 2
export const CORE_WEIGHT = 1
export const CROSS_WEIGHT = 0.5
/** At least this many questions must be answered for a result to be shown. */
export const MIN_PRIMARY_ANSWERED = 21
/** …and every dimension needs at least this many answers that bear on it. */
export const MIN_PRIMARY_PER_DIMENSION = 2

const round = (value: number, places: number) => {
  const factor = 10 ** places
  const rounded = Math.round(value * factor) / factor
  return Object.is(rounded, -0) ? 0 : rounded
}
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// ───────────────────────── Answer validation ─────────────────────────

export type Validation = { ok: true } | { ok: false; reason: string }
const ok: Validation = { ok: true }
const fail = (reason: string): Validation => ({ ok: false, reason })

export function validateAnswer(question: Question, answer: unknown): Validation {
  if (!answer || typeof answer !== "object") return fail("Answer must be an object")
  const value = answer as Record<string, unknown>
  if (value.format === "skip") return ok
  if (value.format !== question.format) return fail(`Expected a ${question.format} answer`)
  const optionIds = new Set("options" in question ? question.options.map((option) => option.id) : [])

  switch (question.format) {
    case "choice":
      return typeof value.optionId === "string" && optionIds.has(value.optionId) ? ok : fail("Unknown option")
    case "multi": {
      const ids = value.optionIds
      if (!Array.isArray(ids) || ids.length === 0) return fail("Pick at least one option")
      if (ids.length > question.max) return fail(`Pick at most ${question.max} options`)
      if (!ids.every((id) => typeof id === "string" && optionIds.has(id))) return fail("Unknown option")
      return new Set(ids).size === ids.length ? ok : fail("Duplicate option")
    }
    case "rank": {
      const order = value.order
      if (!Array.isArray(order) || order.length !== optionIds.size) return fail("Rank every option")
      if (!order.every((id) => typeof id === "string" && optionIds.has(id))) return fail("Unknown option")
      return new Set(order).size === order.length ? ok : fail("Duplicate option")
    }
    case "split": {
      const shares = value.shares
      if (!shares || typeof shares !== "object" || Array.isArray(shares)) return fail("Missing shares")
      const entries = Object.entries(shares as Record<string, unknown>)
      let sum = 0
      for (const [id, share] of entries) {
        if (!optionIds.has(id)) return fail("Unknown option")
        if (typeof share !== "number" || !Number.isInteger(share) || share < 0) return fail("Shares must be whole numbers")
        sum += share
      }
      return sum === question.total ? ok : fail(`Shares must add up to ${question.total}`)
    }
    case "scale":
      return typeof value.value === "number" && Number.isInteger(value.value) && value.value >= -2 && value.value <= 2
        ? ok
        : fail("Scale value must be a whole number from -2 to 2")
  }
}

export function validateFollowUpAnswer(followUp: FollowUp, answer: unknown): Validation {
  if (!answer || typeof answer !== "object") return fail("Answer must be an object")
  const value = answer as Record<string, unknown>
  if (value.format === "skip") return ok
  if (value.format !== "choice" || typeof value.optionId !== "string") return fail("Expected a choice")
  return followUp.options.some((option) => option.id === value.optionId) ? ok : fail("Unknown option")
}

/** Keeps only answers that are valid against the current bank. Used when restoring saved data. */
export function sanitizeResponses(raw: unknown): Responses {
  const clean: Responses = {}
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return clean
  for (const [id, answer] of Object.entries(raw as Record<string, unknown>)) {
    const question = getQuestion(id)
    if (question) {
      if (validateAnswer(question, answer).ok) clean[id] = answer as Answer
      continue
    }
    const followUp = getFollowUp(id)
    if (followUp && validateFollowUpAnswer(followUp, answer).ok) clean[id] = answer as Answer
  }
  return clean
}

// ───────────────────────── Answer → signals ─────────────────────────

/** Core items count in full; cross-dimension items (no primary dimension) count at half weight. */
export const questionWeight = (question: Question) => (question.primary ? CORE_WEIGHT : CROSS_WEIGHT)

/** Every dimension an answer to this question can bear on. */
export function effectDimensions(question: Question): DimensionId[] {
  if (question.format === "scale") return question.primary ? [question.primary] : []
  const found = new Set<DimensionId>()
  for (const option of question.options) for (const effect of option.effects) found.add(effect.dimension)
  return [...found]
}

/** Position weights for a ranking: 4, 3, 2, 1 for four options (first to last). */
export function rankWeights(count: number): number[] {
  return Array.from({ length: count }, (_, index) => count - index)
}

/** Turns one valid answer into signals. Skipped or invalid answers produce none. */
export function answerSignals(question: Question, answer: Answer | undefined): Signal[] {
  if (!answer || answer.format === "skip" || !validateAnswer(question, answer).ok) return []
  const signals: Signal[] = []
  const weight = questionWeight(question)
  const push = (dimension: DimensionId, value: number, context: boolean) => {
    signals.push({ questionId: question.id, dimension, value: round(clamp(value, -2, 2), 9), weight, context })
  }
  const effectOn = (option: { effects: { dimension: DimensionId; value: number; context?: boolean }[] }, dimension: DimensionId) =>
    option.effects.find((effect) => effect.dimension === dimension)

  switch (question.format) {
    case "choice": {
      const chosen = question.options.find((option) => option.id === (answer as { optionId: string }).optionId)
      for (const effect of chosen?.effects ?? []) push(effect.dimension, effect.value, !!effect.context)
      break
    }
    case "multi": {
      const selected = new Set((answer as { optionIds: string[] }).optionIds)
      for (const dimension of effectDimensions(question)) {
        const effects = question.options.filter((option) => selected.has(option.id)).flatMap((option) => effectOn(option, dimension) ?? [])
        if (effects.length) push(dimension, effects.reduce((total, effect) => total + effect.value, 0) / effects.length, effects.some((effect) => effect.context))
      }
      break
    }
    case "rank": {
      const order = (answer as { order: string[] }).order
      const weights = rankWeights(order.length)
      for (const dimension of effectDimensions(question)) {
        let total = 0
        let weightSum = 0
        let context = false
        order.forEach((id, index) => {
          const effect = effectOn(question.options.find((candidate) => candidate.id === id)!, dimension)
          if (!effect) return
          total += effect.value * weights[index]
          weightSum += weights[index]
          context ||= !!effect.context
        })
        if (weightSum > 0) push(dimension, total / weightSum, context)
      }
      break
    }
    case "split": {
      const shares = (answer as { shares: Record<string, number> }).shares
      for (const dimension of effectDimensions(question)) {
        let relevant = 0
        let weighted = 0
        for (const option of question.options) {
          const effect = effectOn(option, dimension)
          if (!effect) continue
          const share = shares[option.id] ?? 0
          relevant += share
          weighted += share * effect.value
        }
        if (relevant > 0) push(dimension, weighted / relevant, false)
      }
      break
    }
    case "scale": {
      const value = (answer as { value: number }).value
      if (question.primary) push(question.primary, value, value === 0)
      break
    }
  }
  return signals
}

// ───────────────────────── Aggregation ─────────────────────────

/** The most evidence each dimension can receive from the bank (core items 1, cross-dimension items 0.5). */
export function evidenceMaxima(bank: Question[] = questions): Record<DimensionId, number> {
  const maxima = Object.fromEntries(dimensionIds.map((id) => [id, 0])) as Record<DimensionId, number>
  for (const question of bank) {
    for (const dimension of effectDimensions(question)) maxima[dimension] += questionWeight(question)
  }
  return maxima
}

/** How many core items (and so how many chances at a full-weight answer) each dimension has. */
export function primaryTotals(bank: Question[] = questions): Record<DimensionId, number> {
  const totals = Object.fromEntries(dimensionIds.map((id) => [id, 0])) as Record<DimensionId, number>
  for (const question of bank) if (question.primary) totals[question.primary] += 1
  return totals
}

/**
 * How sure we are, from how many answers bear on the dimension (cross items count half) and how consistent
 * they were. Conflicting answers are real information, but they make any single reading less certain.
 */
function evidenceLevel(weightTotal: number, spread: number): EvidenceLevel {
  if (weightTotal <= 0) return "none"
  if (weightTotal < 2) return "thin"
  if (weightTotal < 3 || spread >= CONTEXT_SPREAD) return "some"
  return "good"
}

function chapterIndex(chapter: ChapterId) {
  return chapterIds.indexOf(chapter)
}

export function scoreDimensions(
  responses: Responses,
  options: { upToChapter?: ChapterId; exclude?: string[] } = {},
): Record<DimensionId, DimensionResult> {
  const limit = options.upToChapter ? chapterIndex(options.upToChapter) : Infinity
  const excluded = new Set(options.exclude ?? [])
  const bank = questions.filter((question) => chapterIndex(question.chapter) <= limit && !excluded.has(question.id))
  const maxima = evidenceMaxima(bank)
  const totals = primaryTotals(bank)
  const signals = bank.flatMap((question) => answerSignals(question, responses[question.id]))

  const results = {} as Record<DimensionId, DimensionResult>
  for (const id of dimensionIds) {
    const own = signals.filter((signal) => signal.dimension === id)
    const weightTotal = own.reduce((total, signal) => total + signal.weight, 0)
    const primaryAnswered = new Set(
      own.filter((signal) => getQuestion(signal.questionId)?.primary === id).map((signal) => signal.questionId),
    ).size
    const contextSignals = own.filter((signal) => signal.context).length

    if (weightTotal <= 0) {
      results[id] = {
        id,
        position: null,
        spread: 0,
        contextSignals: 0,
        range: [0, 0],
        evidenceWeight: 0,
        evidenceMax: maxima[id],
        coverage: 0,
        itemCount: 0,
        primaryAnswered,
        primaryTotal: totals[id],
        evidence: "none",
        signals: own,
      }
      continue
    }

    const mean = own.reduce((total, signal) => total + signal.weight * signal.value, 0) / weightTotal
    const variance = own.reduce((total, signal) => total + signal.weight * (signal.value - mean) ** 2, 0) / weightTotal
    const position = clamp(mean / 2, -1, 1)
    const spread = Math.min(1, Math.sqrt(variance) / 2)
    results[id] = {
      id,
      position,
      spread,
      contextSignals,
      range: [clamp(position - spread, -1, 1), clamp(position + spread, -1, 1)],
      evidenceWeight: weightTotal,
      evidenceMax: maxima[id],
      coverage: maxima[id] > 0 ? Math.min(1, weightTotal / maxima[id]) : 0,
      itemCount: own.length,
      primaryAnswered,
      primaryTotal: totals[id],
      evidence: evidenceLevel(weightTotal, spread),
      signals: own,
    }
  }
  return results
}

/** Same four-way reading the results use, applied to a live result. */
export function readingOf(result: DimensionResult) {
  if (result.position === null) return null
  return classifyDimension({ position: result.position, spread: result.spread, context: result.contextSignals })
}

// ───────────────────────── Adaptive follow-ups ─────────────────────────

/** A conflicted dimension: at least two answers, and they pull apart (or several said “it depends”). */
export function isConflicted(result: DimensionResult): boolean {
  return result.itemCount >= 2 && readingOf(result) === "context"
}

/**
 * Does the pressure item point a different way from the person's overall profile? Overall = everything
 * answered so far except the pressure item itself. “A different way” means the opposite side, by at least `minShift`.
 */
export function pressureShifted(responses: Responses, questionId: string, minShift: number, upToChapter?: ChapterId): boolean {
  const question = getQuestion(questionId)
  if (!question) return false
  const own = answerSignals(question, responses[questionId])
  if (!own.length) return false
  const overall = scoreDimensions(responses, { upToChapter, exclude: [questionId] })
  return own.some((signal) => {
    const position = overall[signal.dimension].position
    if (position === null || overall[signal.dimension].itemCount < 2) return false
    const usual = position * 2
    return usual * signal.value < 0 && Math.abs(signal.value - usual) >= minShift
  })
}

export function followUpTriggered(followUp: FollowUp, responses: Responses): boolean {
  const trigger = followUp.trigger
  if (trigger.kind === "pressure") return pressureShifted(responses, trigger.questionId, trigger.minShift, followUp.chapter)
  const results = scoreDimensions(responses, { upToChapter: followUp.chapter })
  return trigger.dimensions.some((dimension) => isConflicted(results[dimension]))
}

/**
 * Which follow-ups apply to these responses, in the order they are asked.
 * Each follow-up is judged only on evidence available up to its own chapter, so answering a later
 * chapter can never add or remove a follow-up the person has already passed. Deterministic, bounded
 * (MAX_FOLLOW_UPS), each at most once, and follow-ups never trigger other follow-ups.
 */
export function planFollowUps(responses: Responses): FollowUpId[] {
  const planned: FollowUpId[] = []
  const ordered = [...followUps].sort((x, y) => chapterIndex(x.chapter) - chapterIndex(y.chapter))
  for (const followUp of ordered) {
    if (planned.length >= MAX_FOLLOW_UPS) break
    if (followUpTriggered(followUp, responses)) planned.push(followUp.id)
  }
  return planned
}

export function contextsFrom(responses: Responses, planned: FollowUpId[]): Partial<Record<FollowUpId, string>> {
  const contexts: Partial<Record<FollowUpId, string>> = {}
  for (const id of planned) {
    const followUp = getFollowUp(id)
    const answer = responses[id]
    if (!followUp || !answer || answer.format !== "choice") continue
    const chosen = followUp.options.find((option) => option.id === answer.optionId)
    if (chosen && recordsNote(chosen.context)) contexts[id] = chosen.context
  }
  return contexts
}

// ───────────────────────── Completion & the full score set ─────────────────────────

export function assessCompletion(responses: Responses): Completion {
  const answered = questions.filter((question) => {
    const answer = responses[question.id]
    return answer && answer.format !== "skip" && validateAnswer(question, answer).ok
  })
  const skipped = questions.filter((question) => responses[question.id]?.format === "skip").length
  const missing = questions.filter((question) => !(question.id in responses)).map((question) => question.id)
  const perDimension = Object.fromEntries(dimensionIds.map((id) => [id, 0])) as Record<DimensionId, number>
  for (const question of answered) {
    for (const dimension of new Set(answerSignals(question, responses[question.id]).map((signal) => signal.dimension))) perDimension[dimension] += 1
  }
  const weakDimensions = dimensionIds.filter((id) => perDimension[id] < MIN_PRIMARY_PER_DIMENSION)

  let reason: string | null = null
  if (answered.length < MIN_PRIMARY_ANSWERED) {
    reason = `We need at least ${MIN_PRIMARY_ANSWERED} answered questions to build a reliable-enough picture; you have ${answered.length}.`
  } else if (weakDimensions.length) {
    reason = "Some areas have too few answers to say anything useful."
  }
  return {
    complete: reason === null,
    answeredPrimary: answered.length,
    totalPrimary: questions.length,
    skipped,
    missing,
    weakDimensions,
    reason,
  }
}

export function scoreResponses(responses: Responses): ScoreSet {
  const dimensionsResult = scoreDimensions(responses)
  const planned = planFollowUps(responses)
  return {
    scoringVersion: SCORING_VERSION,
    dimensions: dimensionsResult,
    completion: assessCompletion(responses),
    contexts: contextsFrom(responses, planned),
    followUpsAsked: planned,
  }
}

// ───────────────────────── Summaries ─────────────────────────

export function toProfileSummary(
  score: ScoreSet,
  options: { name?: string; include?: DimensionId[] } = {},
): ProfileSummary {
  const included = new Set(options.include ?? dimensionIds)
  const dims = {} as Record<DimensionId, DimensionSummary | null>
  for (const id of dimensionIds) {
    const result = score.dimensions[id]
    if (!included.has(id) || result.position === null || result.evidence === "none") {
      dims[id] = null
      continue
    }
    dims[id] = {
      position: round(result.position, 2),
      spread: round(result.spread, 2),
      evidence: result.evidence,
      ...(result.contextSignals > 0 ? { context: Math.min(3, result.contextSignals) } : {}),
    }
  }
  // Contexts only travel with the profile when the dimensions they describe are included.
  const contexts: ProfileSummary["contexts"] = {}
  for (const [id, context] of Object.entries(score.contexts) as [FollowUpId, string][]) {
    const followUp = getFollowUp(id)
    if (followUp && followUp.dimensions.every((dimension) => dims[dimension])) contexts[id] = context
  }
  const name = options.name?.trim()
  return {
    scoringVersion: score.scoringVersion,
    dimensions: dims,
    contexts,
    ...(name ? { name: name.slice(0, 40) } : {}),
  }
}

// ───────────────────────── Explaining answers ─────────────────────────

/** Plain-language description of what a person answered, for “why we think this”. */
export function describeAnswer(question: Question, answer: Answer | undefined): string | null {
  if (!answer || answer.format === "skip") return null
  switch (question.format) {
    case "choice": {
      const chosen = question.options.find((option) => option.id === (answer as { optionId: string }).optionId)
      return chosen ? `“${chosen.label}”` : null
    }
    case "multi": {
      const ids = (answer as { optionIds: string[] }).optionIds
      const labels = question.options.filter((option) => ids.includes(option.id)).map((option) => option.label)
      return labels.length ? labels.map((label) => `“${label}”`).join(", ") : null
    }
    case "rank": {
      const order = (answer as { order: string[] }).order
      const first = question.options.find((option) => option.id === order[0])
      const last = question.options.find((option) => option.id === order[order.length - 1])
      return first && last ? `Put “${first.label}” first and “${last.label}” last` : null
    }
    case "split": {
      const shares = (answer as { shares: Record<string, number> }).shares
      const top = [...question.options].sort((x, y) => (shares[y.id] ?? 0) - (shares[x.id] ?? 0))[0]
      return top ? `Spent most on “${top.label}” (${shares[top.id] ?? 0} of ${question.total})` : null
    }
    case "scale": {
      const value = (answer as { value: number }).value
      if (value === 0) return "Right in the middle"
      // Stored values are canonical (negative = the `left` statement), whichever side it was shown on.
      const text = value < 0 ? question.left : question.right
      return `${Math.abs(value) === 2 ? "Strongly towards" : "Towards"} “${text}”`
    }
  }
}
