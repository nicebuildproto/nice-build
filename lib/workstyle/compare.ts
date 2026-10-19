import { dimensionContent } from "./content/dimensions.ts"
import { dimensionIds, dimensions } from "./dimensions.ts"
import type { DimensionView, Profile } from "./profile.ts"
import type { DimensionId } from "./types.ts"

// COMPARISON — a conversation starter for two people who both chose to share. It deliberately has
// no compatibility score, no ranking and no prediction. Differences are framed as things to
// discuss, not problems; similarities as things worth saying out loud.

export const DIFFERENT_GAP = 0.6

export type ComparisonKind = "shared" | "different" | "flexible"

export type ComparisonItem = {
  dimension: DimensionId
  title: string
  kind: ComparisonKind
  mine: { label: string; position: number; band: DimensionView["band"] }
  theirs: { label: string; position: number; band: DimensionView["band"] }
  /** One line saying what the two readings mean together. */
  headline: string
  question: string
  assumption: string
  agreement: string
}

export type Comparison = {
  items: ComparisonItem[]
  shared: ComparisonItem[]
  different: ComparisonItem[]
  flexible: ComparisonItem[]
  /** Dimensions we couldn’t compare, and why. */
  notCompared: { dimension: DimensionId; reason: "private" | "thin" }[]
  questions: string[]
  agreements: { dimension: DimensionId; text: string }[]
}

function comparable(view: DimensionView | null): view is DimensionView {
  return view !== null && view.evidence !== "thin"
}

export function compareProfiles(mine: Profile, theirs: Profile): Comparison {
  const items: ComparisonItem[] = []
  const notCompared: Comparison["notCompared"] = []

  for (const id of dimensionIds) {
    const a = mine.dimensions[id]
    const b = theirs.dimensions[id]
    if (!comparable(a) || !comparable(b)) {
      const missing = !a || !b
      notCompared.push({ dimension: id, reason: missing ? "private" : "thin" })
      continue
    }
    const gap = Math.abs(a.position - b.position)
    const eitherMiddle = a.band === "middle" || b.band === "middle"
    // Opposite leans count as a meaningful difference only when the gap is real; two gentle leans
    // either side of the middle are treated as flexibility on both sides.
    const kind: ComparisonKind = eitherMiddle ? "flexible" : a.band === b.band ? "shared" : gap >= DIFFERENT_GAP ? "different" : "flexible"
    const spec = dimensions[id]
    const compare = dimensionContent[id].compare
    const headline =
      kind === "shared"
        ? `You both lean towards “${a.label.toLowerCase()}”.`
        : kind === "different"
          ? `One of you leans towards “${a.label.toLowerCase()}”, the other towards “${b.label.toLowerCase()}”.`
          : eitherMiddle
            ? `One of you ${(a.band === "middle" ? a : b).kind === "mixed" ? "says it depends on context" : "is flexible"} here, so there’s room to adapt to each other.`
            : `You lean slightly different ways here (“${a.label.toLowerCase()}” and “${b.label.toLowerCase()}”), but neither lean is strong, so there’s room to adapt.`
    items.push({
      dimension: id,
      title: spec.title,
      kind,
      mine: { label: a.label, position: a.position, band: a.band },
      theirs: { label: b.label, position: b.position, band: b.band },
      headline,
      question: compare.question,
      assumption: compare.assumption,
      agreement: compare.agreement,
    })
  }

  const gapOf = (item: ComparisonItem) => Math.abs(item.mine.position - item.theirs.position)
  const different = items.filter((item) => item.kind === "different").sort((x, y) => gapOf(y) - gapOf(x))
  const shared = items.filter((item) => item.kind === "shared")
  const flexible = items.filter((item) => item.kind === "flexible")

  return {
    items,
    shared,
    different,
    flexible,
    notCompared,
    questions: [...different, ...flexible].slice(0, 4).map((item) => item.question),
    agreements: different.slice(0, 3).map((item) => ({ dimension: item.dimension, text: item.agreement })),
  }
}
