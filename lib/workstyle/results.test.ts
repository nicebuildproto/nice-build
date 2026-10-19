import assert from "node:assert/strict"
import test from "node:test"
import { PDFDocument } from "pdf-lib"
import { compareProfiles } from "./compare.ts"
import { dimensionContent } from "./content/dimensions.ts"
import { identities } from "./content/identities.ts"
import { dimensionIds, dimensions } from "./dimensions.ts"
import { buildExportModel, guideToText, profileToMarkdown } from "./export/model.ts"
import { buildGuidePdf, pdfSafe } from "./export/pdf.ts"
import { buildProfile, applyGuideEdits, CONTEXT_LABEL, FLEXIBLE_LABEL, type Profile } from "./profile.ts"
import { inVoice, profileInVoice } from "./voice.ts"
import { SCORING_VERSION, scoreResponses, toProfileSummary } from "./scoring.ts"
import { blendSignatureInput, buildSignature, emptySignatureInput, radiusFor, signatureSvg, SIGNATURE_RADIUS } from "./signature.ts"
import { alternatingPersona, answerFollowUps, mulberry32, persona, randomResponses } from "./testkit.ts"
import { getQuestion } from "./questions.ts"
import { extremeAnswer } from "./testkit.ts"
import type { ProfileSummary, Responses } from "./types.ts"

const profileFor = (responses: Responses, name?: string) => buildProfile(toProfileSummary(scoreResponses(responses), { name }))

function allStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value)
  else if (Array.isArray(value)) for (const item of value) allStrings(item, out)
  else if (value && typeof value === "object") for (const item of Object.values(value)) allStrings(item, out)
  return out
}

// ───────────────────────── Headline and patterns ─────────────────────────

test("the same answers always produce the same structured profile", () => {
  const responses = persona("b", { focus: "a", collaboration: "a" })
  const first = profileFor(responses)
  assert.deepEqual(first, profileFor(JSON.parse(JSON.stringify(responses))))
  assert.deepEqual(first, buildProfile(JSON.parse(JSON.stringify(first.summary))))
})

test("different answer patterns produce different headlines, not one outcome for everyone", () => {
  const ids = new Set<string>()
  for (let mask = 0; mask < 256; mask += 4) {
    const overrides: Record<string, "a" | "b"> = {}
    dimensionIds.forEach((id, index) => (overrides[id] = mask & (1 << index) ? "b" : "a"))
    ids.add(profileFor(persona("a", overrides)).headline.id)
  }
  assert.ok(ids.size >= 8, `only ${ids.size} distinct headlines`)
})

test("each named identity is reachable from a matching persona and is chosen alone when evidence is clear", () => {
  for (const identity of identities) {
    const overrides: Record<string, "a" | "b" | "middle"> = {}
    for (const { dimension, side } of identity.wants) overrides[dimension] = side
    const profile = profileFor(persona("middle", overrides))
    assert.ok(profile.headline.id.includes(identity.id), `${identity.id} → ${profile.headline.id}`)
    assert.ok(["identity", "hybrid"].includes(profile.headline.kind))
  }
})

test("mixed evidence is not forced into a type: alternating answers give a context-led or composed headline", () => {
  const profile = profileFor(alternatingPersona())
  assert.ok(["context", "composed"].includes(profile.headline.kind), profile.headline.kind)
  assert.ok(Object.values(profile.dimensions).some((view) => view?.kind === "mixed"))
  for (const view of Object.values(profile.dimensions)) {
    if (view?.kind === "mixed") assert.ok(view.rangeNote, "mixed dimensions explain themselves")
  }
})

const flatSummary = (): ProfileSummary => ({
  scoringVersion: SCORING_VERSION,
  dimensions: Object.fromEntries(dimensionIds.map((id) => [id, { position: 0, spread: 0.2, evidence: "good" as const }])) as ProfileSummary["dimensions"],
  contexts: {},
})

test("a dimension in the middle never gets a pole label as its reading", () => {
  const profile = buildProfile(flatSummary())
  for (const id of dimensionIds) {
    const view = profile.dimensions[id]!
    assert.equal(view.band, "middle")
    assert.equal(view.state, "flexible")
    assert.equal(view.label, FLEXIBLE_LABEL)
  }
})

test("the four states read differently: lean left, lean right, flexible, depends on context", () => {
  const summary = flatSummary()
  summary.dimensions.thinking = { position: -0.9, spread: 0.2, evidence: "good" }
  summary.dimensions.structure = { position: 0.9, spread: 0.2, evidence: "good" }
  summary.dimensions.decisions = { position: 0.02, spread: 0.2, evidence: "good" }
  summary.dimensions.focus = { position: 0.02, spread: 0.9, evidence: "some" }
  summary.dimensions.communication = { position: 0.3, spread: 0.2, evidence: "good" }
  summary.dimensions.collaboration = { position: 0.02, spread: 0.2, evidence: "good", context: 2 }
  summary.dimensions.change = { position: 0.1, spread: 0.4, evidence: "good" }
  const profile = buildProfile(summary)
  const states = Object.fromEntries(dimensionIds.map((id) => [id, profile.dimensions[id]!.state]))
  assert.deepEqual(states, {
    thinking: "lean-a",
    structure: "lean-b",
    decisions: "flexible",
    focus: "context",
    communication: "lean-b",
    collaboration: "context",
    change: "flexible",
    feedback: "flexible",
  })
  assert.equal(profile.dimensions.thinking!.label, dimensions.thinking.a.label)
  assert.equal(profile.dimensions.structure!.label, dimensions.structure.b.label)
  assert.equal(profile.dimensions.focus!.label, CONTEXT_LABEL)
  assert.match(profile.dimensions.decisions!.strengthNote, /middle/)
  assert.match(profile.dimensions.focus!.strengthNote, /depends|different directions/)
  assert.ok(profile.dimensions.focus!.rangeNote)
  assert.equal(profile.dimensions.communication!.intensity, "slight", "a mild lean")
  assert.equal(profile.dimensions.thinking!.intensity, "strong")
})

test("patterns appear only when every dimension they mention leans the stated way", () => {
  const profile = profileFor(persona("middle", { focus: "a", collaboration: "b" }))
  assert.ok(profile.patterns.some((pattern) => pattern.id === "together-with-room-to-be-alone"))
  const flat = profileFor(persona("middle"))
  assert.equal(flat.patterns.length, 0)
  const opposite = profileFor(persona("middle", { focus: "b", collaboration: "b" }))
  assert.ok(!opposite.patterns.some((pattern) => pattern.id === "together-with-room-to-be-alone"))
  assert.ok(profile.patterns.length <= 3)
})

test("a context-only pattern appears only after the person says so in the follow-up", () => {
  const base = persona("a")
  const withContext = scoreResponses({ ...base, "structure-phase": { format: "choice", optionId: "sp-open-precise" } })
  assert.equal(buildProfile(toProfileSummary(withContext)).patterns.some((pattern) => pattern.id === "open-then-precise"), false)

  // Make structure conflict so the follow-up is asked, then answer it.
  const conflicted = persona("a")
  conflicted.q02 = extremeAnswer(getQuestion("q02")!, { structure: "a" })
  conflicted.q09 = extremeAnswer(getQuestion("q09")!, { structure: "b" })
  conflicted.q22 = extremeAnswer(getQuestion("q22")!, { structure: "b" })
  const answered = scoreResponses({ ...conflicted, "structure-phase": { format: "choice", optionId: "sp-open-precise" } })
  assert.ok(answered.followUpsAsked.includes("structure-phase"))
  assert.ok(buildProfile(toProfileSummary(answered)).patterns.some((pattern) => pattern.id === "open-then-precise"))
})

// ───────────────────────── Narrative integrity ─────────────────────────

test("narrative blocks come from the band that the dimension actually reads", () => {
  const random = mulberry32(21)
  for (let run = 0; run < 120; run += 1) {
    const profile = profileFor(randomResponses(random, { skipRate: 0.15 }))
    const sections: [string, { text: string; sources: { dimension: keyof typeof dimensionContent; band: "a" | "b" | "middle" }[] }[], "best" | "friction" | "notice" | "experiment"][] = [
      ["best", profile.best, "best"],
      ["friction", profile.friction, "friction"],
      ["notice", profile.notice, "notice"],
    ]
    for (const [name, items, key] of sections) {
      for (const item of items) {
        for (const source of item.sources) {
          const view = profile.dimensions[source.dimension]
          assert.ok(view, `${name} cites a dimension with no data`)
          assert.equal(view.band, source.band)
          assert.equal(item.text, dimensionContent[source.dimension][source.band][key], name)
        }
      }
    }
    for (const id of dimensionIds) {
      const view = profile.dimensions[id]
      if (view) assert.equal(view.summary, dimensionContent[id][view.band].summary)
    }
  }
})

test("profiles from many random answer sets never contain undefined, empty or duplicated content", () => {
  const random = mulberry32(77)
  for (let run = 0; run < 250; run += 1) {
    const responses = randomResponses(random, { skipRate: random() * 0.3 })
    const score = scoreResponses(responses)
    if (!score.completion.complete) continue
    const profile = buildProfile(toProfileSummary(score))
    for (const text of allStrings(profile)) {
      assert.ok(text.trim().length > 0)
      assert.doesNotMatch(text, /undefined|NaN|\[object|null/)
    }
    assert.ok(profile.best.length >= 2 && profile.friction.length >= 2)
    assert.ok(profile.experiments.length >= 2 && profile.experiments.length <= 3)
    assert.equal(new Set(profile.experiments.map((item) => item.id)).size, profile.experiments.length)
    assert.equal(new Set(profile.guide.map((item) => item.id)).size, profile.guide.length)
    assert.equal(profile.guide.length, 8)
    for (const view of Object.values(profile.dimensions)) {
      assert.ok(view)
      assert.ok(view.range[0] <= view.position && view.position <= view.range[1])
    }
  }
})

test("the guide has the eight required statements, each derived from the answers it mentions", () => {
  const profile = profileFor(persona("a"))
  assert.deepEqual(
    profile.guide.map((statement) => statement.id),
    ["information", "decisions", "collaboration", "feedback", "focus", "change", "know", "figuring"],
  )
  const communication = profile.guide.find((statement) => statement.id === "information")!
  assert.equal(communication.text, dimensionContent.communication.a.guide)
  const b = profileFor(persona("b")).guide.find((statement) => statement.id === "information")!
  assert.equal(b.text, dimensionContent.communication.b.guide)
  assert.notEqual(b.text, communication.text)
})

test("follow-up answers appear in the guide in the person's own terms", () => {
  const base = persona("a")
  base.q03 = extremeAnswer(getQuestion("q03")!, { focus: "a" })
  base.q11 = extremeAnswer(getQuestion("q11")!, { focus: "b" })
  base.q15 = extremeAnswer(getQuestion("q15")!, { focus: "a" })
  const profile = profileFor({ ...base, "focus-collab": { format: "choice", optionId: "fc-alone-then-together" } })
  const text = profile.guide.find((statement) => statement.id === "collaboration")!.text
  assert.match(text, /produce on my own and shape things together/)
})

test("the pressure-shift note adds one line to the guide, and only when it was answered", () => {
  const base = { ...persona("a"), q18: extremeAnswer(getQuestion("q18")!, { focus: "b", collaboration: "b", structure: "b", change: "b", communication: "b", thinking: "b" }) }
  const know = (responses: Responses) => profileFor(responses).guide.find((statement) => statement.id === "know")!.text
  assert.doesNotMatch(know(base), /Under pressure/)
  assert.match(know({ ...base, "pressure-shift": { format: "choice", optionId: "ps-quiet" } }), /Under pressure, I tend to go quiet/)
  assert.doesNotMatch(know({ ...base, "pressure-shift": { format: "choice", optionId: "ps-same" } }), /Under pressure/)
})

test("headline copy hedges rather than diagnoses", () => {
  const forbidden = /disorder|diagnos|clinical|introvert|extrovert|neurotic|conscientious|iq\b|hire|suitab/i
  for (const identity of identities) for (const text of [identity.name, identity.headline, identity.lead, identity.closing]) assert.doesNotMatch(text, forbidden)
  for (const id of dimensionIds) {
    for (const band of ["a", "b", "middle"] as const) {
      for (const text of Object.values(dimensionContent[id][band])) assert.doesNotMatch(text, forbidden, `${id}.${band}`)
    }
  }
  for (const caveat of buildProfile(toProfileSummary(scoreResponses(persona("a")))).caveats) assert.ok(caveat.length > 20)
})

test("no content block names one pole as better", () => {
  const judgemental = /\b(better|worse|superior|inferior|weakness|flaw|deficit|should be|too slow|lazy)\b/i
  for (const id of dimensionIds) {
    for (const band of ["a", "b", "middle"] as const) {
      for (const text of Object.values(dimensionContent[id][band])) assert.doesNotMatch(text, judgemental, `${id}.${band}: ${text}`)
    }
  }
})

test("the 'what colleagues may notice' list separates supported patterns from tentative ones", () => {
  const strong = profileFor(persona("a"))
  assert.ok(strong.notice.some((item) => item.support === "supported"))
  const mixed = profileFor(alternatingPersona())
  assert.ok(mixed.notice.every((item) => item.support === "tentative"))
})

test("thin evidence is called out and stays out of the headline sources", () => {
  const responses = persona("a")
  for (const id of ["q11", "q15", "q18", "q21", "q26", "q28"]) responses[id] = { format: "skip" }
  const profile = profileFor(responses)
  assert.equal(profile.dimensions.focus?.evidence === "thin", true)
  assert.match(profile.dimensions.focus!.evidenceNote, /first guess/)
  assert.ok(!profile.headline.sources.includes("focus"))
  assert.match(profile.guide.find((statement) => statement.id === "figuring")!.text, /focus/)
})

// ───────────────────────── Editing the guide ─────────────────────────

test("editing the guide does not mutate the scored assessment or the default guide", () => {
  const responses = persona("a")
  const before = JSON.stringify(responses)
  const score = scoreResponses(responses)
  const scoreBefore = JSON.stringify(score)
  const profile = buildProfile(toProfileSummary(score))
  const defaults = JSON.stringify(profile.guide)
  const edited = applyGuideEdits(profile.guide, { focus: "  I do my best work before 10am.  ", change: "   ", unknown: "ignored" })
  assert.equal(edited.find((statement) => statement.id === "focus")?.text, "I do my best work before 10am.")
  assert.equal(edited.find((statement) => statement.id === "change")?.text, profile.guide.find((statement) => statement.id === "change")?.text)
  assert.equal(JSON.stringify(profile.guide), defaults)
  assert.equal(JSON.stringify(responses), before)
  assert.equal(JSON.stringify(score), scoreBefore)
  assert.equal(JSON.stringify(scoreResponses(responses)), scoreBefore)
})

// ───────────────────────── Signature ─────────────────────────

test("the signature is derived from the data: positions move marks along their spokes", () => {
  const low = buildSignature({ ...emptySignatureInput(), thinking: { position: -1, spread: 0, evidence: "good" } })
  const mid = buildSignature({ ...emptySignatureInput(), thinking: { position: 0, spread: 0, evidence: "good" } })
  const high = buildSignature({ ...emptySignatureInput(), thinking: { position: 1, spread: 0, evidence: "good" } })
  const radii = [low, mid, high].map((signature) => signature.nodes.find((node) => node.id === "thinking")!.radius)
  assert.ok(radii[0] < radii[1] && radii[1] < radii[2])
  assert.equal(radii[1].toFixed(1), radiusFor(0).toFixed(1))
  assert.ok(radii[2] <= SIGNATURE_RADIUS)
  const node = high.nodes.find((candidate) => candidate.id === "thinking")!
  assert.ok(node.y < 0, "thinking is at twelve o'clock")
})

test("the signature is deterministic, and changes whenever any dimension changes", () => {
  const profile = profileFor(persona("a"))
  const a = buildSignature(profile.summary.dimensions)
  assert.deepEqual(a, buildSignature(JSON.parse(JSON.stringify(profile.summary.dimensions))))
  const changed = { ...profile.summary.dimensions, change: { ...profile.summary.dimensions.change!, position: 0.4 } }
  assert.notDeepEqual(a.nodes.find((node) => node.id === "change"), buildSignature(changed).nodes.find((node) => node.id === "change"))
  assert.notEqual(signatureSvg(a), signatureSvg(buildSignature(changed)))
})

test("evidence shapes the halo and spread shapes the satellites", () => {
  const input = (evidence: "thin" | "some" | "good", spread: number) =>
    buildSignature({ ...emptySignatureInput(), focus: { position: 0.5, spread, evidence } }).nodes.find((node) => node.id === "focus")!
  assert.ok(input("thin", 0).halo > input("good", 0).halo)
  assert.equal(input("thin", 0).haloDashed, true)
  assert.equal(input("good", 0).haloDashed, false)
  assert.ok(input("good", 0).satellites.length > input("thin", 0).satellites.length)
  const spreadOf = (node: ReturnType<typeof input>) => Math.max(...node.satellites.map((satellite) => Math.hypot(satellite.x, satellite.y))) - Math.min(...node.satellites.map((satellite) => Math.hypot(satellite.x, satellite.y)))
  assert.ok(spreadOf(input("good", 0.9)) > spreadOf(input("good", 0.1)))
})

test("dimensions without data (private or unanswered) are drawn as empty marks and left out of the curve", () => {
  const profile = profileFor(persona("a"))
  const hidden = { ...profile.summary.dimensions, feedback: null, change: null }
  const signature = buildSignature(hidden)
  assert.equal(signature.nodes.filter((node) => !node.available).length, 2)
  assert.ok(signature.curve)
  assert.equal(buildSignature({ ...emptySignatureInput(), focus: { position: 1, spread: 0, evidence: "good" } }).curve, null)
})

test("each dimension has its own glyph shape and colour, so colour is never the only cue", () => {
  assert.equal(new Set(dimensionIds.map((id) => dimensions[id].glyph)).size, dimensionIds.length)
  assert.equal(new Set(dimensionIds.map((id) => dimensions[id].colour)).size, dimensionIds.length)
  const signature = buildSignature(profileFor(persona("b")).summary.dimensions)
  assert.equal(new Set(signature.nodes.map((node) => node.path)).size, signature.nodes.length)
})

test("the SVG renderer uses the dimension colours, supports a dark theme and labels, and escapes text", () => {
  const signature = buildSignature(profileFor(persona("a")).summary.dimensions)
  const light = signatureSvg(signature, { theme: "light", labels: true })
  const dark = signatureSvg(signature, { theme: "dark" })
  for (const id of dimensionIds) {
    assert.ok(light.includes(dimensions[id].colour))
    assert.ok(dark.includes(dimensions[id].colourOnDark))
  }
  assert.ok(light.includes("Thinking"))
  assert.ok(light.startsWith("<svg") && light.endsWith("</svg>"))
  assert.doesNotMatch(light, /NaN|undefined/)
})

test("blending between two inputs interpolates positions and is exact at the ends", () => {
  const a = profileFor(persona("a")).summary.dimensions
  const b = profileFor(persona("b")).summary.dimensions
  assert.deepEqual(blendSignatureInput(a, b, 0).thinking, a.thinking)
  assert.deepEqual(blendSignatureInput(a, b, 1).thinking, b.thinking)
  const halfway = blendSignatureInput(a, b, 0.5).thinking!
  assert.ok(Math.abs(halfway.position - (a.thinking!.position + b.thinking!.position) / 2) < 1e-9)
})

// ───────────────────────── Exports ─────────────────────────

test("exports are built from the same profile and guide as the website", () => {
  const profile = profileFor(persona("a"), "Sam")
  const guide = applyGuideEdits(profile.guide, { focus: "My own focus line." })
  const model = buildExportModel(profile, guide, { date: "17 Oct 2026" })
  assert.equal(model.title, profile.headline.title)
  assert.equal(model.statement, profile.headline.statement)
  assert.deepEqual(model.guide.map((item) => item.text), guide.map((item) => item.text))
  assert.deepEqual(model.best, profile.best.map((item) => item.text))
  assert.deepEqual(model.experiments, profile.experiments.map((item) => item.text))
  assert.equal(model.dimensions.length, 8)

  const text = guideToText(model)
  assert.match(text, /Sam: how to work with me/)
  assert.match(text, /My own focus line\./)
  const markdown = profileToMarkdown(model)
  assert.match(markdown, new RegExp(profile.headline.title))
  for (const dimension of model.dimensions) assert.ok(markdown.includes(dimension.title))
  for (const text of model.best) assert.ok(markdown.includes(text))
})

test("the PDF is a real multi-page document built from the model, with text the standard fonts can encode", async () => {
  const profile = profileFor(persona("b", { focus: "a" }), "Ana")
  const model = buildExportModel(profile, profile.guide, { date: "17 Oct 2026" })
  const bytes = await buildGuidePdf(model)
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), "%PDF-")
  const doc = await PDFDocument.load(bytes)
  assert.ok(doc.getPageCount() >= 3 && doc.getPageCount() <= 8, `pages: ${doc.getPageCount()}`)
  assert.match(doc.getTitle() ?? "", /work guide/)
})

test("the PDF survives unusual characters in a name and a very long guide edit", async () => {
  const profile = profileFor(persona("a"), "Zoë 山田 ✓")
  const guide = applyGuideEdits(profile.guide, { know: "Long ".repeat(140) + "→ ≥ …" })
  const bytes = await buildGuidePdf(buildExportModel(profile, guide))
  assert.ok((await PDFDocument.load(bytes)).getPageCount() >= 3)
})

test("pdfSafe replaces characters the standard fonts cannot encode", () => {
  const font = { encodeText: (text: string) => { if (/[^\u0000-\u00ff’‘“”–—…•]/.test(text)) throw new Error("no"); return text } }
  assert.equal(pdfSafe("a → b ≥ c", font), "a -> b >= c")
  assert.equal(pdfSafe("山", font), "?")
  assert.equal(pdfSafe("it’s “fine” — really", font), "it’s “fine” — really")
})

// ───────────────────────── Comparison ─────────────────────────

const comparisonOf = (a: Profile, b: Profile) => compareProfiles(a, b)

test("comparison separates shared preferences, differences and flexible dimensions, with no score", () => {
  const mine = profileFor(persona("a"))
  const theirs = profileFor(persona("b", { thinking: "a", structure: "a" }))
  const result = comparisonOf(mine, theirs)
  assert.equal(result.items.length, 8)
  assert.deepEqual(result.shared.map((item) => item.dimension).sort(), ["structure", "thinking"])
  assert.equal(result.different.length, 6)
  assert.equal(result.flexible.length, 0)
  assert.ok(!("score" in result) && !("compatibility" in result))
  assert.doesNotMatch(JSON.stringify(result), /compatib|incompatib|match score/i)
  for (const item of result.different) {
    assert.ok(item.question && item.assumption && item.agreement)
  }
  assert.equal(result.questions.length, 4)
  assert.equal(result.agreements.length, 3)
})

test("comparison treats a middle reading as flexibility, not a difference", () => {
  const result = comparisonOf(profileFor(persona("a")), buildProfile(flatSummary()))
  assert.equal(result.different.length, 0)
  assert.equal(result.flexible.length, 8)
})

test("comparison skips dimensions that are private or thin and says why", () => {
  const mine = profileFor(persona("a"))
  const summary = toProfileSummary(scoreResponses(persona("b")), { include: ["thinking", "focus", "decisions", "structure"] })
  const theirs = buildProfile(summary)
  const result = comparisonOf(mine, theirs)
  assert.equal(result.items.length, 4)
  assert.equal(result.notCompared.length, 4)
  assert.ok(result.notCompared.every((entry) => entry.reason === "private"))
  const thinResponses = persona("b")
  for (const id of ["q11", "q15", "q18", "q21", "q26", "q28"]) thinResponses[id] = { format: "skip" }
  const thin = comparisonOf(mine, profileFor(thinResponses))
  assert.ok(thin.notCompared.some((entry) => entry.dimension === "focus" && entry.reason === "thin"))
})

test("comparison is symmetric about which dimensions differ", () => {
  const a = profileFor(persona("a", { focus: "b" }))
  const b = profileFor(persona("b", { thinking: "a" }))
  assert.deepEqual(comparisonOf(a, b).different.map((item) => item.dimension).sort(), comparisonOf(b, a).different.map((item) => item.dimension).sort())
})

test("answered follow-ups never leak into exports as raw answers", () => {
  const profile = profileFor(answerFollowUps(persona("middle", { focus: "a", collaboration: "b" })))
  const markdown = profileToMarkdown(buildExportModel(profile, profile.guide))
  assert.doesNotMatch(markdown, /fc-|optionId|"format"/)
})

// ───────────────────────── Voice ─────────────────────────

test("re-voicing moves pronouns and verb forms, and keeps objects as objects", () => {
  assert.equal(inVoice("You seem to do your best work when you’re left alone.", "third"), "They seem to do their best work when they’re left alone.")
  assert.equal(inVoice("You seem to do your best work when you’re left alone.", "first"), "I seem to do my best work when I’m left alone.")
  assert.equal(inVoice("Colleagues may leave you without your thinking time.", "third"), "Colleagues may leave them without their thinking time.")
  assert.equal(inVoice("People around you know which mode you are in.", "first"), "People around me know which mode I am in.")
  assert.equal(inVoice("You told us you were close.", "third"), "They told us they were close.")
  assert.equal(inVoice("Do it as well as you.", "third"), "Do it as well as them.")
  assert.equal(inVoice("Nothing to change here.", "third"), "Nothing to change here.")
})

test("re-voiced profiles leave no second-person words behind, across many different people", () => {
  const random = mulberry32(5)
  for (let run = 0; run < 300; run += 1) {
    const responses = run % 4 === 0 ? randomResponses(random, { skipRate: 0.1 }) : persona(run % 2 ? "a" : "b", { focus: run % 3 === 0 ? "a" : "middle", thinking: run % 5 === 0 ? "middle" : "a" })
    const profile = profileFor(answerFollowUps(responses))
    for (const voice of ["first", "third"] as const) {
      const revoiced = profileInVoice(profile, voice)
      const texts = [
        revoiced.headline.statement,
        revoiced.headline.lead,
        ...revoiced.patterns.map((pattern) => pattern.text),
        ...Object.values(revoiced.dimensions).flatMap((view) => (view ? [view.summary, view.strengthNote, view.evidenceNote, view.rangeNote ?? ""] : [])),
      ]
      for (const text of texts) assert.doesNotMatch(text, /\byou(r|rs|rself)?\b|\byou[’']/i, text)
    }
  }
})

test("re-voicing never changes the facts: positions, evidence, titles and the guide stay identical", () => {
  const profile = profileFor(persona("a"))
  const revoiced = profileInVoice(profile, "third")
  assert.deepEqual(revoiced.summary, profile.summary)
  assert.equal(revoiced.headline.title, profile.headline.title)
  assert.deepEqual(revoiced.guide, profile.guide)
  for (const id of dimensionIds) {
    assert.equal(revoiced.dimensions[id]?.position, profile.dimensions[id]?.position)
    assert.equal(revoiced.dimensions[id]?.label, profile.dimensions[id]?.label)
  }
})
