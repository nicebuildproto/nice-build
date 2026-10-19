import { contextLines } from "./content/identities.ts"
import { chapterIds, chapters, dimensionIds } from "./dimensions.ts"
import { followUps, questions, recordsNote } from "./questions.ts"
import { answerSignals, evidenceMaxima, primaryTotals } from "./scoring.ts"
import type { Answer, FollowUp, Question } from "./types.ts"

// QUESTION-BANK VALIDATION — structural quality only. Passing these checks shows the bank is
// well-formed and the scoring can reach every pole; it says nothing about whether the instrument
// measures what it intends to. See docs/workstyle/methodology.md.

export type BankReport = { errors: string[]; warnings: string[] }

const FORMATS = new Set(["choice", "multi", "rank", "split", "scale"])
const words = (text: string) => new Set(text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter((word) => word.length > 3))

function jaccard(a: Set<string>, b: Set<string>) {
  const shared = [...a].filter((word) => b.has(word)).length
  const union = new Set([...a, ...b]).size
  return union ? shared / union : 0
}

/** Every distinct answer a person could give, so we can check the scoring can reach each pole. */
export function enumerateAnswers(question: Question): Answer[] {
  switch (question.format) {
    case "choice":
      return question.options.map((option) => ({ format: "choice", optionId: option.id }))
    case "scale":
      return [-2, -1, 0, 1, 2].map((value) => ({ format: "scale", value }))
    case "multi": {
      const answers: Answer[] = []
      const ids = question.options.map((option) => option.id)
      for (let mask = 1; mask < 1 << ids.length; mask += 1) {
        const picked = ids.filter((_, index) => mask & (1 << index))
        if (picked.length <= question.max) answers.push({ format: "multi", optionIds: picked })
      }
      return answers
    }
    case "rank": {
      const ids = question.options.map((option) => option.id)
      const permute = (rest: string[]): string[][] =>
        rest.length <= 1 ? [rest] : rest.flatMap((id, index) => permute([...rest.slice(0, index), ...rest.slice(index + 1)]).map((tail) => [id, ...tail]))
      return permute(ids).map((order) => ({ format: "rank", order }))
    }
    case "split": {
      const ids = question.options.map((option) => option.id)
      const answers: Answer[] = []
      const fill = (index: number, left: number, shares: Record<string, number>) => {
        if (index === ids.length - 1) {
          answers.push({ format: "split", shares: { ...shares, [ids[index]]: left } })
          return
        }
        for (let amount = 0; amount <= left; amount += 1) fill(index + 1, left - amount, { ...shares, [ids[index]]: amount })
      }
      fill(0, question.total, {})
      return answers
    }
  }
}

export const MAX_OPTION_LENGTH = 110
const EM_DASH = /—/

/** Every user-facing string in the bank: chapters, prompts, hints, options, slider ends and follow-ups. */
export function bankStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = []
  for (const id of chapterIds) out.push({ where: `chapter ${id} title`, text: chapters[id].title }, { where: `chapter ${id} intro`, text: chapters[id].intro })
  for (const question of questions) {
    out.push({ where: `${question.id} prompt`, text: question.prompt }, { where: `${question.id} aria label`, text: question.ariaLabel })
    if (question.hint) out.push({ where: `${question.id} hint`, text: question.hint })
    if (question.format === "scale") out.push({ where: `${question.id} left`, text: question.left }, { where: `${question.id} right`, text: question.right })
    else for (const option of question.options) out.push({ where: option.id, text: option.label })
  }
  for (const followUp of followUps) {
    out.push({ where: `${followUp.id} prompt`, text: followUp.prompt }, { where: `${followUp.id} hint`, text: followUp.hint })
    for (const option of followUp.options) out.push({ where: option.id, text: option.label })
  }
  return out
}

const STRAIGHT_QUOTE = /['"]/

export function validateBank(): BankReport {
  const errors: string[] = []
  const warnings: string[] = []
  const dimensionSet = new Set<string>(dimensionIds)
  const chapterSet = new Set<string>(chapterIds)

  // IDs
  const seen = new Set<string>()
  for (const question of questions) {
    if (!question.id) errors.push("A question has no id")
    if (seen.has(question.id)) errors.push(`Duplicate id: ${question.id}`)
    seen.add(question.id)
  }
  for (const followUp of followUps) {
    if (!followUp.id) errors.push("A follow-up has no id")
    if (seen.has(followUp.id)) errors.push(`Duplicate id (follow-up clashes with a question): ${followUp.id}`)
    seen.add(followUp.id)
  }

  for (const question of questions) {
    const where = `Question ${question.id}`
    if (!FORMATS.has(question.format)) errors.push(`${where}: unsupported format ${String(question.format)}`)
    if (!chapterSet.has(question.chapter)) errors.push(`${where}: unknown chapter ${question.chapter}`)
    if (question.primary !== null && !dimensionSet.has(question.primary)) errors.push(`${where}: unknown primary dimension`)
    if (!question.prompt.trim()) errors.push(`${where}: empty prompt`)
    if (!question.ariaLabel.trim()) errors.push(`${where}: missing accessible label`)
    if (question.format !== "choice" && !question.hint?.trim()) errors.push(`${where}: ${question.format} questions need an instruction hint`)

    if (question.format === "scale") {
      if (question.primary === null) errors.push(`${where}: a slider must be a core item`)
      if (!question.left.trim() || !question.right.trim()) errors.push(`${where}: scale needs labelled endpoints`)
    } else {
      if (question.options.length < 3) errors.push(`${where}: needs at least three options`)
      const optionIds = new Set<string>()
      const touched = new Set<string>()
      for (const option of question.options) {
        if (!option.id || optionIds.has(option.id)) errors.push(`${where}: missing or duplicate option id ${option.id}`)
        optionIds.add(option.id)
        if (seen.has(option.id)) errors.push(`${where}: option id ${option.id} clashes with another id`)
        if (!option.label.trim()) errors.push(`${where}: option ${option.id} has no label`)
        if (option.label.length > MAX_OPTION_LENGTH) errors.push(`${where}: option ${option.id} is ${option.label.length} characters (limit ${MAX_OPTION_LENGTH})`)
        if (option.effects.length === 0) errors.push(`${where}: option ${option.id} has no effects (invalid answer mapping)`)
        for (const effect of option.effects) {
          touched.add(effect.dimension)
          if (!dimensionSet.has(effect.dimension)) errors.push(`${where}: option ${option.id} maps to unknown dimension`)
          else if (question.primary !== null && effect.dimension !== question.primary) {
            errors.push(`${where}: option ${option.id} maps to ${effect.dimension}, but this is a core ${question.primary} item`)
          }
          if (!Number.isInteger(effect.value) || effect.value < -2 || effect.value > 2) errors.push(`${where}: option ${option.id} has score ${effect.value} outside -2..2`)
          if (effect.context && effect.value !== 0) errors.push(`${where}: context option ${option.id} must score 0`)
        }
      }
      if (question.primary === null && touched.size < 3) errors.push(`${where}: a cross-dimension item should touch at least three dimensions`)
      if (question.format === "multi") {
        if (!Number.isInteger(question.max) || question.max < 2 || question.max >= question.options.length) errors.push(`${where}: multi-select needs a limit of 2 or more, below the option count`)
        if (!new RegExp(`up to ${({ 2: "two", 3: "three" } as Record<number, string>)[question.max] ?? question.max}`, "i").test(question.hint ?? "")) errors.push(`${where}: the hint must say the limit`)
      }
      if (question.format === "split" && question.total !== 6) errors.push(`${where}: divide-units items share six blocks`)
      if (question.format === "rank" && (question.options.length < 3 || question.options.length > 5)) errors.push(`${where}: rank needs 3–5 options`)
      if (question.format === "rank" && question.primary === null) errors.push(`${where}: rankings must be core items`)
      if (question.format === "split" && question.primary === null) errors.push(`${where}: divide-units items must be core items`)
    }

    // Scoring reachability: both poles of a core item must be reachable, and nothing may throw.
    if (question.primary !== null && dimensionSet.has(question.primary)) {
      try {
        const values = enumerateAnswers(question).flatMap((answer) =>
          answerSignals(question, answer).filter((signal) => signal.dimension === question.primary).map((signal) => signal.value),
        )
        if (values.length === 0) errors.push(`${where}: no answer produces a signal on ${question.primary} (unreachable scoring)`)
        else {
          if (Math.min(...values) > -0.5) errors.push(`${where}: the “a” pole of ${question.primary} is unreachable (min ${Math.min(...values).toFixed(2)})`)
          if (Math.max(...values) < 0.5) errors.push(`${where}: the “b” pole of ${question.primary} is unreachable (max ${Math.max(...values).toFixed(2)})`)
        }
      } catch (error) {
        errors.push(`${where}: scoring threw: ${(error as Error).message}`)
      }
    }
  }

  // Dimensions: enough core items, none supplying too much of the evidence.
  const totals = primaryTotals()
  const maxima = evidenceMaxima()
  for (const id of dimensionIds) {
    if (totals[id] < 3) errors.push(`Dimension ${id} has only ${totals[id]} core questions (need ≥ 3)`)
    if (1 / maxima[id] > 0.4) errors.push(`A single question supplies more than 40% of the evidence for ${id}`)
  }
  for (const chapter of chapterIds) {
    if (!questions.some((question) => question.chapter === chapter)) errors.push(`Chapter ${chapter} has no questions`)
    if (!chapters[chapter].title.trim() || !chapters[chapter].intro.trim()) errors.push(`Chapter ${chapter} needs a title and an intro`)
  }
  if (questions.length < 24 || questions.length > 30) warnings.push(`Question count is ${questions.length} (target 24–30)`)

  // Flow: no two adjacent questions on the same dimension, and chapters are contiguous.
  for (let i = 1; i < questions.length; i += 1) {
    const [before, after] = [questions[i - 1], questions[i]]
    if (before.primary === after.primary) errors.push(`Questions ${before.id} and ${after.id} are adjacent and share ${before.primary ?? "the cross-dimension slot"}`)
    if (chapterIds.indexOf(after.chapter) < chapterIds.indexOf(before.chapter)) errors.push(`Question ${after.id} is out of chapter order`)
    if (before.format === after.format) warnings.push(`Questions ${before.id} and ${after.id} use the same format back to back`)
  }

  // Wording: length, dashes and quotes.
  for (const { where, text } of bankStrings()) {
    if (EM_DASH.test(text)) errors.push(`${where}: contains an em dash`)
    if (STRAIGHT_QUOTE.test(text)) errors.push(`${where}: uses a straight quote or apostrophe`)
  }

  // Sliders should not all run the same way.
  const sliders = questions.filter((question) => question.format === "scale")
  if (sliders.length && (sliders.every((question) => question.format === "scale" && question.flip) || sliders.every((question) => question.format === "scale" && !question.flip))) {
    warnings.push("All sliders have the same orientation")
  }

  // Follow-ups
  for (const followUp of followUps) validateFollowUp(followUp, errors)
  if (followUps.length === 0) warnings.push("No adaptive follow-ups defined")

  // Redundancy (heuristic: raises warnings for a human to review)
  for (let i = 0; i < questions.length; i += 1) {
    for (let j = i + 1; j < questions.length; j += 1) {
      const similarity = jaccard(words(questions[i].prompt), words(questions[j].prompt))
      if (similarity > 0.6) warnings.push(`Prompts ${questions[i].id} and ${questions[j].id} share ${(similarity * 100).toFixed(0)}% of their words`)
    }
  }

  return { errors, warnings }
}

function validateFollowUp(followUp: FollowUp, errors: string[]) {
  const where = `Follow-up ${followUp.id}`
  if (!chapterIds.includes(followUp.chapter)) errors.push(`${where}: unknown chapter`)
  if (!followUp.ariaLabel.trim() || !followUp.prompt.trim()) errors.push(`${where}: missing prompt or accessible label`)
  const trigger = followUp.trigger
  if (trigger.kind === "conflict") {
    if (trigger.dimensions.length === 0) errors.push(`${where}: a conflict trigger needs at least one dimension`)
    for (const dimension of trigger.dimensions) if (!dimensionIds.includes(dimension)) errors.push(`${where}: trigger uses unknown dimension ${dimension}`)
  } else {
    const question = questions.find((candidate) => candidate.id === trigger.questionId)
    if (!question) errors.push(`${where}: trigger refers to unknown question ${trigger.questionId}`)
    else if (chapterIds.indexOf(followUp.chapter) < chapterIds.indexOf(question.chapter)) errors.push(`${where}: asked before ${question.id} has been answered`)
  }
  if (followUp.options.length < 3) errors.push(`${where}: needs at least three options`)
  const ids = new Set<string>()
  for (const option of followUp.options) {
    if (!option.id || ids.has(option.id)) errors.push(`${where}: duplicate or missing option id`)
    ids.add(option.id)
    if (!option.label.trim()) errors.push(`${where}: option ${option.id} has no label`)
    if (!option.context.trim()) errors.push(`${where}: option ${option.id} has no context`)
    if (recordsNote(option.context) && !contextLines[followUp.id]?.[option.context]) {
      errors.push(`${where}: context “${option.context}” has no authored line`)
    }
  }
}
