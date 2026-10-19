import type { DimensionId, FollowUpId, Side } from "../types.ts"

// Headline identities are a communication device layered over the eight dimensions. They are
// chosen by rules over the dimension positions (see profile.ts), never assigned to everyone,
// and a hybrid or context-led headline is used when no single identity is clearly supported.

export type Identity = {
  id: string
  name: string
  /** One-sentence headline, written as something a person might say about themselves. */
  headline: string
  /** Two sentences describing the lean, using hedged language. */
  lead: string
  /** Verb phrase (no subject) used to compose hybrid headlines: “you …, and you …”. */
  clause: string
  /** The dimensions and sides this identity reads from. */
  wants: { dimension: DimensionId; side: Side }[]
  /** One reflection that turns the identity into a practical next step. */
  closing: string
}

const want = (dimension: DimensionId, side: Side) => ({ dimension, side })

export const identities: Identity[] = [
  {
    id: "quiet-architect",
    name: "The Quiet Architect",
    headline: "You think it through, then build it carefully.",
    lead: "Your answers lean towards forming your own view first, wanting the shape of the work defined early, and protecting time to concentrate. Colleagues may see the result before they see the thinking.",
    clause: "think things through and build them carefully",
    wants: [want("thinking", "a"), want("structure", "a"), want("focus", "a")],
    closing: "Your best work probably needs two things from other people: the question early, and the quiet to answer it. This week, ask for one of them out loud.",
  },
  {
    id: "thinking-partner",
    name: "The Thinking Partner",
    headline: "Your clearest ideas turn up mid-conversation.",
    lead: "Your answers lean towards thinking aloud, staying in conversation as work develops, and shaping things with others. You may not know quite what you think until you’ve heard yourself say it.",
    clause: "find clarity by talking things through",
    wants: [want("thinking", "b"), want("collaboration", "b"), want("communication", "b")],
    closing: "Conversation is part of how you think, so other people are part of your process. This week, tell one person when you’re thinking aloud so they know it’s a draft.",
  },
  {
    id: "field-tester",
    name: "The Field Tester",
    headline: "You learn fastest by trying something real.",
    lead: "Your answers lean towards committing to a working hypothesis, keeping plans flexible and changing course as you learn. A rough version may teach you more than another round of discussion.",
    clause: "learn by trying something real early",
    wants: [want("decisions", "b"), want("change", "b"), want("structure", "b")],
    closing: "Trying things early is how you find out what matters. Pair each trial with one line on what you’re assuming, so other people can learn alongside you.",
  },
  {
    id: "evidence-keeper",
    name: "The Evidence Keeper",
    headline: "You’d like the full picture before anyone commits.",
    lead: "Your answers lean towards checking before committing, getting things in writing and weighing changes before making them. People may rely on you to ask the question nobody else thought of.",
    clause: "like the full picture before anyone commits",
    wants: [want("decisions", "a"), want("communication", "a"), want("change", "a")],
    closing: "Your care shows up as questions. Say how much evidence is enough before you start, so that careful doesn’t get mistaken for slow.",
  },
  {
    id: "focused-builder",
    name: "The Focused Builder",
    headline: "Give you a clear brief and some quiet, and you deliver.",
    lead: "Your answers lean towards owning a defined piece of work, protecting long stretches of concentration and agreeing expectations early. Your most visible work may happen when nobody is asking for updates.",
    clause: "do your best work with a clear brief and protected time",
    wants: [want("focus", "a"), want("collaboration", "a"), want("structure", "a")],
    closing: "Scope and time are what let you do your best work. Tell your team when your next block is and when you’ll surface.",
  },
  {
    id: "open-door",
    name: "The Open Door",
    headline: "You work best in the middle of things.",
    lead: "Your answers lean towards a lively working rhythm, thinking aloud and hearing things promptly. You may bring energy to a room and find silence harder to read.",
    clause: "work best in the middle of things",
    wants: [want("focus", "b"), want("thinking", "b"), want("feedback", "b")],
    closing: "Being close to the action is how you stay sharp. Agree with one colleague how they can tell you when they need quiet.",
  },
  {
    id: "steady-navigator",
    name: "The Steady Navigator",
    headline: "A clear route, and a good reason to change it.",
    lead: "Your answers lean towards agreeing the plan early, checking before shifting course, and taking time over feedback. You may be the person who asks what a change replaces.",
    clause: "like a clear route and a good reason to change it",
    wants: [want("structure", "a"), want("change", "a"), want("feedback", "a")],
    closing: "Stability helps you do good work, and plans do change. Ask what a change replaces, and say how much notice you need.",
  },
  {
    id: "independent-improviser",
    name: "The Independent Improviser",
    headline: "You adapt freely inside a lane that’s clearly yours.",
    lead: "Your answers lean towards keeping plans flexible, trying things early and owning a piece of work. You may do your best thinking when nobody is steering.",
    clause: "adapt freely inside a lane that is clearly yours",
    wants: [want("structure", "b"), want("change", "b"), want("collaboration", "a")],
    closing: "Freedom to adapt works best when others know where your lane starts and ends. Share your lane, and the one thing that mustn’t move.",
  },
  {
    id: "careful-co-creator",
    name: "The Careful Co-creator",
    headline: "You build with people, and choose your words with care.",
    lead: "Your answers lean towards shaping work together while preferring written context and time to reflect before difficult conversations. You may be the one who sends the thoughtful follow-up after the meeting.",
    clause: "build with people and choose your words carefully",
    wants: [want("collaboration", "b"), want("communication", "a"), want("feedback", "a")],
    closing: "You value being close to people and giving yourself time to get things right. Tell collaborators when you’ll follow up in writing.",
  },
]

export const contextShifter = {
  id: "context-shifter",
  name: "The Context Shifter",
  headline: "Your preferences move with the situation.",
  lead: "No single style leads in your answers. That doesn’t mean you have no preferences; it often means your choices depend on the task, the stakes and who’s involved.",
  closing: "Because it depends, your most useful move is to name what it depends on. Pick one situation this week and tell a colleague which way you lean there.",
} as const

export const partialPicture = {
  id: "partial-picture",
  name: "A partial picture",
  headline: "Only part of the picture is shared here.",
  lead: "Some dimensions have been kept private or don’t have enough answers, so there’s no overall headline to draw.",
  closing: "Ask the person which parts they’d like to talk through — and share only what you’re comfortable sharing yourself.",
} as const

/** Lines the narrative may add when a person answered an adaptive follow-up. First person, hedged. */
export const contextLines: Record<FollowUpId, Record<string, string>> = {
  "decision-stakes": {
    "stakes-led": "I tend to check first when the stakes are high and test quickly when they’re low.",
    "familiarity-led": "I tend to move first in areas I know and check first in ones I don’t.",
    "reversibility-led": "How easy a decision is to undo usually decides how much I check.",
  },
  "structure-phase": {
    "open-then-precise": "I like things open while an idea is forming, and pinned down when it’s time to deliver.",
    "frame-then-free": "I like a firm frame at the start, then freedom inside it.",
    "people-led": "How much structure I want depends more on who I’m working with than on the stage.",
  },
  "focus-collab": {
    "alone-then-together": "I like to produce on my own and shape things together.",
    "together-then-alone": "I like to start together and finish alone.",
    "alternate": "I tend to alternate between working with people and working alone, day by day.",
    "balance-hard": "I want both, and I’m still working out the balance.",
  },
  "pressure-shift": {
    tighten: "Under pressure, I tend to tighten up: more structure, less discussion.",
    loosen: "Under pressure, I tend to loosen up: faster, with more improvising.",
    quiet: "Under pressure, I tend to go quiet and put my head down.",
    together: "Under pressure, I tend to pull people in and talk it through.",
  },
  "feedback-timing": {
    "hear-now-respond-later": "I’m fine hearing things straight away; I just need time before I respond.",
    "size-led": "I’m happy with quick feedback on small things and want longer on anything weighty.",
    "person-led": "How I take feedback depends a lot on who’s giving it.",
  },
}
