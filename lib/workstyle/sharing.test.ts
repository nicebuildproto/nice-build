import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { stripShareCodes } from "./analytics.ts"
import { renderAudit, renderQuestionsExport } from "./audit.ts"
import { dimensionIds } from "./dimensions.ts"
import { buildProfile } from "./profile.ts"
import {
  completeState,
  emptyState,
  isValidSummary,
  MAX_EDIT_LENGTH,
  parseStoredState,
  readResult,
  serializeState,
  STORAGE_KEY,
} from "./persistence.ts"
import { ASSESSMENT_VERSION, followUps, getQuestion, questions, recordsNote } from "./questions.ts"
import { scoreResponses, toProfileSummary } from "./scoring.ts"
import { cardPath, comparePath, decodeShare, encodeShare, profilePath, sanitizeName, shareText } from "./share.ts"
import { answerFollowUps, extremeAnswer, mulberry32, persona, randomResponses } from "./testkit.ts"
import type { ProfileSummary } from "./types.ts"

const summaryFor = (responses = persona("a"), options: Parameters<typeof toProfileSummary>[1] = {}) =>
  toProfileSummary(scoreResponses(responses), options)

// ───────────────────────── Share codes ─────────────────────────

test("share codes round-trip exactly, for many different profiles", () => {
  const random = mulberry32(11)
  for (let run = 0; run < 300; run += 1) {
    const score = scoreResponses(answerFollowUps(randomResponses(random, { skipRate: 0.1 })))
    const summary = toProfileSummary(score, { name: run % 3 === 0 ? "Zoë Müller" : undefined })
    const decoded = decodeShare(encodeShare(summary))
    assert.equal(decoded.ok, true)
    // The pressure-shift note is private: it stays on the device and is never part of a code.
    const shareable = { ...summary.contexts }
    delete shareable["pressure-shift"]
    if (decoded.ok) assert.deepEqual(decoded.summary, { ...summary, contexts: shareable })
  }
})

test("a share code carries only the chosen dimensions: left-out ones are absent, not hidden", () => {
  const full = summaryFor(persona("a"))
  const chosen = toProfileSummary(scoreResponses(persona("a")), { include: ["thinking", "focus", "change"] })
  const code = encodeShare(chosen)
  const decoded = decodeShare(code)
  assert.equal(decoded.ok, true)
  if (!decoded.ok) return
  for (const id of dimensionIds) assert.equal(decoded.summary.dimensions[id] === null, !["thinking", "focus", "change"].includes(id))
  assert.ok(code.length < encodeShare(full).length)

  // Two people who differ ONLY in a dimension they both left out produce identical codes.
  const first = toProfileSummary(scoreResponses(persona("a", { feedback: "a" })), { include: ["thinking", "focus", "change"] })
  const second = toProfileSummary(scoreResponses(persona("a", { feedback: "b" })), { include: ["thinking", "focus", "change"] })
  assert.equal(encodeShare(first), encodeShare(second))
})

test("a share code never contains answers, question ids or option ids", () => {
  const summary = summaryFor(answerFollowUps(persona("a")), { name: "Ana" })
  const code = encodeShare(summary)
  assert.ok(code.length <= 60, `code is ${code.length} chars`)
  assert.match(code, /^[A-Za-z0-9_-]+$/)
  const decoded = decodeShare(code)
  assert.equal(decoded.ok, true)
  if (!decoded.ok) return
  const json = JSON.stringify(decoded.summary)
  for (const question of questions) assert.ok(!json.includes(question.id + '"'))
  assert.deepEqual(Object.keys(decoded.summary).sort(), ["contexts", "dimensions", "name", "scoringVersion"])
})

test("the pressure-shift note never travels in a share code", () => {
  const responses = answerFollowUps({ ...persona("a"), q18: extremeAnswer(getQuestion("q18")!, { focus: "b", collaboration: "b", structure: "b", change: "b", communication: "b", thinking: "b" }) })
  const summary = toProfileSummary(scoreResponses(responses))
  assert.equal(summary.contexts["pressure-shift"], "tighten")
  const decoded = decodeShare(encodeShare(summary))
  assert.equal(decoded.ok, true)
  if (decoded.ok) assert.equal(decoded.summary.contexts["pressure-shift"], undefined)
})

test("every follow-up context with a note survives the round trip, including the fourth option of focus-collab", () => {
  for (const followUp of followUps.filter((candidate) => !candidate.private)) {
    for (const option of followUp.options.filter((candidate) => recordsNote(candidate.context))) {
      const summary: ProfileSummary = { ...summaryFor(), contexts: { [followUp.id]: option.context } }
      const decoded = decodeShare(encodeShare(summary))
      assert.equal(decoded.ok && decoded.summary.contexts[followUp.id], option.context, `${followUp.id} ${option.context}`)
      assert.equal(decoded.ok && Object.keys(decoded.summary.contexts).length, 1, `${followUp.id} ${option.context} leaks into another follow-up`)
    }
  }
})

test("the “depends on context” count survives the round trip", () => {
  const summary = summaryFor()
  summary.dimensions.communication = { ...summary.dimensions.communication!, context: 2 }
  const decoded = decodeShare(encodeShare(summary))
  assert.equal(decoded.ok && decoded.summary.dimensions.communication?.context, 2)
  assert.equal(decoded.ok && decoded.summary.dimensions.thinking?.context, undefined)
})

test("follow-up contexts only travel when the dimensions they describe are shared", () => {
  const focusConflict = persona("a")
  focusConflict.q03 = extremeAnswer(getQuestion("q03")!, { focus: "a" })
  focusConflict.q11 = extremeAnswer(getQuestion("q11")!, { focus: "b" })
  focusConflict.q15 = extremeAnswer(getQuestion("q15")!, { focus: "a" })
  const responses = answerFollowUps(focusConflict)
  const full = toProfileSummary(scoreResponses(responses))
  assert.equal(full.contexts["focus-collab"], "alone-then-together")
  const partial = toProfileSummary(scoreResponses(responses), { include: ["focus", "thinking", "change", "structure"] })
  assert.equal(partial.contexts["focus-collab"], undefined)
})

test("tampered, truncated and malformed codes are rejected without throwing", () => {
  const code = encodeShare(summaryFor())
  const flip = (index: number) => code.slice(0, index) + (code[index] === "A" ? "B" : "A") + code.slice(index + 1)
  const bad = [
    "", "x", "!!!", "<script>", flip(3), flip(10), code.slice(0, -2), code + "AAAA", code.slice(1), "A".repeat(300),
    "AQEA", `${code}%20`, "../../etc/passwd",
  ]
  for (const candidate of bad) {
    const result = decodeShare(candidate)
    assert.equal(result.ok, false, candidate)
    if (!result.ok) assert.ok(result.reason.length > 10)
  }
})

test("names are sanitised and capped, and survive encoding", () => {
  assert.equal(sanitizeName("  Sam   <b>Lee</b>  "), "Sam b Lee /b")
  assert.equal(sanitizeName("a".repeat(200))?.length, 40)
  assert.equal(sanitizeName("\u0000\u0007"), undefined)
  assert.equal(sanitizeName(""), undefined)
  const summary = summaryFor(persona("a"), { name: "Zoë 山田" })
  const decoded = decodeShare(encodeShare(summary))
  assert.equal(decoded.ok && decoded.summary.name, "Zoë 山田")
})

test("a decoded profile builds exactly the same headline and dimensions as the original", () => {
  const summary = summaryFor(persona("b", { focus: "a" }))
  const original = buildProfile(summary)
  const decoded = decodeShare(encodeShare(summary))
  assert.equal(decoded.ok, true)
  if (!decoded.ok) return
  const rebuilt = buildProfile(decoded.summary)
  assert.deepEqual(rebuilt, original)
})

test("paths and share text contain no personal data beyond the chosen name and code", () => {
  const code = encodeShare(summaryFor())
  assert.equal(profilePath(code), `/how-i-work/p/${code}`)
  assert.equal(cardPath(code), `/how-i-work/p/${code}/card`)
  assert.equal(cardPath(code, "square"), `/how-i-work/p/${code}/card?format=square`)
  assert.equal(comparePath(code), `/how-i-work/compare/${code}`)
  const text = shareText({ title: "The Quiet Architect", statement: "You think it through.", url: "https://example.com/x", name: "Ana" })
  assert.match(text, /^Ana’s work style: The Quiet Architect/)
  assert.doesNotMatch(text, /\?/)
  const invite = shareText({ title: "A", statement: "B", url: "https://example.com/x", invite: true })
  assert.match(invite, /compare/)
})

// ───────────────────────── Persistence ─────────────────────────

test("a fresh, empty state is returned when nothing is stored", () => {
  const { state, recovery } = parseStoredState(null)
  assert.equal(recovery, "none")
  assert.deepEqual(state.responses, {})
  assert.equal(state.started, false)
  assert.equal(readResult(state), null)
})

test("saved progress survives a serialise/parse round-trip", () => {
  const state = { ...emptyState(), responses: persona("a"), step: "q:q08", started: true, name: "Ana", reflection: "Mornings", guideEdits: { focus: "Mine." } }
  const { state: restored, recovery } = parseStoredState(serializeState(state))
  assert.equal(recovery, "none")
  assert.deepEqual(restored.responses, state.responses)
  assert.equal(restored.step, "q:q08")
  assert.equal(restored.name, "Ana")
  assert.equal(restored.guideEdits.focus, "Mine.")
})

test("corrupt, wrong-version and hostile stored data is repaired rather than trusted", () => {
  for (const raw of ["{not json", "[]", "null", `{"v":2}`, "42"]) {
    const { state, recovery } = parseStoredState(raw)
    assert.equal(recovery, "corrupt", raw)
    assert.deepEqual(state.responses, {})
  }
  const hostile = JSON.stringify({
    v: 1,
    bank: ASSESSMENT_VERSION,
    responses: { q01: { format: "choice", optionId: "q01-a" }, q04: { format: "scale", value: 99 }, __proto__: { x: 1 }, ghost: { format: "skip" } },
    step: 5,
    name: "<img src=x onerror=alert(1)>",
    shareDimensions: ["thinking", "bogus"],
    guideEdits: { focus: "x".repeat(5000), other: 7, empty: "   " },
    pendingCompare: "x".repeat(900),
    summary: { scoringVersion: 1, dimensions: { thinking: { position: 9, spread: 0, evidence: "good" } }, contexts: {} },
  })
  const { state } = parseStoredState(hostile)
  assert.deepEqual(Object.keys(state.responses), ["q01"])
  assert.equal(state.step, null)
  assert.doesNotMatch(state.name, /[<>]/)
  assert.deepEqual(state.shareDimensions, ["thinking"])
  assert.equal(state.guideEdits.focus.length, MAX_EDIT_LENGTH)
  assert.equal("other" in state.guideEdits, false)
  assert.equal("empty" in state.guideEdits, false)
  assert.equal(state.pendingCompare, null)
  assert.equal(state.summary, null, "an out-of-range summary snapshot is discarded")
})

test("progress from an older bank version is not carried over: it is flagged as migrated and starts fresh", () => {
  const raw = JSON.stringify({ ...emptyState(), bank: "2026.1", responses: { t1: { format: "choice", optionId: "t1-alone" }, ...persona("a") }, reflection: "Old words", guideEdits: { focus: "Old edit" }, finished: true, step: "q:s1", completedAt: "2026-01-01" })
  const { state, recovery } = parseStoredState(raw)
  assert.equal(recovery, "migrated")
  assert.deepEqual(state.responses, {})
  assert.equal(state.started, false)
  assert.equal(state.finished, false)
  assert.equal(state.step, null)
  assert.equal(state.summary, null)
  assert.equal(state.reflection, "")
  assert.deepEqual(state.guideEdits, {})
})

test("the option-order seed is saved with the session, survives a refresh and is replaced on retake", () => {
  const first = emptyState(undefined, 12345)
  const { state } = parseStoredState(serializeState(first))
  assert.equal(state.seed, 12345)
  assert.notEqual(emptyState().seed, emptyState().seed)
  // A damaged seed is replaced rather than trusted.
  const damaged = JSON.parse(serializeState(first))
  damaged.seed = "abc"
  assert.equal(typeof parseStoredState(JSON.stringify(damaged)).state.seed, "number")
})

test("the free-text answer is capped at 400 characters when restored", () => {
  const long = { ...emptyState(), reflection: "x".repeat(900) }
  assert.equal(parseStoredState(serializeState(long)).state.reflection.length, 400)
})

test("results exist only after valid completion", () => {
  const partial = { ...emptyState(), responses: { q01: persona("a").q01 }, started: true, finished: true }
  assert.equal(readResult(partial), null)
  assert.equal(completeState(partial).finished, false)
  assert.equal(completeState(partial).summary, null)

  const complete = completeState({ ...emptyState(), responses: persona("a"), started: true })
  assert.equal(complete.finished, true)
  assert.ok(complete.summary)
  assert.ok(readResult(complete))

  // Finished flag set by hand with too few answers is still refused.
  assert.equal(readResult({ ...complete, responses: { q01: persona("a").q01 } }), null)
  // And not finished means no result even with every answer.
  assert.equal(readResult({ ...complete, finished: false }), null)
})

test("a saved result keeps its snapshot summary and is identical when the page is reopened", () => {
  const complete = completeState({ ...emptyState(), responses: persona("b"), started: true }, "2026-10-17T00:00:00.000Z")
  const { state } = parseStoredState(serializeState(complete))
  const result = readResult(state)
  assert.ok(result)
  assert.equal(result.completedAt, "2026-10-17T00:00:00.000Z")
  assert.deepEqual(result.summary, complete.summary)
  assert.ok(isValidSummary(result.summary))
  assert.equal(STORAGE_KEY, "ws.state.v1")
})

test("completion is stamped once and not moved by later edits", () => {
  const first = completeState({ ...emptyState(), responses: persona("a"), started: true }, "2026-01-01T00:00:00.000Z")
  const again = completeState({ ...first, guideEdits: { focus: "x" } }, "2026-06-01T00:00:00.000Z")
  assert.equal(again.completedAt, "2026-01-01T00:00:00.000Z")
})

test("summary validation rejects malformed snapshots", () => {
  const ok = summaryFor()
  assert.equal(isValidSummary(ok), true)
  assert.equal(isValidSummary({ ...ok, scoringVersion: 99 }), false)
  assert.equal(isValidSummary({ ...ok, contexts: undefined } as unknown as ProfileSummary), false)
  assert.equal(isValidSummary({ ...ok, dimensions: { ...ok.dimensions, focus: { position: 0, spread: 0, evidence: "perfect" } } } as unknown as ProfileSummary), false)
})

// ───────────────────────── Documentation drift ─────────────────────────

test("docs/workstyle/question-bank-audit.md is up to date with the question bank", () => {
  const file = fileURLToPath(new URL("../../docs/workstyle/question-bank-audit.md", import.meta.url))
  assert.equal(readFileSync(file, "utf8"), renderAudit(), "run `npm run workstyle:audit` and commit the result")
})

test("docs/workstyle/questions-and-responses.txt is up to date with the question bank", () => {
  const file = fileURLToPath(new URL("../../docs/workstyle/questions-and-responses.txt", import.meta.url))
  assert.equal(readFileSync(file, "utf8"), renderQuestionsExport(), "run `npm run workstyle:audit` and commit the result")
})

// ───────────────────────── Analytics hygiene ─────────────────────────

test("analytics events never carry a share code, query string or hash from the product paths", () => {
  const code = encodeShare(summaryFor())
  const origin = "https://example.com"
  const cases: [string, string][] = [
    [`${origin}/how-i-work/p/${code}`, `${origin}/how-i-work/p/[code]`],
    [`${origin}/how-i-work/p/${code}/card?format=square`, `${origin}/how-i-work/p/[code]/card`],
    [`${origin}/how-i-work/compare/${code}#x`, `${origin}/how-i-work/compare/[code]`],
    [`${origin}/how-i-work/result?utm=1`, `${origin}/how-i-work/result`],
    [`${origin}/how-i-work`, `${origin}/how-i-work`],
  ]
  for (const [input, expected] of cases) {
    const result = stripShareCodes({ type: "pageview", url: input })
    assert.equal(result?.url, expected)
    assert.ok(!result?.url.includes(code))
  }
  // Other parts of the site are untouched.
  const other = { type: "pageview", url: `${origin}/calculators/percentage-calculator?x=1` }
  assert.deepEqual(stripShareCodes(other), other)
  assert.equal(stripShareCodes({ url: "not a url" }), null)
})
