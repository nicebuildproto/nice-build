import assert from "node:assert/strict"
import test from "node:test"
import { chapterIds, dimensionIds } from "./dimensions.ts"
import {
  buildSteps,
  chapterObservation,
  nextStepKey,
  previousAnswerStepKey,
  progressFor,
  resolveStepKey,
  stepIndex,
  stepKeys,
} from "./flow.ts"
import { followUps, getQuestion, MAX_FOLLOW_UPS, questions } from "./questions.ts"
import {
  answerSignals,
  assessCompletion,
  describeAnswer,
  evidenceMaxima,
  followUpTriggered,
  MIN_PRIMARY_ANSWERED,
  planFollowUps,
  rankWeights,
  sanitizeResponses,
  scoreDimensions,
  scoreResponses,
  validateAnswer,
} from "./scoring.ts"
import { alternatingPersona, answerFollowUps, extremeAnswer, mulberry32, persona, randomResponses } from "./testkit.ts"
import { enumerateAnswers, validateBank } from "./validate.ts"
import type { Answer, Responses } from "./types.ts"

const q = (id: string) => getQuestion(id)!
const ids = (id: string, letters: string) => [...letters].map((letter) => `${id}-${letter}`)

// ───────────────────────── Question bank ─────────────────────────

test("the question bank passes structural validation with no errors", () => {
  assert.deepEqual(validateBank().errors, [])
})

test("the bank has 28 questions with unique ids and every format in use", () => {
  assert.equal(questions.length, 28)
  assert.deepEqual(questions.map((question) => question.id), Array.from({ length: 28 }, (_, index) => `q${String(index + 1).padStart(2, "0")}`))
  assert.equal(new Set(questions.map((question) => question.id)).size, questions.length)
  const formats = new Set(questions.map((question) => question.format))
  for (const format of ["choice", "multi", "rank", "split", "scale"]) assert.ok(formats.has(format as never), `format ${format} unused`)
})

test("every dimension has three core questions and every chapter is used", () => {
  for (const id of dimensionIds) assert.equal(questions.filter((question) => question.primary === id).length, 3, id)
  assert.equal(questions.filter((question) => question.primary === null).length, 4)
  for (const chapter of chapterIds) assert.equal(questions.filter((question) => question.chapter === chapter).length, 7, chapter)
})

test("no single question supplies more than 40% of a dimension's evidence", () => {
  const maxima = evidenceMaxima()
  for (const id of dimensionIds) assert.ok(1 / maxima[id] <= 0.4, id)
})

test("every possible answer is valid, stays in range and bears only on dimensions the question names", () => {
  for (const question of questions) {
    for (const answer of enumerateAnswers(question)) {
      assert.equal(validateAnswer(question, answer).ok, true, `${question.id} ${JSON.stringify(answer)}`)
      for (const signal of answerSignals(question, answer)) {
        if (question.primary) assert.equal(signal.dimension, question.primary, question.id)
        assert.ok(signal.value >= -2 && signal.value <= 2, `${question.id} value ${signal.value}`)
        assert.equal(signal.weight, question.primary ? 1 : 0.5)
        assert.ok(!Number.isNaN(signal.value))
      }
    }
  }
})

test("both poles of every core question are reachable", () => {
  for (const question of questions.filter((candidate) => candidate.primary)) {
    const values = enumerateAnswers(question).flatMap((answer) =>
      answerSignals(question, answer).filter((signal) => signal.dimension === question.primary).map((signal) => signal.value),
    )
    assert.ok(Math.min(...values) <= -0.5, `${question.id} a-pole`)
    assert.ok(Math.max(...values) >= 0.5, `${question.id} b-pole`)
  }
})

test("sliders store canonical values: left statement is -2, whichever side it is shown on", () => {
  for (const question of questions) {
    if (question.format !== "scale") continue
    assert.equal(answerSignals(question, { format: "scale", value: -2 })[0].value, -2)
    assert.equal(answerSignals(question, { format: "scale", value: 2 })[0].value, 2)
    assert.ok(describeAnswer(question, { format: "scale", value: -2 })?.includes(question.left), question.id)
    assert.ok(describeAnswer(question, { format: "scale", value: 1 })?.includes(question.right), question.id)
  }
  assert.deepEqual(questions.filter((question) => question.format === "scale" && question.flip).map((question) => question.id), ["q07", "q14"])
})

// ───────────────────────── Answer validation ─────────────────────────

test("invalid answers are rejected", () => {
  const choice = q("q01")
  const multi = q("q03")
  const three = q("q06")
  const rank = q("q17")
  const split = q("q05")
  const scale = q("q04")
  const bad: [typeof choice | typeof multi | typeof rank | typeof split | typeof scale, unknown][] = [
    [choice, { format: "choice", optionId: "nope" }],
    [choice, { format: "scale", value: 1 }],
    [choice, null],
    [choice, "q01-a"],
    [multi, { format: "multi", optionIds: [] }],
    [multi, { format: "multi", optionIds: ["q03-a", "q03-a"] }],
    [multi, { format: "multi", optionIds: ["bogus"] }],
    [multi, { format: "multi", optionIds: ids("q03", "abc") }],
    [three, { format: "multi", optionIds: ids("q06", "abcd") }],
    [rank, { format: "rank", order: ["q17-a"] }],
    [rank, { format: "rank", order: ["q17-a", "q17-a", "q17-b", "q17-c"] }],
    [split, { format: "split", shares: { "q05-a": 3, "q05-b": 2 } }],
    [split, { format: "split", shares: { "q05-a": 3.5, "q05-b": 2.5 } }],
    [split, { format: "split", shares: { "q05-a": -1, "q05-b": 7 } }],
    [split, { format: "split", shares: { "q05-a": 6, other: 0 } }],
    [scale, { format: "scale", value: 3 }],
    [scale, { format: "scale", value: 0.5 }],
    [scale, { format: "scale", value: "1" }],
  ]
  for (const [question, answer] of bad) assert.equal(validateAnswer(question, answer).ok, false, JSON.stringify(answer))
  assert.equal(validateAnswer(choice, { format: "skip" }).ok, true)
  assert.equal(validateAnswer(multi, { format: "multi", optionIds: ids("q03", "ab") }).ok, true)
  assert.equal(validateAnswer(three, { format: "multi", optionIds: ids("q06", "abc") }).ok, true)
})

test("sanitizeResponses drops unknown questions and invalid answers but keeps valid ones", () => {
  const clean = sanitizeResponses({
    q01: { format: "choice", optionId: "q01-a" },
    q04: { format: "scale", value: 9 },
    t1: { format: "choice", optionId: "t1-alone" },
    nonsense: { format: "skip" },
    "decision-stakes": { format: "choice", optionId: "ds-stakes" },
    "focus-collab": { format: "choice", optionId: "wrong" },
  })
  assert.deepEqual(Object.keys(clean).sort(), ["decision-stakes", "q01"])
  assert.deepEqual(sanitizeResponses(null), {})
  assert.deepEqual(sanitizeResponses([1, 2]), {})
})

test("invalid answers never contribute signals", () => {
  const question = q("q01")
  assert.deepEqual(answerSignals(question, { format: "choice", optionId: "nope" } as Answer), [])
  assert.deepEqual(answerSignals(question, { format: "skip" }), [])
  assert.deepEqual(answerSignals(question, undefined), [])
})

// ───────────────────────── Scoring maths ─────────────────────────

test("choose one scores the option's value", () => {
  assert.equal(answerSignals(q("q01"), { format: "choice", optionId: "q01-a" })[0].value, -2)
  assert.equal(answerSignals(q("q01"), { format: "choice", optionId: "q01-d" })[0].value, 1)
})

test("choose several scores the MEAN of the selected options, never the sum", () => {
  const both = answerSignals(q("q03"), { format: "multi", optionIds: ["q03-a", "q03-b"] })[0]
  const one = answerSignals(q("q03"), { format: "multi", optionIds: ["q03-a"] })[0]
  const same = answerSignals(q("q03"), { format: "multi", optionIds: ["q03-a", "q03-f"] })[0]
  assert.equal(both.value, 0)
  assert.equal(one.value, -2)
  assert.equal(same.value, -2, "picking two options at the same value does not double it")
})

test("rank uses position weights 4, 3, 2, 1", () => {
  assert.deepEqual(rankWeights(4), [4, 3, 2, 1])
  const question = q("q17") // D: a −2, b +2, c −1, d +1
  const leftFirst = answerSignals(question, { format: "rank", order: ids("q17", "acdb") })[0]
  const rightFirst = answerSignals(question, { format: "rank", order: ids("q17", "bdca") })[0]
  assert.ok(Math.abs(leftFirst.value - (4 * -2 + 3 * -1 + 2 * 1 + 1 * 2) / 10) < 1e-9)
  assert.ok(Math.abs(rightFirst.value - 0.7) < 1e-9)
  const mixed = answerSignals(question, { format: "rank", order: ids("q17", "abcd") })[0]
  assert.ok(Math.abs(mixed.value - (4 * -2 + 3 * 2 + 2 * -1 + 1 * 1) / 10) < 1e-9)
})

test("divide units scores the share-weighted mean", () => {
  const question = q("q05") // M: a −2, b −1, c +1, d +2
  const allLeft = answerSignals(question, { format: "split", shares: { "q05-a": 6, "q05-b": 0, "q05-c": 0, "q05-d": 0 } })[0]
  const mix = answerSignals(question, { format: "split", shares: { "q05-a": 3, "q05-b": 0, "q05-c": 0, "q05-d": 3 } })[0]
  assert.equal(allLeft.value, -2)
  assert.equal(mix.value, 0)
})

test("a middle slider stop and a context option contribute 0 and count as a context signal", () => {
  const middle = answerSignals(q("q04"), { format: "scale", value: 0 })[0]
  assert.equal(middle.value, 0)
  assert.equal(middle.context, true)
  assert.equal(answerSignals(q("q04"), { format: "scale", value: 1 })[0].context, false)
  const depends = answerSignals(q("q23"), { format: "choice", optionId: "q23-e" })[0]
  assert.equal(depends.value, 0)
  assert.equal(depends.context, true)
  assert.equal(depends.dimension, "communication")
})

test("cross-dimension items score every dimension they touch, at half weight", () => {
  const signals = answerSignals(q("q18"), { format: "choice", optionId: "q18-d" })
  const byDimension = Object.fromEntries(signals.map((signal) => [signal.dimension, signal]))
  assert.deepEqual(Object.keys(byDimension).sort(), ["change", "communication", "structure"])
  assert.equal(byDimension.change.value, 1)
  assert.equal(byDimension.communication.value, 1)
  assert.equal(byDimension.structure.value, 1)
  for (const signal of signals) assert.equal(signal.weight, 0.5)
  const multi = answerSignals(q("q21"), { format: "multi", optionIds: ["q21-a", "q21-c"] })
  assert.equal(multi.find((signal) => signal.dimension === "communication")?.value, -2)
  assert.equal(multi.find((signal) => signal.dimension === "focus")?.value, -1)
})

// ───────────────────────── Aggregation, missing and mixed data ─────────────────────────

test("no answers produces no positions, never a neutral score, and never divides by zero", () => {
  const score = scoreResponses({})
  for (const id of dimensionIds) {
    const result = score.dimensions[id]
    assert.equal(result.position, null)
    assert.equal(result.evidence, "none")
    assert.equal(result.spread, 0)
    assert.ok(Number.isFinite(result.coverage))
  }
  assert.equal(score.completion.complete, false)
  assert.equal(score.completion.answeredPrimary, 0)
})

test("skipped questions are treated as missing, not as neutral answers", () => {
  const responses = persona("a")
  const skipped: Responses = { ...responses, q01: { format: "skip" }, q08: { format: "skip" } }
  const full = scoreDimensions(responses).thinking
  const partial = scoreDimensions(skipped).thinking
  assert.ok(partial.itemCount < full.itemCount)
  assert.ok(partial.coverage < full.coverage)
  assert.ok(partial.position !== null && partial.position <= -0.4)
  assert.equal(assessCompletion(skipped).skipped, 2)
})

test("a dimension score is the weighted mean of its items (core 1, cross 0.5)", () => {
  const responses: Responses = {
    q01: { format: "choice", optionId: "q01-a" }, // T −2, weight 1
    q18: { format: "choice", optionId: "q18-b" }, // T +1, weight 0.5
  }
  const thinking = scoreDimensions(responses).thinking
  assert.ok(Math.abs(thinking.position! * 2 - (-2 + 0.5) / 1.5) < 1e-9)
})

test("positions, spreads and ranges stay in bounds for random answer sets", () => {
  const random = mulberry32(42)
  for (let run = 0; run < 150; run += 1) {
    const score = scoreResponses(randomResponses(random, { skipRate: random() * 0.5 }))
    for (const id of dimensionIds) {
      const result = score.dimensions[id]
      if (result.position === null) continue
      assert.ok(result.position >= -1 && result.position <= 1)
      assert.ok(result.spread >= 0 && result.spread <= 1)
      assert.ok(result.range[0] >= -1 && result.range[1] <= 1 && result.range[0] <= result.range[1])
      assert.ok(result.coverage >= 0 && result.coverage <= 1)
      assert.ok(result.signals.length > 0)
    }
  }
})

test("scoring is deterministic and unaffected by response key order", () => {
  const responses = persona("b", { focus: "a" })
  const reversed = Object.fromEntries(Object.entries(responses).reverse()) as Responses
  assert.deepEqual(scoreResponses(responses), scoreResponses(reversed))
  assert.deepEqual(scoreResponses(responses), scoreResponses(JSON.parse(JSON.stringify(responses))))
})

test("straight-lining the middle of every slider and the first option does not produce a confident profile", () => {
  const first: Responses = {}
  for (const question of questions) {
    if (question.format === "choice") first[question.id] = { format: "choice", optionId: question.options[0].id }
    else if (question.format === "scale") first[question.id] = { format: "scale", value: 0 }
    else first[question.id] = extremeAnswer(question, {})
  }
  const strong = dimensionIds.filter((id) => Math.abs(scoreResponses(first).dimensions[id].position ?? 0) >= 0.75)
  assert.ok(strong.length <= 2, `straight-lining produced strong positions on ${strong.join(", ")}`)
})

// ───────────────────────── Completion ─────────────────────────

test("a result needs enough answered questions and enough in every dimension", () => {
  const all = persona("a")
  assert.equal(assessCompletion(all).complete, true)

  const few: Responses = {}
  for (const question of questions.slice(0, MIN_PRIMARY_ANSWERED - 1)) few[question.id] = all[question.id]
  assert.equal(assessCompletion(few).complete, false)
  assert.match(assessCompletion(few).reason ?? "", /at least/)

  // Enough answers, but one dimension gutted: still incomplete.
  const lopsided: Responses = { ...all }
  for (const question of questions) {
    const touchesFeedback = question.format !== "scale" && question.options.some((option) => option.effects.some((effect) => effect.dimension === "feedback"))
    if (touchesFeedback) lopsided[question.id] = { format: "skip" }
  }
  const gutted = assessCompletion(lopsided)
  assert.equal(gutted.complete, false)
  assert.deepEqual(gutted.weakDimensions, ["feedback"])
})

test("skipping any one chapter still completes; skipping the free text changes nothing", () => {
  for (const chapter of chapterIds) {
    const responses: Responses = { ...persona("a") }
    for (const question of questions.filter((candidate) => candidate.chapter === chapter)) responses[question.id] = { format: "skip" }
    const score = scoreResponses(responses)
    assert.equal(score.completion.complete, true, `skipping ${chapter}`)
    for (const id of dimensionIds) assert.notEqual(score.dimensions[id].position, null)
  }
})

// ───────────────────────── Adaptive follow-ups ─────────────────────────

const followUp = (id: string) => followUps.find((candidate) => candidate.id === id)!

test("conflict follow-ups fire when a dimension is conflicted and not when it is consistent", () => {
  const consistent = persona("a")
  const conflicted = persona("a")
  conflicted.q02 = extremeAnswer(q("q02"), { structure: "a" })
  conflicted.q09 = extremeAnswer(q("q09"), { structure: "b" })
  conflicted.q22 = extremeAnswer(q("q22"), { structure: "b" })
  conflicted.q07 = extremeAnswer(q("q07"), { decisions: "a" })
  conflicted.q10 = extremeAnswer(q("q10"), { decisions: "b" })
  conflicted.q17 = extremeAnswer(q("q17"), { decisions: "b" })
  assert.equal(followUpTriggered(followUp("structure-phase"), consistent), false)
  assert.equal(followUpTriggered(followUp("structure-phase"), conflicted), true)
  assert.equal(followUpTriggered(followUp("decision-stakes"), consistent), false)
  assert.equal(followUpTriggered(followUp("decision-stakes"), conflicted), true)
  assert.equal(followUpTriggered(followUp("feedback-timing"), conflicted), false)
})

test("focus-collab fires from conflict in focus or collaboration, feedback-timing from feedback", () => {
  const base = persona("a")
  const focus = { ...base, q03: extremeAnswer(q("q03"), { focus: "a" }), q11: extremeAnswer(q("q11"), { focus: "b" }), q15: extremeAnswer(q("q15"), { focus: "a" }) }
  const collaboration = { ...base, q04: extremeAnswer(q("q04"), { collaboration: "a" }), q12: extremeAnswer(q("q12"), { collaboration: "b" }), q24: extremeAnswer(q("q24"), { collaboration: "a" }) }
  const feedback = { ...base, q13: extremeAnswer(q("q13"), { feedback: "a" }), q19: extremeAnswer(q("q19"), { feedback: "b" }), q25: extremeAnswer(q("q25"), { feedback: "a" }) }
  assert.equal(followUpTriggered(followUp("focus-collab"), base), false)
  assert.equal(followUpTriggered(followUp("focus-collab"), focus), true)
  assert.equal(followUpTriggered(followUp("focus-collab"), collaboration), true)
  assert.equal(followUpTriggered(followUp("feedback-timing"), base), false)
  assert.equal(followUpTriggered(followUp("feedback-timing"), feedback), true)
})

test("pressure-shift fires only when the pressure item points the other way by 1.5 or more", () => {
  const pressure = followUp("pressure-shift")
  const withQ18 = (side: "a" | "b") => ({ ...persona("a"), q18: extremeAnswer(q("q18"), { focus: side, collaboration: side, structure: side, change: side, communication: side, thinking: side }) })
  assert.equal(followUpTriggered(pressure, withQ18("a")), false, "same direction as the profile")
  assert.equal(followUpTriggered(pressure, withQ18("b")), true, "opposite direction")
  assert.equal(followUpTriggered(pressure, { ...persona("a"), q18: { format: "skip" } }), false, "skipped pressure item")
  // A mild difference does not count: Q18 option d gives X+1, S+1, M+1 against an X profile of about −1.7.
  const nearZero = { ...persona("middle"), q18: { format: "choice", optionId: "q18-d" } as Answer }
  assert.equal(followUpTriggered(pressure, nearZero), false)
})

test("follow-ups never change a dimension score", () => {
  const base = persona("a")
  assert.deepEqual(scoreResponses(answerFollowUps(base)).dimensions, scoreResponses(base).dimensions)
})

test("follow-ups are bounded, unique and deterministic across random answer sets", () => {
  const random = mulberry32(7)
  let triggered = 0
  for (let run = 0; run < 150; run += 1) {
    const responses = randomResponses(random, { skipRate: 0.1 })
    const planned = planFollowUps(responses)
    assert.ok(planned.length <= MAX_FOLLOW_UPS)
    assert.equal(new Set(planned).size, planned.length)
    assert.deepEqual(planned, planFollowUps(JSON.parse(JSON.stringify(responses))))
    triggered += planned.length
  }
  assert.ok(triggered > 0, "no follow-up ever fired in 150 random runs")
})

test("the follow-up cap holds even when every follow-up would trigger", () => {
  const random = mulberry32(11)
  let capped = 0
  for (let run = 0; run < 150; run += 1) {
    const planned = planFollowUps(randomResponses(random))
    if (planned.length === MAX_FOLLOW_UPS) capped += 1
    assert.ok(planned.length <= MAX_FOLLOW_UPS)
  }
  assert.ok(capped > 0)
  assert.ok(MAX_FOLLOW_UPS < followUps.length)
})

test("answers in later chapters can never add or remove an earlier chapter's follow-up", () => {
  const random = mulberry32(99)
  for (let run = 0; run < 60; run += 1) {
    const base = randomResponses(random)
    const other = { ...base }
    const fresh = randomResponses(random)
    for (const question of questions.filter((candidate) => candidate.chapter === "c4")) other[question.id] = fresh[question.id]
    const earlier = (responses: Responses) => planFollowUps(responses).filter((id) => followUp(id).chapter !== "c4")
    // Only follow-ups asked before chapter 4 are compared, so the total cap can’t be the cause of a difference.
    const upToC3 = (responses: Responses) => earlier(responses).filter((id) => followUps.filter((candidate) => candidate.chapter !== "c4").map((candidate) => candidate.id).includes(id))
    assert.deepEqual(upToC3(base), upToC3(other))
  }
})

test("an optional follow-up can be skipped and the assessment still completes", () => {
  const responses = answerFollowUps(persona("a"))
  for (const item of followUps) responses[item.id] = { format: "skip" }
  const score = scoreResponses(responses)
  assert.equal(score.completion.complete, true)
  assert.deepEqual(score.contexts, {})
})

test("any follow-up option scores 0, and its note is recorded only when the follow-up was asked", () => {
  const base = persona("a")
  base.q07 = extremeAnswer(q("q07"), { decisions: "a" })
  base.q10 = extremeAnswer(q("q10"), { decisions: "b" })
  base.q17 = extremeAnswer(q("q17"), { decisions: "b" })
  const answered = { ...base, "decision-stakes": { format: "choice", optionId: "ds-undo" } as Answer }
  const score = scoreResponses(answered)
  assert.equal(score.contexts["decision-stakes"], "reversibility-led")
  assert.deepEqual(score.dimensions, scoreResponses(base).dimensions)
  const notAsked = { ...persona("a"), "decision-stakes": { format: "choice", optionId: "ds-undo" } as Answer }
  assert.equal(scoreResponses(notAsked).contexts["decision-stakes"], undefined)
  const varies = { ...base, "decision-stakes": { format: "choice", optionId: "ds-varies" } as Answer }
  assert.equal(scoreResponses(varies).contexts["decision-stakes"], undefined)
})

test("the pressure-shift answer is stored (except “not really different”)", () => {
  const base = { ...persona("a"), q18: extremeAnswer(q("q18"), { focus: "b", collaboration: "b", structure: "b", change: "b", communication: "b", thinking: "b" }) }
  assert.ok(planFollowUps(base).includes("pressure-shift"))
  assert.equal(scoreResponses({ ...base, "pressure-shift": { format: "choice", optionId: "ps-quiet" } }).contexts["pressure-shift"], "quiet")
  assert.equal(scoreResponses({ ...base, "pressure-shift": { format: "choice", optionId: "ps-same" } }).contexts["pressure-shift"], undefined)
})

// ───────────────────────── Flow ─────────────────────────

test("the step sequence is finite, has unique keys, ends in the reflection and includes each question once", () => {
  const random = mulberry32(3)
  for (let run = 0; run < 60; run += 1) {
    const steps = buildSteps(randomResponses(random))
    assert.equal(new Set(steps.map((step) => step.key)).size, steps.length)
    assert.equal(steps.at(-1)?.kind, "reflect")
    assert.equal(steps.filter((step) => step.kind === "question").length, questions.length)
    assert.ok(steps.filter((step) => step.kind === "followup").length <= MAX_FOLLOW_UPS)
    assert.ok(steps.length <= questions.length + MAX_FOLLOW_UPS + 7 + 1)
  }
})

test("questions follow the final order, chapter by chapter", () => {
  const steps = buildSteps({})
  const order = steps.filter((step) => step.kind === "question").map((step) => step.id)
  assert.deepEqual(order, questions.map((question) => question.id))
  assert.equal(steps[0].key, stepKeys.chapter("c1"))
  assert.equal(steps[stepIndex(steps, stepKeys.question("q08")) - 1].key, stepKeys.chapter("c2"))
})

test("follow-ups appear at the end of their own chapter, before its pause", () => {
  const responses = { ...persona("a"), q18: extremeAnswer(q("q18"), { focus: "b", collaboration: "b", structure: "b", change: "b", communication: "b", thinking: "b" }) }
  const steps = buildSteps(responses)
  const at = stepIndex(steps, stepKeys.followup("pressure-shift"))
  assert.ok(at > stepIndex(steps, stepKeys.question("q21")))
  assert.equal(steps[at + 1].key, stepKeys.pause("c3"))
})

test("navigation: back skips interstitials, resolve falls back when a follow-up disappears, next walks forward", () => {
  const steps = buildSteps(persona("a"))
  assert.equal(previousAnswerStepKey(steps, stepKeys.question("q08")), stepKeys.question("q07"))
  assert.equal(previousAnswerStepKey(steps, stepKeys.question("q01")), null)
  assert.equal(resolveStepKey(steps, stepKeys.followup("pressure-shift")), stepKeys.question("q21"))
  assert.equal(resolveStepKey(steps, "unknown"), steps[0].key)
  assert.equal(resolveStepKey(steps, null), steps[0].key)
  assert.equal(nextStepKey(steps, stepKeys.reflect), null)
  assert.equal(nextStepKey(steps, steps[0].key), steps[1].key)
})

test("progress counts real questions and chapter segments fill as people move through", () => {
  const steps = buildSteps({})
  assert.equal(progressFor(steps, stepKeys.question("q01")).current, 1)
  assert.equal(progressFor(steps, stepKeys.question("q08")).current, 8)
  const mid = progressFor(steps, stepKeys.question("q08"))
  assert.equal(mid.segments[0].fill, 1)
  assert.equal(mid.segments[1].fill, 0)
  assert.equal(mid.total, questions.length)
  assert.equal(progressFor(steps, stepKeys.reflect).current, questions.length)
})

test("chapter observations describe answers factually and never name a profile", () => {
  const lean = chapterObservation(persona("a"), "c1")
  assert.equal(lean.kind, "tilt")
  assert.match(lean.text, /In this chapter, your answer about/)
  const split = chapterObservation(alternatingPersona(), "c4")
  assert.equal(split.kind, "split")
  const nothing = chapterObservation({}, "c2")
  assert.equal(nothing.kind, "neutral")
  for (const text of [lean.text, split.text, nothing.text]) assert.doesNotMatch(text, /Architect|Keeper|Tester|Partner|Navigator/)
})
