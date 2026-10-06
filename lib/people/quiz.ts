export const styleKeys = ["maker", "connector", "planner", "closer"] as const
export type StyleKey = (typeof styleKeys)[number]

export type StyleCopy = {
  title: string
  tend: string
  prefer: string
  others: string
  best: string
  discuss: string
}

export const styles: Record<StyleKey, StyleCopy> = {
  maker: {
    title: "Maker",
    tend: "You tend to reach for the work itself — a draft, a prototype, something you can finish.",
    prefer: "You may prefer a clear block of time and a concrete outcome over a long discussion.",
    others: "People working with you may find you quiet until there is something to look at.",
    best: "You may work best when meetings are short, then get out of the way.",
    discuss: "Where do I need uninterrupted time this week?",
  },
  connector: {
    title: "Connector",
    tend: "You tend to keep work moving by talking to the right people early.",
    prefer: "You may prefer to sort a stuck conversation out loud rather than let it sit.",
    others: "People working with you may find you notice when someone has gone quiet.",
    best: "You may work best when you can see the whole group, not only your own list.",
    discuss: "Who is waiting on a conversation that I could start?",
  },
  planner: {
    title: "Planner",
    tend: "You tend to want the shape of the work before the rush starts.",
    prefer: "You may prefer a shared plan, a date, and a named owner.",
    others: "People working with you may find you ask for the sequence before the details.",
    best: "You may work best when the next steps are written down and visible.",
    discuss: "What is still vague that we should name this week?",
  },
  closer: {
    title: "Closer",
    tend: "You tend to be pulled toward the decision.",
    prefer: "You may prefer to pick one option, say it out loud, and move.",
    others: "People working with you may find you get impatient while options are still open.",
    best: "You may work best when a choice is due today, not next month.",
    discuss: "What are we still treating as open that is actually ready to decide?",
  },
}

export const questions: { prompt: string; options: { label: string; style: StyleKey }[] }[] = [
  {
    prompt: "A deadline moves forward. You first…",
    options: [
      { label: "Clear the afternoon and start", style: "maker" },
      { label: "Check who else is affected", style: "connector" },
      { label: "Rewrite the plan", style: "planner" },
      { label: "Cut the scope and decide", style: "closer" },
    ],
  },
  {
    prompt: "In a meeting you usually…",
    options: [
      { label: "Wait for the part you can act on", style: "maker" },
      { label: "Make sure everyone has spoken", style: "connector" },
      { label: "Keep notes and next steps", style: "planner" },
      { label: "Push for a decision", style: "closer" },
    ],
  },
  {
    prompt: "Your best work happens when…",
    options: [
      { label: "You can stay with one task", style: "maker" },
      { label: "You are working with other people", style: "connector" },
      { label: "The sequence is already clear", style: "planner" },
      { label: "There is a result to land today", style: "closer" },
    ],
  },
  {
    prompt: "You would rather be known for…",
    options: [
      { label: "Making the thing", style: "maker" },
      { label: "Holding the group together", style: "connector" },
      { label: "Keeping the work on track", style: "planner" },
      { label: "Getting to an answer", style: "closer" },
    ],
  },
  {
    prompt: "A messy problem is…",
    options: [
      { label: "Something to prototype", style: "maker" },
      { label: "A reason to gather the people", style: "connector" },
      { label: "A reason to map the steps", style: "planner" },
      { label: "A reason to choose and proceed", style: "closer" },
    ],
  },
]

export type StyleScores = Record<StyleKey, number>

export function emptyScores(): StyleScores {
  return { maker: 0, connector: 0, planner: 0, closer: 0 }
}

export function scoreAnswers(answers: StyleKey[]): StyleScores {
  const scores = emptyScores()
  for (const answer of answers) scores[answer] += 1
  return scores
}

export function leadingStyles(scores: StyleScores): StyleKey[] {
  const max = Math.max(...styleKeys.map((key) => scores[key]))
  if (max <= 0) return []
  return styleKeys.filter((key) => scores[key] === max)
}

export function resultText(scores: StyleScores) {
  const leading = leadingStyles(scores)
  if (!leading.length) return ""
  const mix = styleKeys.map((key) => `${styles[key].title} ${scores[key]}`).join(" · ")
  const heads = leading.map((key) => styles[key])
  const title = heads.map((item) => item.title).join(" and ")
  const lines = [
    leading.length > 1
      ? `Closest read: ${title}. Most people are a mix — this is a conversation starter, not a type.`
      : `Closest read: ${title}. A light read of how you tend to work, not a personality certificate.`,
    "",
    heads.map((item) => item.tend).join(" "),
    heads.map((item) => item.prefer).join(" "),
    heads.map((item) => item.others).join(" "),
    heads.map((item) => item.best).join(" "),
    "",
    `Your five answers: ${mix}.`,
    "",
    "If you share this with the team, a useful question is:",
    heads.map((item) => `• ${item.discuss}`).join("\n"),
  ]
  return lines.join("\n")
}

export const quizStorageKey = "nb-work-style"

export type QuizState = {
  step: number
  answers: StyleKey[]
}

export function parseQuizState(raw: string | null): QuizState | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as QuizState
    if (!Array.isArray(data.answers) || typeof data.step !== "number") return null
    if (!data.answers.every((item) => styleKeys.includes(item))) return null
    if (data.answers.length > questions.length) return null
    if (data.step < 0 || data.step > questions.length) return null
    return { step: data.step, answers: data.answers }
  } catch {
    return null
  }
}
