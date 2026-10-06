"use client"

import {
  ActionBar,
  CopyReset,
  CopyTextButton,
  DocumentPreview,
  DownloadTxt,
  PeopleToolShell,
  PrivacyNote,
  PrintButton,
  ResultSection,
} from "@/components/people/kit"
import { Field, NumberField, parseAmount, ResetButton, TextArea } from "@/components/tools/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  leadingStyles,
  parseQuizState,
  questions,
  quizStorageKey,
  resultText,
  scoreAnswers,
  styles,
  styleKeys,
  type StyleKey,
} from "@/lib/people/quiz"
import {
  meetingAgenda,
  meetingCost,
  nextFromBag,
  nextRaci,
  oneOnOneAgenda,
  raciCsv,
  raciLegend,
  raciRows,
  raciTsv,
  splitLines,
  workingAgreement,
} from "@/lib/people/team"
import { money } from "@/lib/tools/format"
import { icebreakers } from "@/lib/tools/pure"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"

export function WorkStyleQuiz() {
  const [ready, setReady] = useState(false)
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<StyleKey[]>([])

  useEffect(() => {
    const stored = parseQuizState(sessionStorage.getItem(quizStorageKey))
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate quiz from this tab
      setStep(stored.step)
      setAnswers(stored.answers)
      setStarted(true)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (!started && answers.length === 0) {
      sessionStorage.removeItem(quizStorageKey)
      return
    }
    sessionStorage.setItem(quizStorageKey, JSON.stringify({ step, answers }))
  }, [ready, started, step, answers])

  const scores = useMemo(() => scoreAnswers(answers), [answers])
  const done = answers.length >= questions.length
  const leading = leadingStyles(scores)
  const question = questions[step]

  function choose(style: StyleKey) {
    setAnswers((current) => {
      const next = current.slice(0, step)
      next[step] = style
      return next
    })
    setStep((value) => value + 1)
  }

  function back() {
    if (step === 0) return
    setStep((value) => value - 1)
    setAnswers((current) => current.slice(0, step - 1))
  }

  function reset() {
    setAnswers([])
    setStep(0)
    setStarted(false)
    sessionStorage.removeItem(quizStorageKey)
  }

  if (!ready) return <PeopleToolShell><PrivacyNote /></PeopleToolShell>

  if (done) {
    const copy = resultText(scores)
    const title = leading.map((key) => styles[key].title).join(" and ")
    return (
      <PeopleToolShell>
        <PrivacyNote>Your answers stayed on this device. This is a conversation starter, not a personality type or a hiring test.</PrivacyNote>
        <ResultSection title={leading.length > 1 ? `Closest read: ${title}` : title}>
          {leading.map((key) => (
            <div key={key} className="flex flex-col gap-2">
              {leading.length > 1 ? <h3 className="text-lg font-medium">{styles[key].title}</h3> : null}
              <p className="text-sm leading-relaxed text-[var(--nb-primary)]">{styles[key].tend}</p>
              <p className="text-sm leading-relaxed text-[var(--nb-secondary)]">{styles[key].prefer}</p>
              <p className="text-sm leading-relaxed text-[var(--nb-secondary)]">{styles[key].others}</p>
              <p className="text-sm leading-relaxed text-[var(--nb-secondary)]">{styles[key].best}</p>
            </div>
          ))}
        </ResultSection>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="How the five answers landed">
          {styleKeys.map((key) => (
            <div key={key}>
              <p className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">{styles[key].title}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{scores[key]}</p>
            </div>
          ))}
        </div>
        <div className="max-w-xl rounded-xl border border-border px-4 py-3">
          <p className="text-[11px] font-medium tracking-[0.14em] text-[var(--nb-secondary)] uppercase">If you share this</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-[var(--nb-primary)]">
            {leading.map((key) => (
              <li key={key}>{styles[key].discuss}</li>
            ))}
          </ul>
        </div>
        <CopyReset text={copy} filename="work-style.txt" onReset={reset} copyLabel="Copy result" />
      </PeopleToolShell>
    )
  }

  if (!started) {
    return (
      <PeopleToolShell>
        <PrivacyNote>Five questions. Your answers stay on this device — a light read of how you tend to work, not a certificate.</PrivacyNote>
        <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
          Most people are a mix of making, connecting, planning, and closing. The result is something to talk about with a team, not a label to hire against.
        </p>
        <Button type="button" className="h-10 w-fit" onClick={() => setStarted(true)}>
          Start
        </Button>
      </PeopleToolShell>
    )
  }

  if (!question) return null

  const progress = ((step + 1) / questions.length) * 100

  return (
    <PeopleToolShell>
      <PrivacyNote />
      <div className="flex max-w-xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--nb-secondary)]">
            {step + 1} of {questions.length}
          </p>
          {step > 0 ? (
            <button type="button" className="text-sm text-[var(--nb-secondary)] underline-offset-4 hover:underline" onClick={back}>
              Back
            </button>
          ) : null}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-border" aria-hidden>
          <div className="h-full bg-[var(--nb-primary)] motion-reduce:transition-none" style={{ width: `${progress}%` }} />
        </div>
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">{question.prompt}</h2>
        <div role="radiogroup" aria-label={question.prompt} className="flex flex-col gap-2">
          {question.options.map((option) => {
            const selected = answers[step] === option.style
            return (
              <button
                key={option.label}
                type="button"
                role="radio"
                aria-checked={selected}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left text-[15px] outline-none transition-colors motion-reduce:transition-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "border-[var(--nb-primary)] bg-[var(--nb-accent)]"
                    : "border-border hover:bg-[var(--nb-accent)]",
                )}
                onClick={() => choose(option.style)}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </PeopleToolShell>
  )
}

export function MeetingCost() {
  const [people, setPeople] = useState("6")
  const [rate, setRate] = useState("85")
  const [minutes, setMinutes] = useState("45")
  const [perMonth, setPerMonth] = useState("4")
  const count = parseAmount(people)
  const hourly = parseAmount(rate)
  const mins = parseAmount(minutes)
  const times = parseAmount(perMonth)
  const result =
    count === null || hourly === null || mins === null || times === null
      ? null
      : meetingCost(count, hourly, mins, times)

  const copy = result
    ? `Each meeting: ${money(result.meeting)}\nEach month: ${money(result.month)}\nEach year: ${money(result.year)}\nAbout ${Math.round(result.hoursYear)} hours of people's time a year.`
    : ""

  return (
    <PeopleToolShell>
      <PrivacyNote>The numbers stay on this page. Use the rate that matches the decision — payroll or charge-out.</PrivacyNote>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="People" value={people} onChange={setPeople} min={1} step="1" />
        <NumberField label="Average hourly cost" value={rate} onChange={setRate} suffix="AUD" min={0} />
        <NumberField label="Length" value={minutes} onChange={setMinutes} suffix="min" min={0} />
        <NumberField label="Times each month" value={perMonth} onChange={setPerMonth} min={0} />
      </div>
      {result ? (
        <ResultSection>
          <p className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">If this keeps running for a year</p>
          <p className="text-4xl font-semibold tracking-[-0.04em] tabular-nums sm:text-5xl">{money(result.year)}</p>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--nb-secondary)]">
            {money(result.meeting)} each sitting, {money(result.month)} a month. About {Math.round(result.hoursYear)} hours of people’s time in a year.
          </p>
          <dl className="grid grid-cols-2 gap-4 sm:max-w-md">
            <div>
              <dt className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">Each meeting</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{money(result.meeting)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium tracking-[0.08em] text-[var(--nb-secondary)] uppercase">Each month</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{money(result.month)}</dd>
            </div>
          </dl>
        </ResultSection>
      ) : (
        <p className="text-sm text-[var(--nb-secondary)]">Enter people, a rate, and a length to see the cost.</p>
      )}
      <CopyReset
        text={copy}
        filename="meeting-cost.txt"
        onReset={() => {
          setPeople("6")
          setRate("85")
          setMinutes("45")
          setPerMonth("4")
        }}
        copyLabel="Copy result"
      />
    </PeopleToolShell>
  )
}

export function RaciGenerator() {
  const [peopleText, setPeopleText] = useState("Alex\nSam\nJordan")
  const [tasksText, setTasksText] = useState("Brief\nDesign\nBuild\nReview")
  const [grid, setGrid] = useState<Record<string, string>>({})
  const people = [...new Set(splitLines(peopleText))]
  const tasks = [...new Set(splitLines(tasksText))]
  const rows = raciRows(tasks, people, grid)
  const table = raciTsv(tasks, people, grid)
  const csv = raciCsv(tasks, people, grid)
  const empty = !people.length || !tasks.length

  return (
    <PeopleToolShell>
      <PrivacyNote>Names and tasks stay on this page. Copy or download the grid if you want to keep it.</PrivacyNote>
      <div className="grid gap-4 lg:grid-cols-2">
        <TextArea label="People" value={peopleText} onChange={setPeopleText} rows={4} placeholder="One name a line" />
        <TextArea label="Tasks" value={tasksText} onChange={setTasksText} rows={4} placeholder="One task a line" />
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[var(--nb-secondary)]">
        {raciLegend.map((item) => (
          <li key={item.id}>
            <span className="font-medium text-[var(--nb-primary)]">{item.id}</span> {item.label} — {item.meaning}
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-[var(--nb-secondary)]">Click a cell to cycle R, A, C, and I. Aim for one accountable on each task.</p>
      {empty ? (
        <p className="text-sm text-[var(--nb-secondary)]">Add at least one person and one task.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 bg-background p-2 text-left font-medium text-[var(--nb-secondary)]">Task</th>
                {people.map((person) => (
                  <th key={person} className="max-w-32 p-2 text-left font-medium break-words">
                    {person}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.task} className="border-t border-border">
                  <th scope="row" className="sticky left-0 bg-background p-2 text-left font-normal">
                    <span className="break-words">{row.task}</span>
                    {row.issues.length ? (
                      <span className="mt-1 block text-[12px] text-[var(--nb-secondary)]">{row.issues.join(". ")}.</span>
                    ) : null}
                  </th>
                  {people.map((person, index) => {
                    const key = `${row.task}|${person}`
                    const value = row.cells[index]
                    const label = raciLegend.find((item) => item.id === value)?.label ?? "None"
                    return (
                      <td key={person} className="p-2">
                        <button
                          type="button"
                          onClick={() => setGrid((current) => ({ ...current, [key]: nextRaci(current[key] || "") }))}
                          aria-label={`${person} on ${row.task}: ${label}. Cycle role.`}
                          className={cn(
                            "size-10 rounded-full text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                            value ? "bg-[var(--nb-accent)] text-[var(--nb-primary)]" : "bg-muted text-[var(--nb-secondary)]",
                          )}
                        >
                          {value || "·"}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ActionBar>
        <CopyTextButton text={table} label="Copy table" />
        <DownloadTxt text={csv} filename="raci.csv" label="Download .csv" />
        <PrintButton />
        <ResetButton
          label="Clear"
          onClick={() => {
            setPeopleText("")
            setTasksText("")
            setGrid({})
          }}
        />
      </ActionBar>
    </PeopleToolShell>
  )
}

export function TeamWorkingAgreement() {
  const [team, setTeam] = useState("Studio")
  const [hours, setHours] = useState("We overlap 10:00–15:00 local.")
  const [response, setResponse] = useState("Same day for a blocker, next day otherwise.")
  const [decisions, setDecisions] = useState("The person doing the work proposes. We disagree in the open, then commit.")
  const text = workingAgreement({ team, hours, response, decisions })

  return (
    <PeopleToolShell>
      <PrivacyNote>This is a draft to copy, not a contract. It stays on this page until you copy or download it.</PrivacyNote>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Field label="Team">
            <Input value={team} onChange={(event) => setTeam(event.target.value)} className="h-11 sm:h-10" />
          </Field>
          <Field label="Hours">
            <Input value={hours} onChange={(event) => setHours(event.target.value)} className="h-11 sm:h-10" />
          </Field>
          <Field label="Response">
            <Input value={response} onChange={(event) => setResponse(event.target.value)} className="h-11 sm:h-10" />
          </Field>
          <TextArea label="How we decide" value={decisions} onChange={setDecisions} rows={4} />
        </div>
        <DocumentPreview label="Agreement" text={text} />
      </div>
      <CopyReset
        text={text}
        filename="working-agreement.txt"
        onReset={() => {
          setTeam("")
          setHours("")
          setResponse("")
          setDecisions("")
        }}
      />
    </PeopleToolShell>
  )
}

export function MeetingAgenda() {
  const [title, setTitle] = useState("Weekly studio")
  const [when, setWhen] = useState("Monday 10:00")
  const [items, setItems] = useState("What shipped\nWhat is stuck\nWhat we will decide")
  const text = meetingAgenda(title, when, items)

  return (
    <PeopleToolShell>
      <PrivacyNote>The agenda stays on this page. Copy it into the calendar invite yourself.</PrivacyNote>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Field label="Meeting">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} className="h-11 sm:h-10" />
          </Field>
          <Field label="When">
            <Input value={when} onChange={(event) => setWhen(event.target.value)} className="h-11 sm:h-10" />
          </Field>
          <TextArea label="Items" value={items} onChange={setItems} rows={8} placeholder="One item a line" />
        </div>
        <DocumentPreview label="Agenda" text={text} />
      </div>
      <CopyReset
        text={text}
        filename="agenda.txt"
        onReset={() => {
          setTitle("")
          setWhen("")
          setItems("")
        }}
      />
    </PeopleToolShell>
  )
}

export function OneOnOneAgenda() {
  const [person, setPerson] = useState("")
  const [wins, setWins] = useState("")
  const [blockers, setBlockers] = useState("")
  const [actions, setActions] = useState("")
  const text = oneOnOneAgenda(person, wins, blockers, actions)

  return (
    <PeopleToolShell>
      <PrivacyNote>1:1 notes can be sensitive. They stay on this page. Copy them into your own notes if they should be kept.</PrivacyNote>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Field label="With">
            <Input value={person} onChange={(event) => setPerson(event.target.value)} className="h-11 sm:h-10" placeholder="Name" />
          </Field>
          <TextArea label="Since last time" value={wins} onChange={setWins} rows={4} />
          <TextArea label="Blockers" value={blockers} onChange={setBlockers} rows={3} />
          <TextArea label="Actions" value={actions} onChange={setActions} rows={3} />
        </div>
        <DocumentPreview label="Agenda" text={text} />
      </div>
      <CopyReset
        text={text}
        filename="one-on-one.txt"
        onReset={() => {
          setPerson("")
          setWins("")
          setBlockers("")
          setActions("")
        }}
      />
    </PeopleToolShell>
  )
}

export function TeamIcebreaker() {
  const [recent, setRecent] = useState<string[]>([icebreakers[0]])
  const [prompt, setPrompt] = useState(icebreakers[0])

  function draw() {
    const next = nextFromBag(icebreakers, recent)
    setPrompt(next)
    setRecent((current) => {
      const bag = [...current, next]
      return bag.length >= icebreakers.length ? [] : bag
    })
  }

  return (
    <PeopleToolShell>
      <PrivacyNote>A fixed list of light questions for a team meeting. Nothing is stored.</PrivacyNote>
      <ResultSection>
        <p className="max-w-xl text-2xl font-semibold tracking-[-0.03em] leading-snug">{prompt}</p>
      </ResultSection>
      <ActionBar>
        <Button type="button" className="h-10" onClick={draw}>
          Another prompt
        </Button>
        <CopyTextButton text={prompt} label="Copy prompt" />
      </ActionBar>
    </PeopleToolShell>
  )
}
