import { dimensionContent } from "./content/dimensions.ts"
import { contextLines, contextShifter, identities, partialPicture, type Identity } from "./content/identities.ts"
import { patterns, type PatternDef } from "./content/patterns.ts"
import { dimensionIds, dimensions } from "./dimensions.ts"
import { lean, leansTo, readDimension, type Reading } from "./interpret.ts"
import type { Band, DimensionId, DimensionState, DimensionSummary, EvidenceLevel, FollowUpId, ProfileSummary } from "./types.ts"

// RESULTS: a deterministic function from a ProfileSummary to structured, personalised content.
// The same summary always produces the same Profile. Nothing here is random and nothing calls a model.

export type EvidenceRef = { dimension: DimensionId; band: Band }

export type Insight = { id: string; text: string; sources: EvidenceRef[] }

export type DimensionView = {
  id: DimensionId
  title: string
  position: number
  spread: number
  range: [number, number]
  evidence: Exclude<EvidenceLevel, "none">
  band: Band
  kind: Reading["kind"]
  /** The four-way reading: leaning left, leaning right, flexible, or depends on context. */
  state: DimensionState
  intensity: Reading["intensity"]
  hasExceptions: boolean
  /** The label for where the person sits, e.g. “Reflect first” or “Either, by situation”. */
  label: string
  summary: string
  /** How strong the lean is, in words. */
  strengthNote: string
  /** What the evidence behind this reading looks like, in words. */
  evidenceNote: string
  /** Set when answers disagreed or went the other way. */
  rangeNote: string | null
}

export type PatternInsight = Insight & { title: string; experiment: string; guide: string }

export type GuideStatement = { id: GuideStatementId | "own"; label: string; text: string; sources: DimensionId[] }

export type GuideStatementId =
  | "information"
  | "decisions"
  | "collaboration"
  | "feedback"
  | "focus"
  | "change"
  | "know"
  | "figuring"

export type Headline = {
  kind: "identity" | "hybrid" | "composed" | "context" | "partial"
  id: string
  title: string
  statement: string
  lead: string
  closing: string
  sources: DimensionId[]
}

export type Profile = {
  summary: ProfileSummary
  headline: Headline
  dimensions: Record<DimensionId, DimensionView | null>
  patterns: PatternInsight[]
  best: Insight[]
  friction: Insight[]
  notice: (Insight & { support: "supported" | "tentative" })[]
  experiments: Insight[]
  guide: GuideStatement[]
  closing: string
  caveats: string[]
}

// ───────────────────────── Dimension views ─────────────────────────

function strengthNote(reading: Reading): string {
  if (reading.kind === "mixed") return "Your answers pulled in different directions, or you said it depends. The situation seems to decide."
  if (reading.kind === "balanced") return "Your answers sat consistently in the middle. You seem comfortable either way."
  if (reading.intensity === "slight") return "A mild lean, with plenty of room for the other side."
  if (reading.intensity === "moderate") return "A clear, fairly consistent lean."
  return "This came through strongly."
}

function evidenceNote(evidence: DimensionView["evidence"], kind: Reading["kind"]): string {
  if (evidence === "good") return "Several of your answers back this up, and they agree."
  if (evidence === "some") {
    return kind === "mixed"
      ? "Several answers bear on this, but they didn’t agree, so we’re less sure of a single reading."
      : "A few answers back this up; some questions were skipped or only partly relevant."
  }
  return "There isn’t much to go on here, so treat this as a first guess."
}

/** The four states read differently: a lean names its pole; the two middle states are named for what they mean. */
export const FLEXIBLE_LABEL = "Flexible"
export const CONTEXT_LABEL = "Depends on context"

function viewFor(id: DimensionId, summary: DimensionSummary): DimensionView {
  const spec = dimensions[id]
  const reading = readDimension(summary)
  const label = reading.kind === "a" ? spec.a.label : reading.kind === "b" ? spec.b.label : reading.kind === "balanced" ? FLEXIBLE_LABEL : CONTEXT_LABEL
  const lo = Math.max(-1, summary.position - summary.spread)
  const hi = Math.min(1, summary.position + summary.spread)
  let rangeNote: string | null = null
  if (reading.kind === "mixed") {
    rangeNote = `Some answers went towards “${spec.a.label.toLowerCase()}” and some towards “${spec.b.label.toLowerCase()}”, or you said it depends. That usually means context matters.`
  } else if (reading.hasExceptions) {
    rangeNote = "Some of your answers went the other way, so treat this as a lean rather than a rule."
  }
  return {
    id,
    title: spec.title,
    position: summary.position,
    spread: summary.spread,
    range: [Math.round(lo * 100) / 100, Math.round(hi * 100) / 100],
    evidence: summary.evidence,
    band: reading.band,
    kind: reading.kind,
    state: reading.state,
    intensity: reading.intensity,
    hasExceptions: reading.hasExceptions,
    label,
    summary: dimensionContent[id][reading.band].summary,
    strengthNote: strengthNote(reading),
    evidenceNote: evidenceNote(summary.evidence, reading.kind),
    rangeNote,
  }
}

// ───────────────────────── Headline ─────────────────────────

const IDENTITY_MIN_SCORE = 0.6
const IDENTITY_MIN_EACH = 0.15
const HYBRID_WINDOW = 0.15

type Candidate = { identity: Identity; score: number; used: DimensionId[] }

/** How well the dimensions line up with an identity: mean lean (0.5 lean counts as full), 0 if any dimension opposes it. */
function scoreIdentity(identity: Identity, summary: ProfileSummary): Candidate | null {
  const usable = identity.wants.filter(({ dimension }) => {
    const entry = summary.dimensions[dimension]
    return entry !== null && entry.evidence !== "thin"
  })
  if (usable.length < 2) return null
  // A dimension whose answers disagreed gives no support to any identity.
  const leans = usable.map(({ dimension, side }) => {
    const entry = summary.dimensions[dimension] as DimensionSummary
    return readDimension(entry).kind === "mixed" ? 0 : lean(entry, side)
  })
  if (Math.min(...leans) < IDENTITY_MIN_EACH) return null
  const score = leans.reduce((total, value) => total + Math.min(1, value / 0.5), 0) / leans.length
  return { identity, score, used: usable.map(({ dimension }) => dimension) }
}

export function deriveHeadline(summary: ProfileSummary): Headline {
  const available = dimensionIds.filter((id) => summary.dimensions[id] !== null)
  if (available.length < 4) {
    return {
      kind: "partial",
      id: partialPicture.id,
      title: partialPicture.name,
      statement: partialPicture.headline,
      lead: partialPicture.lead,
      closing: partialPicture.closing,
      sources: available,
    }
  }

  const candidates = identities
    .map((identity) => scoreIdentity(identity, summary))
    .filter((candidate): candidate is Candidate => candidate !== null && candidate.score >= IDENTITY_MIN_SCORE)
    .sort((x, y) => y.score - x.score)

  const [first, second] = candidates
  if (first && second && first.score - second.score <= HYBRID_WINDOW) {
    return {
      kind: "hybrid",
      id: `${first.identity.id}+${second.identity.id}`,
      title: `Part ${first.identity.name.replace(/^The /, "")}, part ${second.identity.name.replace(/^The /, "")}`,
      statement: `You ${first.identity.clause}, and you ${second.identity.clause}.`,
      lead: `${first.identity.lead} ${second.identity.lead}`,
      closing: first.identity.closing,
      sources: [...new Set([...first.used, ...second.used])],
    }
  }
  if (first) {
    return {
      kind: "identity",
      id: first.identity.id,
      title: first.identity.name,
      statement: first.identity.headline,
      lead: first.identity.lead,
      closing: first.identity.closing,
      sources: first.used,
    }
  }
  // No named identity fits. If most dimensions sit in the middle, say so; otherwise describe the
  // strongest leans directly rather than forcing a label.
  const readings = available.map((id) => ({ id, reading: readDimension(summary.dimensions[id] as DimensionSummary) }))
  const middleCount = readings.filter(({ reading }) => reading.band === "middle").length
  if (middleCount >= 4) {
    return {
      kind: "context",
      id: contextShifter.id,
      title: contextShifter.name,
      statement: contextShifter.headline,
      lead: contextShifter.lead,
      closing: contextShifter.closing,
      sources: available,
    }
  }
  const strongest = readings
    .filter(({ reading }) => reading.band !== "middle")
    .sort((x, y) => y.reading.strength - x.reading.strength || dimensionIds.indexOf(x.id) - dimensionIds.indexOf(y.id))
    .slice(0, 3)
  const labels = strongest.map(({ id, reading }) => (reading.band === "a" ? dimensions[id].a.label : dimensions[id].b.label))
  return {
    kind: "composed",
    id: `composed:${strongest.map(({ id }) => id).join("+")}`,
    title: labels.slice(0, 2).join(" + "),
    statement: `You lean towards ${joinList(labels.map((label) => label.toLowerCase()))}.`,
    lead: "No single named pattern fits your answers closely, so rather than force one, here are the preferences that stood out most. Your particular combination is your own.",
    closing: `Start with the strongest lean — ${labels[0].toLowerCase()} — and tell one colleague what it looks like in practice for you.`,
    sources: strongest.map(({ id }) => id),
  }
}

// ───────────────────────── Patterns ─────────────────────────

function patternStrength(def: PatternDef, summary: ProfileSummary): number | null {
  const contextHit = def.context ? summary.contexts[def.context.followUp] === def.context.value : false
  if (def.dimensions.length === 0) return contextHit ? 0.5 : null
  const satisfied = def.dimensions.every(({ dimension, side }) => leansTo(summary.dimensions[dimension], side))
  if (!satisfied) return contextHit ? 0.5 : null
  const mean = def.dimensions.reduce((total, { dimension, side }) => total + lean(summary.dimensions[dimension], side), 0) / def.dimensions.length
  return mean
}

export function derivePatterns(summary: ProfileSummary, limit = 3): PatternInsight[] {
  const matched = patterns
    .map((def, order) => ({ def, order, strength: patternStrength(def, summary) }))
    .filter((entry): entry is { def: PatternDef; order: number; strength: number } => entry.strength !== null)
    .sort((x, y) => y.strength - x.strength || x.order - y.order)
    .slice(0, limit)
  return matched.map(({ def }) => {
    const sources: EvidenceRef[] = def.dimensions.map(({ dimension }) => ({
      dimension,
      band: readDimension(summary.dimensions[dimension] as DimensionSummary).band,
    }))
    const contextNote = contextNoteFor(def, summary)
    return {
      id: def.id,
      title: def.title,
      text: contextNote ? `${def.insight} ${contextNote}` : def.insight,
      sources,
      experiment: def.experiment,
      guide: def.guide,
    }
  })
}

function contextNoteFor(def: PatternDef, summary: ProfileSummary): string | null {
  if (def.id === "together-with-room-to-be-alone") {
    const context = summary.contexts["focus-collab"]
    if (context === "alone-then-together") return "You told us you like to produce alone and shape together."
    if (context === "together-then-alone") return "You told us you like to start together and finish alone."
    if (context === "alternate") return "You told us you tend to alternate between the two, day by day."
    if (context === "balance-hard") return "You told us the balance is the hard part."
  }
  if (def.id === "direct-but-not-off-the-cuff") {
    const context = summary.contexts["feedback-timing"]
    if (context === "hear-now-respond-later") return "You told us you’re fine hearing it straight away and just need time before you respond."
    if (context === "size-led") return "You told us it depends on how weighty the feedback is."
    if (context === "person-led") return "You told us it depends on who is giving it."
  }
  return null
}

// ───────────────────────── Ranked dimension lists ─────────────────────────

type Ranked = { id: DimensionId; view: DimensionView; salience: number }

/** Dimensions ordered by how clearly they lean; thin evidence is left out unless nothing else exists. */
function rank(views: Record<DimensionId, DimensionView | null>): Ranked[] {
  const all = dimensionIds
    .map((id) => ({ id, view: views[id] }))
    .filter((entry): entry is { id: DimensionId; view: DimensionView } => entry.view !== null)
    .map(({ id, view }) => ({ id, view, salience: Math.abs(view.position) + (view.evidence === "good" ? 0.1 : 0) }))
  const solid = all.filter((entry) => entry.view.evidence !== "thin")
  const pool = solid.length >= 2 ? solid : all
  return [...pool].sort((x, y) => y.salience - x.salience || dimensionIds.indexOf(x.id) - dimensionIds.indexOf(y.id))
}

const ref = (view: DimensionView): EvidenceRef => ({ dimension: view.id, band: view.band })

// ───────────────────────── Guide ─────────────────────────

const guideLabels: Record<GuideStatementId, string> = {
  information: "How I prefer to receive information",
  decisions: "How I approach decisions",
  collaboration: "How I like to collaborate",
  feedback: "How I prefer to receive feedback",
  focus: "What helps me focus",
  change: "What to do when priorities change",
  know: "What colleagues should know when working with me",
  figuring: "What I’m still figuring out",
}

export const guideStatementIds = Object.keys(guideLabels) as GuideStatementId[]

const guideSources: Record<Exclude<GuideStatementId, "know" | "figuring">, DimensionId> = {
  information: "communication",
  decisions: "decisions",
  collaboration: "collaboration",
  feedback: "feedback",
  focus: "focus",
  change: "change",
}

function contextSentence(summary: ProfileSummary, followUp: FollowUpId): string | null {
  const context = summary.contexts[followUp]
  return context ? (contextLines[followUp]?.[context] ?? null) : null
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("")
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

function buildGuide(summary: ProfileSummary, views: Record<DimensionId, DimensionView | null>, topPattern: PatternInsight | undefined): GuideStatement[] {
  const statements: GuideStatement[] = []

  for (const id of ["information", "decisions", "collaboration", "feedback", "focus", "change"] as const) {
    const dimension = guideSources[id]
    const view = views[dimension]
    if (!view) continue
    const extras: string[] = []
    if (id === "decisions") extras.push(contextSentence(summary, "decision-stakes") ?? "")
    if (id === "collaboration") extras.push(contextSentence(summary, "focus-collab") ?? "")
    if (id === "feedback") extras.push(contextSentence(summary, "feedback-timing") ?? "")
    const text = [dimensionContent[dimension][view.band].guide, ...extras].filter(Boolean).join(" ")
    statements.push({ id, label: guideLabels[id], text, sources: [dimension] })
  }

  // “What colleagues should know”: thinking + structure, plus the strongest cross-dimension pattern.
  const knowSources: DimensionId[] = []
  const knowParts: string[] = []
  for (const dimension of ["thinking", "structure"] as const) {
    const view = views[dimension]
    if (!view) continue
    knowSources.push(dimension)
    knowParts.push(dimensionContent[dimension][view.band].guide)
  }
  const structureContext = contextSentence(summary, "structure-phase")
  if (structureContext && views.structure) knowParts.push(structureContext)
  // One added line, from the private pressure-shift follow-up: “Under pressure, I tend to…”.
  const pressureLine = contextSentence(summary, "pressure-shift")
  if (pressureLine) knowParts.push(pressureLine)
  if (topPattern) {
    knowParts.push(topPattern.guide)
    for (const source of topPattern.sources) if (!knowSources.includes(source.dimension)) knowSources.push(source.dimension)
  }
  if (knowParts.length) {
    statements.push({ id: "know", label: guideLabels.know, text: knowParts.join(" "), sources: knowSources })
  }

  // “Still figuring out”: where answers disagreed, or where there wasn’t much to go on.
  const present = dimensionIds.filter((id) => views[id])
  if (present.length) {
    const mixedIds = present.filter((id) => views[id]?.kind === "mixed")
    const thinIds = present.filter((id) => views[id]?.evidence === "thin")
    const names = (ids: DimensionId[]) => joinList(ids.map((id) => dimensions[id].short.toLowerCase()))
    const parts: string[] = []
    if (mixedIds.length) parts.push(`My answers pulled both ways on ${names(mixedIds)}. I think it depends on the situation, and I’m still working out what tips it.`)
    if (thinIds.length) parts.push(`I’m less sure about ${names(thinIds)}, because I didn’t answer much there.`)
    if (!parts.length) parts.push("Not much that I’m aware of — though I’d like to hear what you notice about how I work, because you may see things I can’t.")
    statements.push({
      id: "figuring",
      label: guideLabels.figuring,
      text: parts.join(" "),
      sources: [...new Set([...mixedIds, ...thinIds])],
    })
  }
  return statements
}

// ───────────────────────── Build ─────────────────────────

const CAVEATS = [
  "These are interpretations of what you told us you prefer, using fixed rules. They are not a diagnosis, a hiring test or a measure of ability.",
  "Preferences shift with context. Where your answers pulled in different directions, that is information, not an error.",
  "The eight dimensions are exploratory product ideas, not a validated psychometric instrument.",
]

export function buildProfile(summary: ProfileSummary): Profile {
  const views = Object.fromEntries(
    dimensionIds.map((id) => [id, summary.dimensions[id] ? viewFor(id, summary.dimensions[id]) : null]),
  ) as Record<DimensionId, DimensionView | null>
  const headline = deriveHeadline(summary)
  const ranked = rank(views)
  const found = derivePatterns(summary)

  const best: Insight[] = ranked.slice(0, 4).map(({ view }) => ({
    id: `best-${view.id}`,
    text: dimensionContent[view.id][view.band].best,
    sources: [ref(view)],
  }))
  const friction: Insight[] = ranked.slice(0, 3).map(({ view }) => ({
    id: `friction-${view.id}`,
    text: dimensionContent[view.id][view.band].friction,
    sources: [ref(view)],
  }))
  const notice = ranked.slice(0, 5).map(({ view }) => ({
    id: `notice-${view.id}`,
    text: dimensionContent[view.id][view.band].notice,
    sources: [ref(view)],
    support: view.evidence === "good" && view.kind !== "mixed" && !view.hasExceptions && Math.abs(view.position) >= 0.5 ? ("supported" as const) : ("tentative" as const),
  }))

  const experiments: Insight[] = []
  const usedDimensions = new Set<DimensionId>()
  if (found[0]) {
    experiments.push({ id: `experiment-${found[0].id}`, text: found[0].experiment, sources: found[0].sources })
    for (const source of found[0].sources) usedDimensions.add(source.dimension)
  }
  for (const { view } of ranked) {
    if (experiments.length >= 3) break
    if (usedDimensions.has(view.id)) continue
    usedDimensions.add(view.id)
    experiments.push({ id: `experiment-${view.id}`, text: dimensionContent[view.id][view.band].experiment, sources: [ref(view)] })
  }

  return {
    summary,
    headline,
    dimensions: views,
    patterns: found,
    best,
    friction,
    notice,
    experiments,
    guide: buildGuide(summary, views, found[0]),
    closing: headline.closing,
    caveats: CAVEATS,
  }
}

/** Applies a person's edits to the default guide without touching the underlying profile. */
export function applyGuideEdits(guide: GuideStatement[], edits: Partial<Record<string, string>>): GuideStatement[] {
  return guide.map((statement) => {
    const edited = edits[statement.id]
    return typeof edited === "string" && edited.trim() ? { ...statement, text: edited.trim() } : { ...statement }
  })
}
