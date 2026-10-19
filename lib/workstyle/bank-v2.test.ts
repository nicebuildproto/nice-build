/**
 * Question bank v2: the acceptance checks from the brief.
 *   1. Key check: all-left, all-right and alternating respondents.
 *   2. Simulation: random respondents should not lean either way, dimension by dimension.
 *   3. Skipping and refreshing never break anything.
 *   4. The 28 prompts in order: no neighbours in the same dimension, short options, no em dashes.
 */
import assert from "node:assert/strict"
import test from "node:test"
import { dimensionIds } from "./dimensions.ts"
import { readDimension } from "./interpret.ts"
import { displayOptions, initialRankOrder, seedFor } from "./order.ts"
import { buildProfile } from "./profile.ts"
import { emptyState, parseStoredState, serializeState } from "./persistence.ts"
import { questions } from "./questions.ts"
import { scoreResponses, toProfileSummary } from "./scoring.ts"
import { alternatingPersona, answerFollowUps, mulberry32, persona, randomResponses } from "./testkit.ts"
import { bankStrings, MAX_OPTION_LENGTH } from "./validate.ts"
import type { DimensionId, Responses } from "./types.ts"

const stateOf = (responses: Responses, id: DimensionId) => {
  const summary = toProfileSummary(scoreResponses(responses)).dimensions[id]
  assert.ok(summary, `${id} has a reading`)
  return { summary, state: readDimension(summary).state }
}

// ───────────────────────── 1. Key check ─────────────────────────

test("key check: an all-left respondent leans clearly left on every dimension", () => {
  const responses = persona("a")
  for (const id of dimensionIds) {
    const { summary, state } = stateOf(responses, id)
    assert.equal(state, "lean-a", id)
    assert.ok(summary.position * 2 <= -0.8, `${id} mean ${summary.position * 2}`)
    assert.ok(summary.spread * 2 < 1.2, `${id} spread ${summary.spread * 2}`)
  }
})

test("key check: an all-right respondent leans clearly right on every dimension", () => {
  const responses = persona("b")
  for (const id of dimensionIds) {
    const { summary, state } = stateOf(responses, id)
    assert.equal(state, "lean-b", id)
    assert.ok(summary.position * 2 >= 0.8, `${id} mean ${summary.position * 2}`)
    assert.ok(summary.spread * 2 < 1.2, `${id} spread ${summary.spread * 2}`)
  }
})

test("key check: an alternating respondent reads flexible or depends on context, never as a lean", () => {
  const responses = alternatingPersona()
  for (const id of dimensionIds) {
    const { state } = stateOf(responses, id)
    assert.ok(state === "flexible" || state === "context", `${id} read as ${state}`)
  }
})

// ───────────────────────── 2. Simulation ─────────────────────────

test("simulation: 200 random respondents average out to within 0.3 of zero on every dimension", () => {
  const random = mulberry32(2026)
  const sums = Object.fromEntries(dimensionIds.map((id) => [id, { total: 0, count: 0 }])) as Record<DimensionId, { total: number; count: number }>
  const states: Record<string, number> = {}
  const runs = 200
  for (let run = 0; run < runs; run += 1) {
    const responses = randomResponses(random)
    const summary = toProfileSummary(scoreResponses(responses))
    for (const id of dimensionIds) {
      const dimension = summary.dimensions[id]
      if (!dimension) continue
      sums[id].total += dimension.position * 2
      sums[id].count += 1
      const state = readDimension(dimension).state
      states[state] = (states[state] ?? 0) + 1
    }
  }
  for (const id of dimensionIds) {
    const mean = sums[id].total / sums[id].count
    assert.ok(Math.abs(mean) <= 0.3, `${id} mean ${mean.toFixed(3)}`)
  }
  // All four readings occur, so none of them is dead code.
  for (const state of ["lean-a", "lean-b", "flexible", "context"]) assert.ok(states[state] > 0, `${state} never happens`)
})

// ───────────────────────── 3. Skipping and refreshing ─────────────────────────

test("skipping any single question never crashes scoring, results or the guide", () => {
  for (const question of questions) {
    const responses = { ...persona("a"), [question.id]: { format: "skip" as const } }
    const score = scoreResponses(answerFollowUps(responses))
    const profile = buildProfile(toProfileSummary(score))
    assert.ok(profile.headline.title.length > 0, question.id)
    assert.ok(profile.guide.length > 0, question.id)
  }
})

test("skipping everything never crashes and produces no reading", () => {
  const responses: Responses = Object.fromEntries(questions.map((question) => [question.id, { format: "skip" as const }]))
  const score = scoreResponses(responses)
  assert.equal(score.completion.complete, false)
  const profile = buildProfile(toProfileSummary(score))
  assert.ok(profile)
})

test("results and guide render when the free-text step is skipped", () => {
  const profile = buildProfile(toProfileSummary(scoreResponses(persona("b"))))
  assert.ok(profile.guide.length > 0)
  for (const statement of profile.guide) assert.ok(statement.text.trim().length > 0, statement.id)
})

test("option order depends on the saved seed only: the same seed always gives the same order, another seed another one", () => {
  const withMany = questions.filter((question) => question.format !== "scale" && question.format !== "rank" && question.options.length >= 5)
  assert.ok(withMany.length > 0)
  let changed = 0
  for (const question of withMany) {
    if (question.format === "scale" || question.format === "rank") continue
    const order = (seed: number) => displayOptions(question.id, question.options, seed).map((option) => option.id)
    assert.deepEqual(order(7), order(7), question.id)
    assert.deepEqual([...order(7)].sort(), question.options.map((option) => option.id).sort(), "nothing lost or duplicated")
    if (order(7).join() !== order(8).join()) changed += 1
  }
  assert.ok(changed >= withMany.length - 1, "different seeds shuffle differently")
  assert.notEqual(seedFor(1, "q01"), seedFor(1, "q02"), "each question gets its own shuffle")
})

test("options marked last stay last, whatever the seed", () => {
  let seen = 0
  for (const question of questions) {
    if (question.format === "scale" || question.format === "rank") continue
    const lastIds = question.options.filter((option) => option.last).map((option) => option.id)
    if (lastIds.length === 0) continue
    seen += 1
    for (let seed = 1; seed <= 40; seed += 1) {
      const shown = displayOptions(question.id, question.options, seed).map((option) => option.id)
      assert.deepEqual(shown.slice(shown.length - lastIds.length), lastIds, `${question.id} seed ${seed}`)
    }
  }
  assert.ok(seen > 0, "at least one question pins an option last")
})

test("rank items start in a seeded random order that is stable for a seed", () => {
  const ranks = questions.filter((question) => question.format === "rank")
  assert.ok(ranks.length > 0)
  for (const question of ranks) {
    if (question.format !== "rank") continue
    assert.deepEqual(initialRankOrder(question, 99), initialRankOrder(question, 99))
    assert.deepEqual([...initialRankOrder(question, 99)].sort(), question.options.map((option) => option.id).sort())
    const orders = new Set(Array.from({ length: 12 }, (_, seed) => initialRankOrder(question, seed + 1).join()))
    assert.ok(orders.size > 1, `${question.id} always starts in one order`)
  }
})

test("refreshing mid-quiz keeps the shuffle: the seed and the answers come back exactly as saved", () => {
  const state = { ...emptyState(undefined, 424242), started: true, responses: { q01: persona("a").q01, q02: persona("b").q02 }, step: "q:q03" }
  const { state: restored, recovery } = parseStoredState(serializeState(state))
  assert.equal(recovery, "none")
  assert.equal(restored.seed, 424242)
  assert.equal(restored.step, "q:q03")
  const question = questions.find((candidate) => candidate.format === "choice")!
  if (question.format !== "choice") return
  const before = displayOptions(question.id, question.options, state.seed).map((option) => option.id)
  const after = displayOptions(question.id, question.options, restored.seed).map((option) => option.id)
  assert.deepEqual(after, before)
})

// ───────────────────────── 4. The 28 prompts ─────────────────────────

const primaryOf = (index: number) => questions[index].primary

test("the 28 prompts, in order, never put two questions on the same dimension side by side", () => {
  assert.equal(questions.length, 28)
  const lines = questions.map((question, index) => `${String(index + 1).padStart(2, "0")} ${question.id} [${question.chapter}] ${question.prompt}`)
  assert.equal(lines.length, 28)
  for (let index = 1; index < questions.length; index += 1) {
    const here = primaryOf(index)
    const before = primaryOf(index - 1)
    if (here && before) assert.notEqual(here, before, `${questions[index - 1].id} and ${questions[index].id} are both ${here}`)
  }
})

test("no option is longer than 110 characters", () => {
  assert.equal(MAX_OPTION_LENGTH, 110)
  for (const { where, text } of bankStrings()) {
    if (!/ (prompt|hint|aria label|title|intro)$/.test(where)) assert.ok(text.length <= MAX_OPTION_LENGTH, `${where} is ${text.length} characters`)
  }
})

test("no user-facing text in the bank has an em dash or a straight quote", () => {
  for (const { where, text } of bankStrings()) {
    assert.doesNotMatch(text, /—/, where)
    assert.doesNotMatch(text, /["']/, `${where}: ${text}`)
  }
})
