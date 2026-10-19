import type { DimensionView, Profile } from "./profile.ts"

// VOICE — results are written to the person ("You seem to…"). When the same words appear somewhere the
// reader isn't that person (a share page, a link preview) or the person is speaking for themselves (a card
// they post), the pronouns have to move. The copy is authored so that a rule-based change is safe:
// "you" forms take the same verb as "they" and "I", apart from "are"/"were", which are handled here.
// Imperative advice (experiments, closing lines) is not rewritten; it simply isn't shown in those places.

export type Voice = "first" | "third"

// Words after which a bare "you" is an object ("tell you", "with you"), not a subject.
const OBJECT_AFTER = new Set([
  "to", "for", "with", "from", "around", "alongside", "behind", "about", "tell", "tells", "told", "teach", "teaches", "let", "lets",
  "leave", "leaves", "interrupt", "interrupts", "give", "gives", "show", "shows", "ask", "asks", "help", "helps", "send", "sends",
  "join", "offer", "offers", "thank", "trust", "trusts", "reach",
])

const YOU = /\b(you(?:rselves|rself|rs|r|’re|'re|’ve|'ve|’d|'d|’ll|'ll)?)\b/gi

const FORMS: Record<Voice, Record<string, string>> = {
  third: { you: "they", your: "their", yours: "theirs", yourself: "themselves", yourselves: "themselves", "you’re": "they’re", "you’ve": "they’ve", "you’d": "they’d", "you’ll": "they’ll", object: "them" },
  first: { you: "I", your: "my", yours: "mine", yourself: "myself", yourselves: "myself", "you’re": "I’m", "you’ve": "I’ve", "you’d": "I’d", "you’ll": "I’ll", object: "me" },
}

function matchCase(source: string, replacement: string) {
  return source[0] === source[0].toUpperCase() && source[0] !== source[0].toLowerCase() ? replacement[0].toUpperCase() + replacement.slice(1) : replacement
}

export function inVoice(text: string, voice: Voice): string {
  const forms = FORMS[voice]
  const replaced = text.replace(YOU, (match: string, _word: string, offset: number) => {
    const key = match.toLowerCase().replace(/'/g, "’")
    let target = forms[key]
    if (key === "you") {
      const before = text.slice(0, offset)
      const previous = /([A-Za-z]+)\s*$/.exec(before)?.[1]?.toLowerCase()
      const startsSentence = /(^|[.!?]\s+|[“"]\s*)$/.test(before)
      const object = !startsSentence && ((previous !== undefined && OBJECT_AFTER.has(previous)) || /\bas well as\s+$/i.test(before))
      target = object ? forms.object : forms.you
    }
    if (!target) return match
    return voice === "first" && target === "I" ? "I" : matchCase(match, target)
  })
  return voice === "first" ? replaced.replace(/\bI are\b/g, "I am").replace(/\bI were\b/g, "I was") : replaced
}

const swap = (voice: Voice) => (text: string) => inVoice(text, voice)

function viewInVoice(view: DimensionView, voice: Voice): DimensionView {
  const change = swap(voice)
  return {
    ...view,
    summary: change(view.summary),
    strengthNote: change(view.strengthNote),
    evidenceNote: change(view.evidenceNote),
    rangeNote: view.rangeNote ? change(view.rangeNote) : null,
  }
}

/** The descriptive parts of a profile, re-voiced. Advice addressed to the reader and the guide (already first person) are left alone. */
export function profileInVoice(profile: Profile, voice: Voice): Profile {
  const change = swap(voice)
  return {
    ...profile,
    headline: { ...profile.headline, statement: change(profile.headline.statement), lead: change(profile.headline.lead) },
    dimensions: Object.fromEntries(Object.entries(profile.dimensions).map(([id, view]) => [id, view ? viewInVoice(view, voice) : null])) as Profile["dimensions"],
    patterns: profile.patterns.map((pattern) => ({ ...pattern, text: change(pattern.text) })),
  }
}
