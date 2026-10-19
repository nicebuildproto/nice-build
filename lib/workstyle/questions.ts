import type { ChapterId, DimensionId, Effect, FollowUp, Option, Question } from "./types.ts"

// QUESTION BANK, version 2. Change wording or effects => bump ASSESSMENT_VERSION and regenerate the
// audit and the questions export with `npm run workstyle:audit`.
//
// Conventions
//  - Effect values run -2 (the “a” pole, left) to +2 (the “b” pole, right) for the named dimension.
//    Neither pole is “better”. The poles are defined in dimensions.ts.
//  - A core item names one dimension in `primary` and counts at weight 1. A cross-dimension item has
//    `primary: null`, touches two or three dimensions and counts at half weight on each (see scoring.ts).
//  - Options are written in a neutral order; each participant sees them shuffled with a seed saved for
//    the session (see order.ts). An option marked `last` always stays last.
//  - Ids are positional (q01 to q28) so a question can be found by its place in the flow.

export const ASSESSMENT_VERSION = "2026.2"

const T: DimensionId = "thinking"
const S: DimensionId = "structure"
const D: DimensionId = "decisions"
const F: DimensionId = "focus"
const M: DimensionId = "communication"
const A: DimensionId = "collaboration"
const X: DimensionId = "change"
const B: DimensionId = "feedback"

const fx = (dimension: DimensionId, value: number): Effect => ({ dimension, value })
/** “It depends”: no effect on the score, but it counts towards the dimension’s context signal. */
const ctx = (dimension: DimensionId): Effect => ({ dimension, value: 0, context: true })

const LETTERS = "abcdefgh"
type Row = [label: string, effects: Effect[], last?: "last"]
const opts = (id: string, rows: Row[]): Option[] =>
  rows.map(([label, effects, last], index) => ({ id: `${id}-${LETTERS[index]}`, label, effects, ...(last ? { last: true } : {}) }))

const HINT = {
  scale: "Slide to the statement that’s closer to you. The middle means ‘it depends’.",
  split: "Share six blocks across the options. Use all six.",
  rank: "Tap in order, most important first.",
  multi: (max: number) => `Pick up to ${({ 2: "two", 3: "three" } as Record<number, string>)[max] ?? max}.`,
} as const

export const questions: Question[] = [
  // ───────────────────────── Chapter 1 · Monday, 9am ─────────────────────────
  {
    id: "q01",
    chapter: "c1",
    format: "choice",
    primary: T,
    prompt: "Think of the last idea or solution you were really proud of. Where were you when it came together?",
    ariaLabel: "Where an idea came together",
    options: opts("q01", [
      ["On my own, on a walk or doing something unrelated", [fx(T, -2)]],
      ["At my desk, writing or sketching it out", [fx(T, -1)]],
      ["Mid-conversation, hearing myself say it out loud", [fx(T, 2)]],
      ["At a whiteboard or on a call, building on what someone else said", [fx(T, 1)]],
    ]),
  },
  {
    id: "q02",
    chapter: "c1",
    format: "choice",
    primary: S,
    prompt: "A deadline is two weeks away. Which sounds most like how it usually goes for you?",
    ariaLabel: "How a two-week deadline usually goes",
    options: opts("q02", [
      ["I split it into steps early and tick through them at a steady pace", [fx(S, -2)]],
      ["I do the hardest part first, then the rest falls into place", [fx(S, -1)]],
      ["I let it simmer, then do a focused push as the date gets closer", [fx(S, 1)]],
      ["I work on whatever the project needs that day, with no fixed schedule", [fx(S, 2)]],
    ]),
  },
  {
    id: "q03",
    chapter: "c1",
    format: "multi",
    max: 2,
    primary: F,
    prompt: "Pick the two ingredients that most often make a day feel like a good one.",
    hint: HINT.multi(2),
    ariaLabel: "What makes a day feel good",
    options: opts("q03", [
      ["A long stretch with nothing booked", [fx(F, -2)]],
      ["A few quick, unplanned chats", [fx(F, 2)]],
      ["A clear list I can work through", [fx(F, -1)]],
      ["A mix of different kinds of task", [fx(F, 1)]],
      ["People working nearby", [fx(F, 1)]],
      ["Knowing nobody expects a reply for a while", [fx(F, -2)]],
    ]),
  },
  {
    id: "q04",
    chapter: "c1",
    format: "scale",
    primary: A,
    prompt: "After your manager hands you an important goal, you’d like them to…",
    hint: HINT.scale,
    ariaLabel: "What you want from a manager after being handed a goal",
    left: "Leave me to it. I’ll shout if I need anything.",
    right: "Stay in the loop as it takes shape. I think best with a sounding board.",
    flip: false,
  },
  {
    id: "q05",
    chapter: "c1",
    format: "split",
    total: 6,
    unit: "blocks",
    primary: M,
    prompt: "Of everything you say and hear at work, how would you ideally split it?",
    hint: HINT.split,
    ariaLabel: "How you would split what you say and hear at work",
    options: opts("q05", [
      ["Longer written notes or docs I can reread", [fx(M, -2)]],
      ["Short written updates and replies", [fx(M, -1)]],
      ["Scheduled calls or meetings", [fx(M, 1)]],
      ["Quick chats and spontaneous conversations", [fx(M, 2)]],
    ]),
  },
  {
    id: "q06",
    chapter: "c1",
    format: "multi",
    max: 3,
    primary: X,
    prompt: "Which of these would give you a lift on a Monday? Pick up to three.",
    hint: HINT.multi(3),
    ariaLabel: "What would give you a lift on a Monday",
    options: opts("q06", [
      ["A new priority that replaces an old one", [fx(X, 2)]],
      ["A process I know I can rely on for months", [fx(X, -2)]],
      ["A first attempt that might fail", [fx(X, 2)]],
      ["Digging deeper into something already agreed", [fx(X, -1)]],
      ["An open brief with no obvious answer", [fx(X, 1)]],
      ["Polishing something that already works", [fx(X, -2)]],
    ]),
  },
  {
    id: "q07",
    chapter: "c1",
    format: "scale",
    primary: D,
    prompt: "Which mistake is harder for you to shrug off?",
    hint: HINT.scale,
    ariaLabel: "Which mistake is harder to shrug off",
    left: "Acting on a hunch, then finding out an hour of checking would have caught it",
    right: "Spending weeks analysing something a quick test would have settled",
    flip: true,
  },

  // ───────────────────────── Chapter 2 · Deep in it ─────────────────────────
  {
    id: "q08",
    chapter: "c2",
    format: "choice",
    primary: T,
    prompt: "A meeting is moving fast, and the topic is one you have views on. What do you usually do?",
    ariaLabel: "What you do in a fast-moving meeting",
    options: opts("q08", [
      ["Speak early and refine as I go", [fx(T, 2)]],
      ["Jump in once someone else’s point sparks mine", [fx(T, 1)]],
      ["Wait until I have a clear point, then say it once", [fx(T, -1)]],
      ["Listen throughout and follow up afterwards", [fx(T, -2)]],
    ]),
  },
  {
    id: "q09",
    chapter: "c2",
    format: "scale",
    primary: S,
    prompt: "Next week’s calendar, ideally…",
    hint: HINT.scale,
    ariaLabel: "Your ideal calendar for next week",
    left: "Every block has a purpose. I’m fine with little room for surprises.",
    right: "Plenty of gaps for whatever turns up. I’m fine not knowing what Thursday holds.",
    flip: false,
  },
  {
    id: "q10",
    chapter: "c2",
    format: "choice",
    primary: D,
    prompt: "Your team is split between two plausible routes, and nobody has proof. What would you push for?",
    ariaLabel: "What you would push for when the team is split",
    options: opts("q10", [
      ["Pull together the data and examples that exist, then choose", [fx(D, -2)]],
      ["Run a small pilot of each and let the results decide", [fx(D, 2)]],
      ["Pick the one that’s easiest to reverse and move", [fx(D, 1)]],
      ["Ask the most experienced person to make the call", [fx(D, -1)]],
    ]),
  },
  {
    id: "q11",
    chapter: "c2",
    format: "split",
    total: 6,
    unit: "blocks",
    primary: F,
    prompt: "Picture your ideal week. How would you share out your time?",
    hint: HINT.split,
    ariaLabel: "How you would share out your time in an ideal week",
    options: opts("q11", [
      ["Long, uninterrupted stretches on one thing", [fx(F, -2)]],
      ["Planned solo blocks of an hour or two", [fx(F, -1)]],
      ["Short bursts across lots of different tasks", [fx(F, 1)]],
      ["Working alongside other people", [fx(F, 2)]],
    ]),
  },
  {
    id: "q12",
    chapter: "c2",
    format: "choice",
    primary: A,
    prompt: "On a shared project, when do you feel most responsible for how it turns out?",
    ariaLabel: "When you feel most responsible on a shared project",
    options: opts("q12", [
      ["When one piece has my name on it and I can run it my way", [fx(A, -2)]],
      ["When we all sign off on the whole thing together", [fx(A, 2)]],
      ["When I own the result but can pull people in as I need them", [fx(A, 1)]],
      ["When I can hand over my part and trust the others with theirs", [fx(A, -1)]],
    ]),
  },
  {
    id: "q13",
    chapter: "c2",
    format: "choice",
    primary: B,
    prompt: "In a meeting, a senior colleague proposes a plan you have doubts about. What do you usually do?",
    ariaLabel: "What you do when you doubt a senior colleague’s plan",
    options: opts("q13", [
      ["Say so right then, politely", [fx(B, 2)]],
      ["Ask questions that bring the problem out", [fx(B, 1)]],
      ["Raise it one-to-one afterwards", [fx(B, -1)]],
      ["Think it through and send my concerns in writing", [fx(B, -2)]],
    ]),
  },
  {
    id: "q14",
    chapter: "c2",
    format: "scale",
    primary: X,
    prompt: "Mid-sprint, you spot an idea that might matter more than what’s on the list. You’d rather…",
    hint: HINT.scale,
    ariaLabel: "What you would do with a promising idea mid-sprint",
    left: "Note it and protect the plan. I’ll accept I might miss it.",
    right: "Look into it now. I’ll accept some loose ends.",
    flip: true,
  },

  // ───────────────────────── Chapter 3 · Plot twist ─────────────────────────
  {
    id: "q15",
    chapter: "c3",
    format: "choice",
    primary: F,
    prompt: "A colleague sends a non-urgent question while you’re mid-task. What happens next?",
    ariaLabel: "What happens when a colleague interrupts mid-task",
    options: opts("q15", [
      ["I finish my thought, then reply when I surface", [fx(F, -2)]],
      ["I glance, answer if it’s quick, and carry on", [fx(F, 1)]],
      ["I reply straight away. Switching doesn’t bother me", [fx(F, 2)]],
      ["I’d have muted notifications, so I’d see it later", [fx(F, -1)]],
    ]),
  },
  {
    id: "q16",
    chapter: "c3",
    format: "choice",
    primary: X,
    prompt: "Three days before a launch, a stakeholder asks for a significant change. What do you do first?",
    ariaLabel: "What you do first when a late change is requested",
    options: opts("q16", [
      ["Find out what’s driving it and what it would affect, then respond", [fx(X, -2)]],
      ["Agree to the cheap part now and park the rest", [fx(X, 1)]],
      ["Adapt quickly and re-plan as we go", [fx(X, 2)]],
      ["Hold the plan unless there’s a strong reason to change", [fx(X, -1)]],
    ]),
  },
  {
    id: "q17",
    chapter: "c3",
    format: "rank",
    primary: D,
    prompt: "Rank what would make you comfortable committing to a decision. Most important first.",
    hint: HINT.rank,
    ariaLabel: "Rank what makes you comfortable committing to a decision",
    options: opts("q17", [
      ["Numbers or sources that add up", [fx(D, -2)]],
      ["A small trial that worked", [fx(D, 2)]],
      ["Someone I trust has done it before", [fx(D, -1)]],
      ["Knowing we can undo it if needed", [fx(D, 1)]],
    ]),
  },
  {
    id: "q18",
    chapter: "c3",
    format: "choice",
    primary: null,
    tag: "pressure",
    prompt: "It’s the afternoon before a deadline, and you’re behind. What do you do?",
    ariaLabel: "What you do when you’re behind the afternoon before a deadline",
    options: opts("q18", [
      ["Close the door and work through it alone", [fx(F, -2), fx(A, -2)]],
      ["Pull in a couple of people and tackle it together", [fx(A, 2), fx(T, 1)]],
      ["Re-plan the remaining hours and sequence what’s left", [fx(S, -2), fx(X, -1)]],
      ["Cut the scope, tell everyone, and ship what’s solid", [fx(X, 1), fx(M, 1), fx(S, 1)]],
    ]),
  },
  {
    id: "q19",
    chapter: "c3",
    format: "choice",
    primary: B,
    prompt: "Someone tells you a piece of your work missed the mark. What’s your first instinct?",
    ariaLabel: "Your first instinct when told your work missed the mark",
    options: opts("q19", [
      ["Ask questions now and talk it through", [fx(B, 2)]],
      ["Listen, say thanks, and take it away to think", [fx(B, -2)]],
      ["Ask them to send it in writing", [fx(B, -1)]],
      ["Get started on a fix, then check back", [fx(B, 1)]],
    ]),
  },
  {
    id: "q20",
    chapter: "c3",
    format: "scale",
    primary: T,
    prompt: "Which kind of day leaves you more drained? Slide toward the one that drains you more.",
    hint: HINT.scale,
    ariaLabel: "Which kind of day drains you more",
    left: "A day of talking things through while they’re still half-formed",
    right: "A day of working things out alone, with nobody to bounce them off",
    flip: false,
  },
  {
    id: "q21",
    chapter: "c3",
    format: "multi",
    max: 2,
    primary: null,
    prompt: "Which two of these annoy you most at work?",
    hint: HINT.multi(2),
    ariaLabel: "What annoys you most at work",
    options: opts("q21", [
      ["Meetings that could have been a message", [fx(M, -2), fx(F, -1)]],
      ["Messages that needed a conversation", [fx(M, 2)]],
      ["Plans that change without warning", [fx(S, -2), fx(X, -1)]],
      ["Plans so fixed that nothing can adjust", [fx(S, 2), fx(X, 1)]],
      ["Waiting on other people before I can move", [fx(A, -2)]],
      ["Decisions made without my input", [fx(A, 2)]],
    ]),
  },

  // ───────────────────────── Chapter 4 · From the outside ─────────────────────────
  {
    id: "q22",
    chapter: "c4",
    format: "choice",
    primary: S,
    prompt: "To you, a good plan is mostly…",
    ariaLabel: "What a good plan is to you",
    options: opts("q22", [
      ["A promise we hold each other to", [fx(S, -2)]],
      ["A checklist so nothing gets dropped", [fx(S, -1)]],
      ["A starting hypothesis for the first week", [fx(S, 1)]],
      ["A best guess we expect to rewrite", [fx(S, 2)]],
    ]),
  },
  {
    id: "q23",
    chapter: "c4",
    format: "choice",
    primary: M,
    prompt: "You haven’t heard from a teammate on a shared project for a few days. What do you tend to assume?",
    ariaLabel: "What you assume when a teammate goes quiet",
    options: opts("q23", [
      ["They’re busy and it’s on track", [fx(M, -2)]],
      ["I’d send a quick message to see how it’s going", [fx(M, 1)]],
      ["Something might be stuck, so I’d get on a call", [fx(M, 2)]],
      ["We should have agreed a rhythm so I didn’t have to guess", [fx(M, -1)]],
      ["It depends who it is", [ctx(M)], "last"],
    ]),
  },
  {
    id: "q24",
    chapter: "c4",
    format: "split",
    total: 6,
    unit: "blocks",
    primary: A,
    prompt: "On work you care about, how would you like decisions to be shared out?",
    hint: HINT.split,
    ariaLabel: "How you would like decisions to be shared out",
    options: opts("q24", [
      ["Things I decide on my own", [fx(A, -2)]],
      ["Things someone else decides, and I carry out", [fx(A, -1)]],
      ["Things I decide with one or two people", [fx(A, 1)]],
      ["Things the whole group decides together", [fx(A, 2)]],
    ]),
  },
  {
    id: "q25",
    chapter: "c4",
    format: "rank",
    primary: B,
    prompt: "Rank what makes tough feedback easiest to take in. Most helpful first.",
    hint: HINT.rank,
    ariaLabel: "Rank what makes tough feedback easiest to take in",
    options: opts("q25", [
      ["A proper back-and-forth conversation", [fx(B, 1)]],
      ["Time to take it in before I reply", [fx(B, -2)]],
      ["Getting it soon, while it’s fresh", [fx(B, 2)]],
      ["Having it in writing to come back to", [fx(B, -1)]],
    ]),
  },
  {
    id: "q26",
    chapter: "c4",
    format: "multi",
    max: 2,
    primary: null,
    prompt: "If you could only keep two of these at work, which two?",
    hint: HINT.multi(2),
    ariaLabel: "Which two things you would keep at work",
    options: opts("q26", [
      ["Quiet time to think before I commit", [fx(T, -2), fx(F, -1)]],
      ["Quick back-and-forth to shape ideas", [fx(T, 2), fx(M, 1)]],
      ["A plan I can trust", [fx(S, -2), fx(X, -1)]],
      ["Room to change course", [fx(S, 2), fx(X, 1)]],
      ["Clear ownership of my piece", [fx(A, -2)]],
      ["A team to build it with", [fx(A, 2)]],
    ]),
  },
  {
    id: "q27",
    chapter: "c4",
    format: "choice",
    primary: M,
    prompt: "You’re handing a project to a colleague. How do you set them up?",
    ariaLabel: "How you set up a colleague taking over a project",
    options: opts("q27", [
      ["A detailed written doc they can reread", [fx(M, -2)]],
      ["A walkthrough, then notes", [fx(M, 1)]],
      ["A shared chat where they can ask anything as it comes up", [fx(M, 2)]],
      ["A short summary plus a standing weekly catch-up", [fx(M, -1)]],
    ]),
  },
  {
    id: "q28",
    chapter: "c4",
    format: "multi",
    max: 2,
    primary: null,
    prompt: "On a tough day, which of these might a colleague say about working with you? Pick up to two that feel fair.",
    hint: HINT.multi(2),
    ariaLabel: "What a colleague might say about working with you on a tough day",
    options: opts("q28", [
      ["“Goes quiet and disappears into the work”", [fx(T, -1), fx(F, -1), fx(A, -1)]],
      ["“Talks it through at length, sometimes past the point it helps”", [fx(T, 1), fx(M, 1)]],
      ["“Holds on tight to the plan”", [fx(S, -1), fx(X, -1)]],
      ["“Changes direction faster than we can follow”", [fx(S, 1), fx(X, 1)]],
      ["“Pushes back before they’ve heard everything”", [fx(B, 1)]],
      ["“Needs time before replying and can seem unreachable”", [fx(B, -1), fx(M, -1)]],
      ["“Wants more proof before moving”", [fx(D, -1)]],
      ["“Tries things before we’ve agreed they’re worth it”", [fx(D, 1)]],
    ]),
  },
]

// ───────────────────────── Adaptive follow-ups ─────────────────────────
// Each follow-up fires only when it can resolve a specific ambiguity. Follow-ups never change a
// dimension score: any option scores 0 and records the person’s own “it depends on…” note for the guide.
// They are optional (skippable), asked at most once, capped at MAX_FOLLOW_UPS per run, and can never
// trigger another follow-up.

export const MAX_FOLLOW_UPS = 3

/** Contexts that are not written into the guide. */
const NO_NOTE = new Set(["varies", "same"])
export const recordsNote = (context: string) => !NO_NOTE.has(context)

const hint = "Just a quick one. Skip it if none fit."

export const followUps: FollowUp[] = [
  {
    id: "decision-stakes",
    chapter: "c3",
    dimensions: ["decisions"],
    trigger: { kind: "conflict", dimensions: ["decisions"] },
    prompt: "Your answers about deciding pointed in different directions. Which sounds most like you?",
    hint,
    ariaLabel: "Follow-up about how you decide",
    options: [
      { id: "ds-stakes", label: "I check first when the stakes are high and test quickly when they’re low", context: "stakes-led" },
      { id: "ds-familiar", label: "I move first in areas I know and check first in ones I don’t", context: "familiarity-led" },
      { id: "ds-undo", label: "It depends on how easy the decision is to undo", context: "reversibility-led" },
      { id: "ds-varies", label: "It varies too much for a simple rule", context: "varies" },
    ],
  },
  {
    id: "pressure-shift",
    chapter: "c3",
    dimensions: [],
    private: true,
    trigger: { kind: "pressure", questionId: "q18", minShift: 1.5 },
    prompt: "When time is tight, you do something a little different from your usual approach. Which is closest?",
    hint,
    ariaLabel: "Follow-up about how you work under pressure",
    options: [
      { id: "ps-tighten", label: "I tighten up: more structure, less discussion", context: "tighten" },
      { id: "ps-loosen", label: "I loosen up: faster, more improvising", context: "loosen" },
      { id: "ps-quiet", label: "I go quiet and head down", context: "quiet" },
      { id: "ps-together", label: "I pull people in and talk it through", context: "together" },
      { id: "ps-same", label: "Not really different", context: "same" },
    ],
  },
  {
    id: "structure-phase",
    chapter: "c4",
    dimensions: ["structure"],
    trigger: { kind: "conflict", dimensions: ["structure"] },
    prompt: "Your answers about planning pointed in different directions. Which sounds most like you?",
    hint,
    ariaLabel: "Follow-up about planning and flexibility",
    options: [
      { id: "sp-open-precise", label: "I like things open while an idea is forming, then pinned down when it’s time to deliver", context: "open-then-precise" },
      { id: "sp-frame-free", label: "I like a firm frame at the start, then freedom inside it", context: "frame-then-free" },
      { id: "sp-people", label: "It depends more on who I’m working with than on the stage", context: "people-led" },
      { id: "sp-varies", label: "It varies too much for a simple rule", context: "varies" },
    ],
  },
  {
    id: "focus-collab",
    chapter: "c4",
    dimensions: ["focus", "collaboration"],
    trigger: { kind: "conflict", dimensions: ["focus", "collaboration"] },
    prompt: "Your answers about focus time and working with others pointed in different directions. How do the two fit together for you?",
    hint,
    ariaLabel: "Follow-up about collaboration and focus time",
    options: [
      { id: "fc-alone-then-together", label: "Alone to produce, together to shape", context: "alone-then-together" },
      { id: "fc-together-then-alone", label: "Together to start, alone to finish", context: "together-then-alone" },
      { id: "fc-alternate", label: "I alternate, day by day", context: "alternate" },
      { id: "fc-balance", label: "Both matter, and getting the balance right is the hard part", context: "balance-hard" },
    ],
  },
  {
    id: "feedback-timing",
    chapter: "c4",
    dimensions: ["feedback"],
    trigger: { kind: "conflict", dimensions: ["feedback"] },
    prompt: "Your answers about feedback pointed in different directions. Which sounds most like you?",
    hint,
    ariaLabel: "Follow-up about feedback timing",
    options: [
      { id: "ft-hear-now", label: "I’m fine hearing it right away; I just need time before I respond", context: "hear-now-respond-later" },
      { id: "ft-size", label: "Quick for small things, slower for anything weighty", context: "size-led" },
      { id: "ft-person", label: "It depends who is giving it", context: "person-led" },
      { id: "ft-varies", label: "It varies too much for a simple rule", context: "varies" },
    ],
  },
]

export function getQuestion(id: string): Question | undefined {
  return questions.find((question) => question.id === id)
}

export function getFollowUp(id: string): FollowUp | undefined {
  return followUps.find((followUp) => followUp.id === id)
}

export function questionsInChapter(chapter: ChapterId): Question[] {
  return questions.filter((question) => question.chapter === chapter)
}

/** Questions in the order they are asked. Chapters are contiguous in the array. */
export const questionOrder: string[] = questions.map((question) => question.id)
