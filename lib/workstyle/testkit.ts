// Test helpers shared by the work-style suites. Not imported by the app.
import { dimensionIds } from "./dimensions.ts"
import { followUps, questions } from "./questions.ts"
import { answerSignals } from "./scoring.ts"
import { enumerateAnswers } from "./validate.ts"
import type { Answer, DimensionId, Question, Responses } from "./types.ts"

export { mulberry32 } from "./order.ts"

export type TargetSide = "a" | "b" | "middle"
type Targets = Partial<Record<DimensionId, TargetSide>>

const answerCache = new Map<string, Answer[]>()
/** Every possible answer, computed once per question (the simulations ask for them thousands of times). */
export function allAnswers(question: Question): Answer[] {
  let answers = answerCache.get(question.id)
  if (!answers) {
    answers = enumerateAnswers(question)
    answerCache.set(question.id, answers)
  }
  return answers
}

/** Running Σ(weight × value) per dimension, so a “middle” persona balances out across questions. */
type Balance = Partial<Record<DimensionId, number>>

/**
 * The answer to a question that pushes its dimensions furthest towards the target side of each (“a” = the
 * left pole, “b” = the right pole, “middle” = as close to neutral as possible, given what `balance` already
 * holds; “a” and “b” targets take priority over it). A cross-dimension question touches several dimensions, so the answer is the one with the best
 * total fit. Ties go to the first such answer, or the `variant`th.
 */
export function extremeAnswer(question: Question, targets: Targets, variant = 0, balance: Balance = {}): Answer {
  const sideOf = (dimension: DimensionId): TargetSide => targets[dimension] ?? "middle"
  const scored = allAnswers(question).map((answer) => {
    const fit = answerSignals(question, answer).reduce((total, signal) => {
      const side = sideOf(signal.dimension)
      const contribution = signal.weight * signal.value
      const value = side === "a" ? -10 * contribution : side === "b" ? 10 * contribution : -Math.abs((balance[signal.dimension] ?? 0) + contribution) + Math.abs(balance[signal.dimension] ?? 0)
      return total + value
    }, 0)
    return { answer, fit }
  })
  const best = Math.max(...scored.map((entry) => entry.fit))
  const ties = scored.filter((entry) => Math.abs(entry.fit - best) < 1e-9)
  return ties[variant % ties.length].answer
}

const allSides = (side: TargetSide, overrides: Targets = {}): Targets =>
  Object.fromEntries(dimensionIds.map((id) => [id, overrides[id] ?? side])) as Targets

/** A persona: every dimension answered towards the given side, with per-dimension overrides. */
export function persona(defaultSide: TargetSide, overrides: Targets = {}): Responses {
  const responses: Responses = {}
  const targets = allSides(defaultSide, overrides)
  const balance: Balance = {}
  for (const question of questions) {
    const answer = extremeAnswer(question, targets, 0, balance)
    responses[question.id] = answer
    for (const signal of answerSignals(question, answer)) balance[signal.dimension] = (balance[signal.dimension] ?? 0) + signal.weight * signal.value
  }
  return responses
}

/** Answers that alternate poles within each dimension, giving maximally mixed evidence. */
export function alternatingPersona(): Responses {
  const responses: Responses = {}
  const counts: Partial<Record<DimensionId, number>> = {}
  for (const question of questions) {
    const dimensionsHere = new Set(
      question.format === "scale" || question.primary
        ? [question.primary as DimensionId]
        : question.options.flatMap((option) => option.effects.map((effect) => effect.dimension)),
    )
    const targets: Targets = {}
    for (const dimension of dimensionsHere) {
      const index = counts[dimension] ?? 0
      counts[dimension] = index + 1
      targets[dimension] = index % 2 === 0 ? "a" : "b"
    }
    // A cross-dimension question can only point one way, so settle it by its first dimension.
    const first = [...dimensionsHere][0]
    for (const dimension of dimensionsHere) targets[dimension] = targets[first]
    responses[question.id] = extremeAnswer(question, targets)
  }
  return responses
}

export function randomResponses(random: () => number, options: { skipRate?: number } = {}): Responses {
  const responses: Responses = {}
  for (const question of questions) {
    if (random() < (options.skipRate ?? 0)) {
      responses[question.id] = { format: "skip" }
      continue
    }
    const all = allAnswers(question)
    responses[question.id] = all[Math.floor(random() * all.length)]
  }
  return responses
}

export function answerFollowUps(responses: Responses): Responses {
  const copy = { ...responses }
  for (const followUp of followUps) copy[followUp.id] = { format: "choice", optionId: followUp.options[0].id }
  return copy
}
