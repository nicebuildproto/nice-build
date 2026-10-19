import { chapterIds, dimensionIds, dimensions } from "./dimensions.ts"
import { followUps, getFollowUp, questions, questionsInChapter } from "./questions.ts"
import { planFollowUps, scoreDimensions } from "./scoring.ts"
import type { ChapterId, DimensionId, Responses } from "./types.ts"

// The question flow is a pure function of the responses so far. Nothing here knows about React.

export type Step =
  | { key: string; kind: "chapter"; chapter: ChapterId }
  | { key: string; kind: "question"; chapter: ChapterId; id: string }
  | { key: string; kind: "followup"; chapter: ChapterId; id: string }
  | { key: string; kind: "pause"; chapter: ChapterId }
  | { key: string; kind: "reflect" }

export const stepKeys = {
  chapter: (chapter: ChapterId) => `chapter:${chapter}`,
  question: (id: string) => `q:${id}`,
  followup: (id: string) => `f:${id}`,
  pause: (chapter: ChapterId) => `pause:${chapter}`,
  reflect: "reflect",
} as const

/** Every step the person will see, given what they have answered so far. */
export function buildSteps(responses: Responses): Step[] {
  const planned = new Set(planFollowUps(responses))
  const steps: Step[] = []
  chapterIds.forEach((chapter, index) => {
    steps.push({ key: stepKeys.chapter(chapter), kind: "chapter", chapter })
    for (const question of questionsInChapter(chapter)) {
      steps.push({ key: stepKeys.question(question.id), kind: "question", chapter, id: question.id })
    }
    for (const followUp of followUps) {
      if (followUp.chapter === chapter && planned.has(followUp.id)) {
        steps.push({ key: stepKeys.followup(followUp.id), kind: "followup", chapter, id: followUp.id })
      }
    }
    if (index < chapterIds.length - 1) steps.push({ key: stepKeys.pause(chapter), kind: "pause", chapter })
  })
  steps.push({ key: stepKeys.reflect, kind: "reflect" })
  return steps
}

export function stepIndex(steps: Step[], key: string | null | undefined): number {
  return key ? steps.findIndex((step) => step.key === key) : -1
}

/**
 * Returns a key that exists in `steps`. If the saved step has gone (a follow-up no longer applies after
 * an earlier answer changed) we fall back to the chapter's last question, then to the start.
 */
export function resolveStepKey(steps: Step[], key: string | null | undefined): string {
  if (stepIndex(steps, key) >= 0) return key as string
  if (key?.startsWith("f:")) {
    const followUp = getFollowUp(key.slice(2))
    if (followUp) {
      const last = questionsInChapter(followUp.chapter).at(-1)
      if (last) return stepKeys.question(last.id)
    }
  }
  return steps[0].key
}

export function nextStepKey(steps: Step[], key: string): string | null {
  const index = stepIndex(steps, key)
  return index >= 0 && index < steps.length - 1 ? steps[index + 1].key : null
}

/** Back goes to the previous question or follow-up, skipping chapter openers and pauses. */
export function previousAnswerStepKey(steps: Step[], key: string): string | null {
  for (let index = stepIndex(steps, key) - 1; index >= 0; index -= 1) {
    const step = steps[index]
    if (step.kind === "question" || step.kind === "followup") return step.key
  }
  return null
}

export type Progress = {
  /** 1-based number of the current primary question, or the last one reached. */
  current: number
  total: number
  chapter: ChapterId | null
  /** Per-chapter fill, 0..1, for the segmented progress bar. */
  segments: { chapter: ChapterId; fill: number; count: number }[]
  followUp: boolean
}

export function progressFor(steps: Step[], key: string): Progress {
  const index = Math.max(0, stepIndex(steps, key))
  const step = steps[index]
  const passed = (candidate: Step, candidateIndex: number) => candidate.kind === "question" && candidateIndex < index
  const segments = chapterIds.map((chapter) => {
    const own = steps.map((candidate, candidateIndex) => ({ candidate, candidateIndex })).filter(
      ({ candidate }) => candidate.kind === "question" && candidate.chapter === chapter,
    )
    const done = own.filter(({ candidate, candidateIndex }) => passed(candidate, candidateIndex)).length
    return { chapter, fill: own.length ? Math.min(1, done / own.length) : 0, count: own.length }
  })
  const passedQuestions = steps.filter(passed).length
  const onQuestion = step.kind === "question"
  return {
    current: onQuestion ? passedQuestions + 1 : Math.min(passedQuestions, questions.length),
    total: questions.length,
    chapter: "chapter" in step ? step.chapter : null,
    segments,
    followUp: step.kind === "followup",
  }
}

// ───────────────────────── Chapter observations ─────────────────────────

export type Observation = { text: string; dimension: DimensionId | null; kind: "tilt" | "split" | "neutral" }

/**
 * A factual note about the answers so far. It describes what was answered; it never names a profile or
 * draws a conclusion about the person. Chapters mix dimensions, so a note looks at the chapter’s own
 * answers for a clear lean, and at everything answered so far for a dimension that pulls both ways.
 */
export function chapterObservation(responses: Responses, chapter: ChapterId): Observation {
  const results = scoreDimensions(responses, { upToChapter: chapter })
  const own = new Set(questionsInChapter(chapter).map((question) => question.id))

  // A dimension whose answers pull in both directions (at least one clear answer each way).
  for (const dimension of dimensionIds) {
    const values = results[dimension].signals.filter((signal) => signal.weight >= 1).map((signal) => signal.value)
    if (values.some((value) => value <= -1) && values.some((value) => value >= 1) && values.length >= 2) {
      return {
        kind: "split",
        dimension,
        text: `Your answers about ${dimensions[dimension].short.toLowerCase()} pulled in both directions. That isn’t a contradiction. It usually means it depends.`,
      }
    }
  }

  // The clearest lean in this chapter’s own core answers.
  let best: { dimension: DimensionId; side: "a" | "b"; strength: number } | null = null
  for (const dimension of dimensionIds) {
    for (const signal of results[dimension].signals) {
      if (!own.has(signal.questionId) || signal.weight < 1 || Math.abs(signal.value) < 1) continue
      if (!best || Math.abs(signal.value) > best.strength) best = { dimension, side: signal.value < 0 ? "a" : "b", strength: Math.abs(signal.value) }
    }
  }
  if (best) {
    const spec = dimensions[best.dimension]
    const pole = best.side === "a" ? spec.a : spec.b
    return {
      kind: "tilt",
      dimension: best.dimension,
      text: `In this chapter, your answer about ${spec.short.toLowerCase()} went for something close to “${pole.label.toLowerCase()}”.`,
    }
  }
  return { kind: "neutral", dimension: null, text: "Nothing in that chapter was scored as better or worse. It all just adds detail." }
}
