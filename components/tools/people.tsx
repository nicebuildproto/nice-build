"use client"

import { CopyButton, TextArea } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { useMemo, useState } from "react"

const styles = {
  maker: {
    title: "Maker",
    copy: "You do your best work with a clear block of time and something concrete to finish. Meetings help when they are short and then get out of the way.",
  },
  connector: {
    title: "Connector",
    copy: "You keep the work moving by talking to the right people early. You notice when someone is stuck, and you would rather sort it out than let it sit.",
  },
  planner: {
    title: "Planner",
    copy: "You want the shape of the work before the rush starts. A shared plan, a date, and a named owner make the rest of the week easier.",
  },
  closer: {
    title: "Closer",
    copy: "You are pulled toward the decision. Options are useful, but you would rather pick one, say it out loud, and move.",
  },
} as const

type StyleKey = keyof typeof styles

const questions: { prompt: string; options: { label: string; style: StyleKey }[] }[] = [
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

export function WorkStyleQuiz() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<StyleKey[]>([])
  const question = questions[step]
  const result = useMemo(() => {
    if (answers.length < questions.length) return null
    const scores = { maker: 0, connector: 0, planner: 0, closer: 0 }
    for (const answer of answers) scores[answer] += 1
    return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] ?? "maker") as StyleKey
  }, [answers])

  if (result) {
    const style = styles[result]
    return (
      <div className="flex max-w-xl flex-col gap-4">
        <p className="text-xs font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">A light read</p>
        <h2 className="text-4xl font-semibold tracking-[-0.03em]">{style.title}</h2>
        <p className="text-sm leading-relaxed text-[var(--nb-secondary)]">{style.copy}</p>
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={() => {
            setAnswers([])
            setStep(0)
          }}
        >
          Start again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <p className="text-sm text-[var(--nb-secondary)]">
        {step + 1} of {questions.length}
      </p>
      <h2 className="text-2xl font-semibold tracking-[-0.03em]">{question.prompt}</h2>
      <div className="flex flex-col gap-2">
        {question.options.map((option) => (
          <button
            key={option.label}
            type="button"
            className="rounded-xl border border-border px-4 py-3 text-left text-[15px] transition-colors hover:bg-[var(--nb-accent)]"
            onClick={() => {
              setAnswers((current) => [...current, option.style])
              setStep((value) => value + 1)
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const roles = ["", "R", "A", "C", "I"] as const

export function RaciGenerator() {
  const [peopleText, setPeopleText] = useState("Alex\nSam\nJordan")
  const [tasksText, setTasksText] = useState("Brief\nDesign\nBuild\nReview")
  const people = peopleText.split("\n").map((name) => name.trim()).filter(Boolean)
  const tasks = tasksText.split("\n").map((task) => task.trim()).filter(Boolean)
  const [grid, setGrid] = useState<Record<string, string>>({})

  function cycle(key: string) {
    setGrid((current) => {
      const index = roles.indexOf((current[key] ?? "") as (typeof roles)[number])
      const next = roles[(index + 1) % roles.length]
      return { ...current, [key]: next }
    })
  }

  const table = [
    ["Task", ...people].join("\t"),
    ...tasks.map((task) => [task, ...people.map((person) => grid[`${task}|${person}`] || "")].join("\t")),
  ].join("\n")

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <TextArea label="People" value={peopleText} onChange={setPeopleText} rows={4} />
        <TextArea label="Tasks" value={tasksText} onChange={setTasksText} rows={4} />
      </div>
      <p className="text-[13px] text-[var(--nb-secondary)]">Click a cell to cycle through Responsible, Accountable, Consulted, and Informed.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left font-medium text-[var(--nb-secondary)]">Task</th>
              {people.map((person) => (
                <th key={person} className="p-2 text-left font-medium">
                  {person}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task} className="border-t border-border">
                <td className="p-2">{task}</td>
                {people.map((person) => {
                  const key = `${task}|${person}`
                  return (
                    <td key={person} className="p-2">
                      <button
                        type="button"
                        onClick={() => cycle(key)}
                        className="size-9 rounded-full bg-[var(--nb-accent)] text-sm font-medium"
                      >
                        {grid[key] || ""}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CopyButton text={table} label="Copy table" />
    </div>
  )
}
