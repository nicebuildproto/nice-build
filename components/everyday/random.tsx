"use client"

import {
  ActionBar,
  CopyButton,
  EverydayToolShell,
  History,
  Note,
  PrimaryAction,
  ResetButton,
  ResultDisplay,
  ShareButton,
  useReducedMotion,
} from "@/components/everyday/kit"
import { NumberField, TextArea } from "@/components/tools/ui"
import { duplicateNote, joinList, parseList, removeAt } from "@/lib/everyday/picker"
import { flipCoin, randomInt, randomPick, randomUnit } from "@/lib/everyday/random"
import { wheelGradient, wheelWinner } from "@/lib/everyday/wheel"
import { cn } from "@/lib/utils"
import { useRef, useState } from "react"

const sampleNames = "Ava\nNoah\nMia\nLeo\nSofia"
const sampleChoices = "Ada\nLin\nNoor\nSam"

export function CoinFlip() {
  const [face, setFace] = useState<"Heads" | "Tails" | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const heads = history.filter((item) => item === "Heads").length
  const tails = history.length - heads

  function flip() {
    const next = flipCoin()
    setFace(next)
    setHistory((current) => [next, ...current].slice(0, 12))
  }

  const copy = face ? `${face}${history.length > 1 ? ` · ${heads} heads, ${tails} tails` : ""}` : ""

  return (
    <EverydayToolShell>
      <ResultDisplay label="Coin">{face ?? "—"}</ResultDisplay>
      <ActionBar>
        <PrimaryAction onClick={flip}>Flip</PrimaryAction>
        <CopyButton text={copy} />
        <ShareButton text={copy} title="Coin flip" />
        <ResetButton
          onClick={() => {
            setFace(null)
            setHistory([])
          }}
        />
      </ActionBar>
      {history.length > 1 ? (
        <Note>
          {heads} heads, {tails} tails. Each flip is independent.
        </Note>
      ) : (
        <Note>Even odds. The browser’s cryptographic random source picks the face.</Note>
      )}
      <History items={history} label="Recent flips" />
    </EverydayToolShell>
  )
}

export function RandomNumber() {
  const [min, setMin] = useState("1")
  const [max, setMax] = useState("100")
  const [value, setValue] = useState<number | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const low = Number(min)
  const high = Number(max)
  const ready = Number.isFinite(low) && Number.isFinite(high)

  function draw() {
    if (!ready) return
    const next = randomInt(low, high)
    setValue(next)
    setHistory((current) => [`${next} (${Math.min(low, high)}–${Math.max(low, high)})`, ...current].slice(0, 12))
  }

  const copy = value === null ? "" : String(value)

  return (
    <EverydayToolShell>
      <div className="grid max-w-md gap-4 sm:grid-cols-2">
        <NumberField label="Minimum" value={min} onChange={setMin} />
        <NumberField label="Maximum" value={max} onChange={setMax} />
      </div>
      <ResultDisplay label="Number">{value ?? "—"}</ResultDisplay>
      <ActionBar>
        <PrimaryAction onClick={draw} disabled={!ready}>
          Draw
        </PrimaryAction>
        <CopyButton text={copy} />
        <ShareButton text={copy} title="Random number" />
        <ResetButton
          onClick={() => {
            setMin("1")
            setMax("100")
            setValue(null)
            setHistory([])
          }}
        />
      </ActionBar>
      <Note>Whole numbers, including both ends. Ends swap if the minimum is higher.</Note>
      <History items={history} label="Recent numbers" />
    </EverydayToolShell>
  )
}

export function RandomChoice() {
  const [list, setList] = useState(sampleChoices)
  const [picked, setPicked] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const parsed = parseList(list)
  const note = duplicateNote(parsed)

  function pick() {
    const next = randomPick(parsed.items)
    if (next === undefined) return
    setPicked(next)
    setHistory((current) => [next, ...current].slice(0, 12))
  }

  return (
    <EverydayToolShell>
      <TextArea label="Options, one per line" value={list} onChange={setList} rows={8} placeholder="Paste a list" />
      {note ? <Note>{note}</Note> : <Note>{parsed.items.length} options. The list stays as you typed it.</Note>}
      <ResultDisplay label="Choice">{picked ?? "—"}</ResultDisplay>
      <ActionBar>
        <PrimaryAction onClick={pick} disabled={parsed.items.length === 0}>
          Pick
        </PrimaryAction>
        <CopyButton text={picked ?? ""} />
        <ShareButton text={picked ?? ""} title="Random choice" />
        <ResetButton
          onClick={() => {
            setList(sampleChoices)
            setPicked(null)
            setHistory([])
          }}
        />
      </ActionBar>
      <History items={history} label="Recent picks" />
    </EverydayToolShell>
  )
}

export function NamePicker() {
  const initial = sampleNames
  const [list, setList] = useState(initial)
  const [drawn, setDrawn] = useState<string | null>(null)
  const [remove, setRemove] = useState(true)
  const [history, setHistory] = useState<string[]>([])
  const parsed = parseList(list)
  const note = duplicateNote(parsed)

  function draw() {
    if (!parsed.items.length) return
    const index = randomInt(0, parsed.items.length - 1)
    const name = parsed.items[index]
    setDrawn(name)
    setHistory((current) => [name, ...current].slice(0, 12))
    if (remove) setList(joinList(removeAt(parsed.items, index)))
  }

  return (
    <EverydayToolShell>
      <TextArea label="Names, one per line" value={list} onChange={setList} rows={8} placeholder="Paste a list" />
      <label className="flex items-center gap-2 text-[13px] text-[var(--nb-primary)]">
        <input
          type="checkbox"
          checked={remove}
          onChange={(event) => setRemove(event.target.checked)}
          className="size-4"
        />
        Remove a name after it is drawn
      </label>
      {note ? <Note>{note}</Note> : null}
      <ResultDisplay label="Drawn name">{drawn ?? "—"}</ResultDisplay>
      <ActionBar>
        <PrimaryAction onClick={draw} disabled={parsed.items.length === 0}>
          Draw a name
        </PrimaryAction>
        <CopyButton text={drawn ?? ""} />
        <ShareButton text={drawn ?? ""} title="Name picker" />
        <ResetButton
          onClick={() => {
            setList(initial)
            setDrawn(null)
            setHistory([])
          }}
        />
      </ActionBar>
      <Note>{parsed.items.length} remaining</Note>
      <History items={history} label="Drawn names" />
    </EverydayToolShell>
  )
}

export function WheelSpinner() {
  const [text, setText] = useState(sampleChoices)
  const [angle, setAngle] = useState(0)
  const [winner, setWinner] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const names = parseList(text).items
  const note = duplicateNote(parseList(text))
  const reducedMotion = useReducedMotion()
  const timer = useRef(0)
  const namesRef = useRef(names)
  namesRef.current = names

  function spin() {
    if (!names.length || spinning) return
    const next = angle + (4 + randomInt(0, 2)) * 360 + randomUnit() * 360
    const picked = wheelWinner(names, next)
    setAngle(next)
    if (reducedMotion) {
      finish(picked?.name ?? null)
      return
    }
    setSpinning(true)
    setWinner(null)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      finish(picked?.name ?? null)
    }, 2400)
  }

  function finish(name: string | null) {
    setSpinning(false)
    setWinner(name)
    if (name) setHistory((current) => [name, ...current].slice(0, 12))
  }

  return (
    <EverydayToolShell>
      <TextArea label="Options, one per line" value={text} onChange={setText} rows={5} placeholder="Paste a list" />
      {note ? <Note>{note}</Note> : null}
      <div className="relative mx-auto grid size-64 place-items-center">
        <span className="absolute -top-1 z-10 text-[var(--nb-primary)]" aria-hidden>
          ▼
        </span>
        <div
          className={cn(
            "size-64 rounded-full border border-border",
            reducedMotion ? "" : "transition-transform duration-[2400ms] ease-out",
          )}
          style={{ transform: `rotate(${angle}deg)`, background: wheelGradient(names.length) }}
          aria-hidden
        />
        <span className="sr-only">{names.length ? `${names.length} equal slices` : "Add options to spin"}</span>
      </div>
      <ActionBar>
        <PrimaryAction onClick={spin} disabled={!names.length || spinning}>
          Spin
        </PrimaryAction>
        <CopyButton text={winner ?? ""} />
        <ShareButton text={winner ?? ""} title="Wheel spinner" />
        <ResetButton
          onClick={() => {
            window.clearTimeout(timer.current)
            setText(sampleChoices)
            setAngle(0)
            setWinner(null)
            setSpinning(false)
            setHistory([])
          }}
        />
      </ActionBar>
      <ResultDisplay label="Winner">{spinning ? "…" : (winner ?? "—")}</ResultDisplay>
      <Note>The pointer is at the top. The winner is whoever lands there, not a separate pick after the spin.</Note>
      <History items={history} label="Recent winners" />
    </EverydayToolShell>
  )
}
